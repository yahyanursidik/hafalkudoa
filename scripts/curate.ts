import { buildChunks, type DuaChunk } from "../src/content/chunking.js";
import { buildCurationPlan, summarizePlan, type CuratableDua, type CurationDecision } from "../src/content/curation.js";
import { getDatabase } from "../src/db/client.js";
import { logger } from "../src/lib/logger.js";

type Row = Record<string, unknown>;

function rows(result: unknown): Row[] {
  return Array.isArray(result) ? result.filter((entry): entry is Row => typeof entry === "object" && entry !== null) : [];
}

function text(row: Row, field: string): string {
  return typeof row[field] === "string" ? row[field] : "";
}

async function loadActiveDua(): Promise<(CuratableDua & { latin: string })[]> {
  const result = await getDatabase().query(
    `SELECT item.id, item.title, item.group_name, item.arabic, item.latin,
            ARRAY(
              SELECT tag.name
              FROM dua_tags tag
              INNER JOIN dua_item_tags item_tag ON item_tag.tag_id = tag.id
              WHERE item_tag.dua_id = item.id
              ORDER BY tag.name
            ) AS tags
     FROM dua_items item
     WHERE item.status = 'ACTIVE'`,
  );

  return rows(result).map((row) => ({
    id: text(row, "id"),
    title: text(row, "title"),
    group: typeof row.group_name === "string" ? row.group_name : null,
    arabic: text(row, "arabic"),
    latin: text(row, "latin"),
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
  }));
}

/** Neon HTTP charges a round trip per statement, so writes go out in batches. */
async function insertBatched(
  table: string,
  columns: readonly string[],
  values: readonly (readonly unknown[])[],
  batchSize = 40,
): Promise<void> {
  const database = getDatabase();
  for (let offset = 0; offset < values.length; offset += batchSize) {
    const batch = values.slice(offset, offset + batchSize);
    const placeholders = batch
      .map((_row, rowIndex) => {
        const slots = columns.map((_column, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`);
        return `(${slots.join(", ")})`;
      })
      .join(", ");
    await database.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}`,
      batch.flatMap((row) => [...row]),
    );
  }
}

function reportPlan(plan: readonly CurationDecision[]): void {
  const summary = summarizePlan(plan);
  logger.info("curation_plan", { total: plan.length, ...summary });

  const byChapter = new Map<string, { kids: number; total: number }>();
  plan.forEach((entry) => {
    const bucket = byChapter.get(entry.chapter) ?? { kids: 0, total: 0 };
    bucket.total += 1;
    bucket.kids += entry.audience === "KIDS" ? 1 : 0;
    byChapter.set(entry.chapter, bucket);
  });

  [...byChapter.entries()].forEach(([chapter, bucket]) => {
    console.log(`${String(bucket.kids).padStart(3)} kids / ${String(bucket.total).padStart(3)} total  ${chapter}`);
  });
}

async function plan(): Promise<void> {
  reportPlan(buildCurationPlan(await loadActiveDua()));
}

async function apply(): Promise<void> {
  const items = await loadActiveDua();
  const decisions = buildCurationPlan(items);

  await getDatabase().query("DELETE FROM dua_curation");
  await insertBatched(
    "dua_curation",
    ["dua_id", "audience", "chapter", "chapter_order", "difficulty", "display_order", "curation_rule"],
    decisions.map((entry) => [
      entry.duaId,
      entry.audience,
      entry.chapter,
      entry.chapterOrder,
      entry.difficulty,
      entry.displayOrder,
      entry.curationRule,
    ]),
  );

  reportPlan(decisions);
  logger.info("curation_applied", { curated: decisions.length });
}

async function chunks(): Promise<void> {
  const items = await loadActiveDua();
  const values: unknown[][] = [];
  let skipped = 0;

  items.forEach((item) => {
    const itemChunks: DuaChunk[] = buildChunks(item.arabic, item.latin);
    if (itemChunks.length === 0) {
      skipped += 1;
      return;
    }
    itemChunks.forEach((chunk) => {
      values.push([item.id, chunk.sequence, chunk.arabicStart, chunk.arabicEnd, chunk.latinSegment, chunk.visualGroup]);
    });
  });

  await getDatabase().query("DELETE FROM dua_chunks");
  await insertBatched(
    "dua_chunks",
    ["dua_id", "sequence", "arabic_start", "arabic_end", "latin_segment", "visual_group"],
    values,
  );

  logger.info("chunks_rebuilt", { items: items.length - skipped, chunks: values.length, skipped });
}

async function report(): Promise<void> {
  const result = await getDatabase().query(
    `SELECT curation.audience, count(*)::int AS items, count(chunk.dua_id)::int AS chunked
     FROM dua_curation curation
     LEFT JOIN LATERAL (SELECT DISTINCT dua_id FROM dua_chunks WHERE dua_id = curation.dua_id) chunk ON TRUE
     GROUP BY curation.audience
     ORDER BY curation.audience`,
  );
  rows(result).forEach((row) => {
    console.log(`${text(row, "audience").padEnd(7)} items=${String(row.items)} chunked=${String(row.chunked)}`);
  });
}

const commands: Record<string, () => Promise<void>> = { plan, apply, chunks, report };

async function main(): Promise<void> {
  const command = process.argv[2] ?? "plan";
  const run = commands[command];
  if (!run) {
    throw new Error(`Unknown command: ${command}. Use one of ${Object.keys(commands).join(", ")}.`);
  }
  await run();
}

main().catch((error: unknown) => {
  logger.error("curate_failed", { error: error instanceof Error ? error.message : "unknown error" });
  process.exitCode = 1;
});
