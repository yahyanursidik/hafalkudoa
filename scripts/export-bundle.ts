/**
 * Exports the curated ACTIVE catalogue to a static JSON bundle the browser can
 * read on its own. The app then needs no database and no upstream API at run
 * time: the deployment serves content it already carries.
 *
 * The bundle is generated, never hand-edited. Every field is copied verbatim
 * from the reviewed rows, so a regenerated bundle is a reviewable git diff
 * (06-CONTENT-INTEGRITY.md).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listActiveChapters, listActiveDua, publicDuaDetailSchema } from "../src/api/dua.js";
import { getDatabase } from "../src/db/client.js";
import { logger } from "../src/lib/logger.js";

const bundlePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../web/public/content/dua.json",
);

type Row = Record<string, unknown>;

function rows(result: unknown): Row[] {
  return Array.isArray(result) ? result.filter((entry): entry is Row => typeof entry === "object" && entry !== null) : [];
}

async function main(): Promise<void> {
  const database = getDatabase();

  const listed = await listActiveDua(database);
  const chapters = await listActiveChapters(database);

  const result = await database.query(
    `SELECT item.id, item.external_id, item.title, item.group_name, item.arabic, item.latin,
            item.translation_id, item.source_reference,
            curation.audience, curation.chapter, curation.difficulty, curation.display_order,
            ARRAY(
              SELECT tag.name
              FROM dua_tags tag
              INNER JOIN dua_item_tags item_tag ON item_tag.tag_id = tag.id
              WHERE item_tag.dua_id = item.id
              ORDER BY tag.name
            ) AS tags,
            COALESCE(
              (
                SELECT json_agg(
                         json_build_object(
                           'sequence', chunk.sequence,
                           'arabicStart', chunk.arabic_start,
                           'arabicEnd', chunk.arabic_end,
                           'latinSegment', chunk.latin_segment,
                           'visualGroup', chunk.visual_group
                         )
                         ORDER BY chunk.sequence
                       )
                FROM dua_chunks chunk
                WHERE chunk.dua_id = item.id
              ),
              '[]'::json
            ) AS chunks
     FROM dua_items item
     LEFT JOIN dua_curation curation ON curation.dua_id = item.id
     WHERE item.status = 'ACTIVE'
     ORDER BY curation.display_order NULLS LAST, item.group_name NULLS LAST, item.title`,
  );

  const items = rows(result).map((row) => {
    return publicDuaDetailSchema.parse({
      id: row.id,
      externalId: row.external_id,
      title: row.title,
      arabic: row.arabic,
      latin: row.latin,
      translation: row.translation_id,
      source: row.source_reference,
      group: typeof row.group_name === "string" ? row.group_name : null,
      tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
      curation:
        typeof row.audience === "string"
          ? { audience: row.audience, chapter: row.chapter, difficulty: Number(row.difficulty) }
          : null,
      chunks: Array.isArray(row.chunks) ? row.chunks : [],
    });
  });

  if (items.length !== listed.length) {
    throw new Error(`Bundle would drop items: ${listed.length} active, ${items.length} exported.`);
  }

  await mkdir(path.dirname(bundlePath), { recursive: true });
  await writeFile(bundlePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), chapters, items }, null, 2)}\n`, "utf8");

  logger.info("bundle_exported", { items: items.length, chapters: chapters.length, path: "web/public/content/dua.json" });
}

main().catch((error: unknown) => {
  logger.error("bundle_export_failed", { error: error instanceof Error ? error.message : "unknown error" });
  process.exitCode = 1;
});
