import { getDatabase } from "../src/db/client.js";
import { diffDua, type DuaComparison } from "../src/content/importer.js";
import { syncCandidateDua, syncValidCandidateDua } from "../src/content/sync.js";
import { activateCandidate, approveCandidate, getReview, publishAllReviewCandidates } from "../src/content/review.js";
import { logger } from "../src/lib/logger.js";
import { fetchEQuranDuaList } from "../src/upstream/equran/client.js";

type Row = Record<string, unknown>;

function rows(result: unknown): Row[] {
  return Array.isArray(result) ? result.filter((entry): entry is Row => typeof entry === "object" && entry !== null) : [];
}

function asComparison(row: Row): DuaComparison {
  const text = (field: string): string | null => (typeof row[field] === "string" ? row[field] : null);
  return {
    title: text("title") ?? "",
    group: text("group_name"),
    arabic: text("arabic") ?? "",
    latin: text("latin") ?? "",
    translation: text("translation_id") ?? "",
    sourceReference: text("source_reference") ?? "",
    contentHash: text("content_hash") ?? "",
  };
}

async function sync(): Promise<void> {
  const response = await fetchEQuranDuaList();
  const result = await syncCandidateDua(response.data);
  logger.info("doa_sync_completed", result);
}

async function validate(): Promise<void> {
  const result = await getDatabase().query(
    `SELECT id, external_id, arabic, latin, translation_id, source_reference
     FROM dua_items
     WHERE status = 'REVIEW_REQUIRED'
       AND (
         external_id IS NULL OR BTRIM(external_id) = ''
         OR arabic IS NULL OR BTRIM(arabic) = ''
         OR latin IS NULL OR BTRIM(latin) = ''
         OR translation_id IS NULL OR BTRIM(translation_id) = ''
         OR source_reference IS NULL OR BTRIM(source_reference) = ''
       )`,
  );
  const invalid = rows(result);
  if (invalid.length > 0) {
    throw new Error(`Found ${invalid.length} invalid REVIEW_REQUIRED doa item(s).`);
  }
  logger.info("doa_validation_completed", { invalidCandidates: 0 });
}

async function syncValid(): Promise<void> {
  const response = await fetchEQuranDuaList();
  const result = await syncValidCandidateDua(response.data);
  logger.info("doa_partial_sync_completed", result);
}

async function diff(externalId?: string): Promise<void> {
  const result = await getDatabase().query(
    `SELECT candidate.external_id, candidate.title, candidate.group_name, candidate.arabic,
            candidate.latin, candidate.translation_id, candidate.source_reference, candidate.content_hash,
            active.title AS active_title, active.group_name AS active_group_name, active.arabic AS active_arabic,
            active.latin AS active_latin, active.translation_id AS active_translation_id,
            active.source_reference AS active_source_reference, active.content_hash AS active_content_hash
     FROM dua_items candidate
     LEFT JOIN LATERAL (
       SELECT title, group_name, arabic, latin, translation_id, source_reference, content_hash
       FROM dua_items
       WHERE external_id = candidate.external_id AND status = 'ACTIVE'
       ORDER BY activated_at DESC NULLS LAST
       LIMIT 1
     ) active ON true
     WHERE candidate.status = 'REVIEW_REQUIRED'
       AND ($1::text IS NULL OR candidate.external_id = $1)
     ORDER BY candidate.external_id, candidate.created_at`,
    [externalId ?? null],
  );

  const report = rows(result).map((row) => {
    const previous: DuaComparison | null = row.active_content_hash === null ? null : {
      title: typeof row.active_title === "string" ? row.active_title : "",
      group: typeof row.active_group_name === "string" ? row.active_group_name : null,
      arabic: typeof row.active_arabic === "string" ? row.active_arabic : "",
      latin: typeof row.active_latin === "string" ? row.active_latin : "",
      translation: typeof row.active_translation_id === "string" ? row.active_translation_id : "",
      sourceReference: typeof row.active_source_reference === "string" ? row.active_source_reference : "",
      contentHash: typeof row.active_content_hash === "string" ? row.active_content_hash : "",
    };
    return { externalId: row.external_id, changes: diffDua(previous, asComparison(row)) };
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

async function review(candidateId?: string): Promise<void> {
  if (!candidateId) {
    throw new Error("Usage: doa.ts review <candidate-id>");
  }
  process.stdout.write(`${JSON.stringify(await getReview(candidateId), null, 2)}\n`);
}

async function approve(candidateId?: string): Promise<void> {
  if (!candidateId) {
    throw new Error("Usage: doa.ts approve <candidate-id>");
  }
  const result = await approveCandidate(candidateId);
  logger.info("doa_candidate_approved", { candidateId: result.id, externalId: result.externalId });
}

async function activate(candidateId?: string, confirmation?: string): Promise<void> {
  if (!candidateId || confirmation !== "--confirm") {
    throw new Error("Usage: doa.ts activate <candidate-id> --confirm");
  }
  const result = await activateCandidate(candidateId);
  logger.info("doa_candidate_activated", { candidateId: result.id, externalId: result.externalId });
}

async function publishAll(confirmation?: string): Promise<void> {
  if (confirmation !== "--confirm") {
    throw new Error("Usage: doa.ts publish-all --confirm");
  }
  const result = await publishAllReviewCandidates();
  logger.info("doa_candidates_published", result);
}

async function main(): Promise<void> {
  const [command, identifier, confirmation] = process.argv.slice(2);
  switch (command) {
    case "sync":
      await sync();
      return;
    case "sync-valid":
      await syncValid();
      return;
    case "validate":
      await validate();
      return;
    case "diff":
      await diff(identifier);
      return;
    case "review":
      await review(identifier);
      return;
    case "approve":
      await approve(identifier);
      return;
    case "activate":
      await activate(identifier, confirmation);
      return;
    case "publish-all":
      await publishAll(identifier);
      return;
    default:
      throw new Error("Usage: doa.ts <sync|sync-valid|validate|diff|review|approve|activate|publish-all> [id]");
  }
}

main().catch((error: unknown) => {
  logger.error("doa_command_failed", { error: error instanceof Error ? error.message : "unknown error" });
  process.exitCode = 1;
});
