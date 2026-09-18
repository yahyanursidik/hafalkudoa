import { activeDuaContentSchema } from "./validation.js";
import { getDatabase } from "../db/client.js";

type Row = Record<string, unknown>;

function rows(result: unknown): Row[] {
  return Array.isArray(result) ? result.filter((entry): entry is Row => typeof entry === "object" && entry !== null) : [];
}

function text(row: Row, field: string): string | null {
  return typeof row[field] === "string" ? row[field] : null;
}

export type ReviewItem = {
  id: string;
  externalId: string;
  status: string;
  title: string | null;
  group: string | null;
  arabic: string | null;
  latin: string | null;
  translation: string | null;
  sourceReference: string | null;
  contentHash: string | null;
  tags: string[];
};

async function fetchTags(duaId: string): Promise<string[]> {
  const result = await getDatabase().query(
    `SELECT tag.name
     FROM dua_tags tag
     INNER JOIN dua_item_tags item_tag ON item_tag.tag_id = tag.id
     WHERE item_tag.dua_id = $1
     ORDER BY tag.name`,
    [duaId],
  );
  return rows(result).flatMap((row) => (typeof row.name === "string" ? [row.name] : []));
}

async function fetchItem(id: string): Promise<ReviewItem | null> {
  const result = await getDatabase().query(
    `SELECT id, external_id, status, title, group_name, arabic, latin,
            translation_id, source_reference, content_hash
     FROM dua_items WHERE id = $1`,
    [id],
  );
  const row = rows(result)[0];
  if (!row || typeof row.id !== "string" || typeof row.external_id !== "string" || typeof row.status !== "string") {
    return null;
  }
  return {
    id: row.id,
    externalId: row.external_id,
    status: row.status,
    title: text(row, "title"),
    group: text(row, "group_name"),
    arabic: text(row, "arabic"),
    latin: text(row, "latin"),
    translation: text(row, "translation_id"),
    sourceReference: text(row, "source_reference"),
    contentHash: text(row, "content_hash"),
    tags: await fetchTags(row.id),
  };
}

export function requireActivatable(item: ReviewItem): void {
  const validated = activeDuaContentSchema.safeParse({
    externalId: item.externalId,
    arabic: item.arabic,
    latin: item.latin,
    translationId: item.translation,
    sourceReference: item.sourceReference,
    contentHash: item.contentHash,
  });
  if (!validated.success) {
    throw new Error(`Candidate ${item.id} does not meet ACTIVE content requirements.`);
  }
}

export function requireApprovedStatus(item: ReviewItem): void {
  if (item.status !== "APPROVED") {
    throw new Error(`Only APPROVED candidates can be activated; current status is ${item.status}.`);
  }
}

export async function getReview(candidateId: string): Promise<{ candidate: ReviewItem; active: ReviewItem | null }> {
  const candidate = await fetchItem(candidateId);
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} was not found.`);
  }
  if (candidate.status !== "REVIEW_REQUIRED" && candidate.status !== "APPROVED") {
    throw new Error(`Candidate ${candidateId} is not reviewable from status ${candidate.status}.`);
  }

  const activeResult = await getDatabase().query(
    `SELECT id FROM dua_items
     WHERE external_id = $1 AND status = 'ACTIVE'
     ORDER BY activated_at DESC NULLS LAST LIMIT 1`,
    [candidate.externalId],
  );
  const activeId = rows(activeResult)[0]?.id;
  return {
    candidate,
    active: typeof activeId === "string" ? await fetchItem(activeId) : null,
  };
}

export async function approveCandidate(candidateId: string): Promise<ReviewItem> {
  const candidate = await fetchItem(candidateId);
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} was not found.`);
  }
  if (candidate.status !== "REVIEW_REQUIRED") {
    throw new Error(`Only REVIEW_REQUIRED candidates can be approved; current status is ${candidate.status}.`);
  }
  requireActivatable(candidate);

  const result = await getDatabase().query(
    `UPDATE dua_items
     SET status = 'APPROVED', updated_at = NOW()
     WHERE id = $1 AND status = 'REVIEW_REQUIRED'
     RETURNING id`,
    [candidateId],
  );
  if (rows(result).length !== 1) {
    throw new Error(`Candidate ${candidateId} could not be approved due to a concurrent status change.`);
  }
  return (await fetchItem(candidateId))!;
}

export async function activateCandidate(candidateId: string): Promise<ReviewItem> {
  const candidate = await fetchItem(candidateId);
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} was not found.`);
  }
  requireApprovedStatus(candidate);
  requireActivatable(candidate);

  const database = getDatabase();
  const results = await database.transaction((transaction) => [
    transaction.query(
      `UPDATE dua_items
       SET status = 'APPROVED', activated_at = NULL, updated_at = NOW()
       WHERE external_id = $1 AND status = 'ACTIVE'`,
      [candidate.externalId],
    ),
    transaction.query(
      `UPDATE dua_items
       SET status = 'ACTIVE', activated_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'APPROVED'
       RETURNING id`,
      [candidateId],
    ),
  ]);
  if (rows(results[1]).length !== 1) {
    throw new Error(`Candidate ${candidateId} could not be activated due to a concurrent status change.`);
  }
  return (await fetchItem(candidateId))!;
}

/**
 * Publishes the latest valid review candidate per upstream ID in one explicit
 * transaction. This is intentionally separate from normal individual review.
 */
export async function publishAllReviewCandidates(): Promise<{ activated: number }> {
  const candidateRows = await getDatabase().query(
    `SELECT id FROM dua_items WHERE status = 'REVIEW_REQUIRED' ORDER BY created_at, id`,
  );
  const candidates = await Promise.all(
    rows(candidateRows).flatMap((row) => (typeof row.id === "string" ? [fetchItem(row.id)] : [])),
  );

  for (const candidate of candidates) {
    if (candidate) {
      requireActivatable(candidate);
    }
  }

  const database = getDatabase();
  const results = await database.transaction((transaction) => [
    transaction.query(
      `WITH selected AS (
         SELECT DISTINCT ON (external_id) id, external_id
         FROM dua_items
         WHERE status = 'REVIEW_REQUIRED'
         ORDER BY external_id, created_at DESC
       )
       UPDATE dua_items AS item
       SET status = 'APPROVED', activated_at = NULL, updated_at = NOW()
       FROM selected
       WHERE item.external_id = selected.external_id AND item.status = 'ACTIVE'`,
    ),
    transaction.query(
      `WITH selected AS (
         SELECT DISTINCT ON (external_id) id
         FROM dua_items
         WHERE status = 'REVIEW_REQUIRED'
         ORDER BY external_id, created_at DESC
       )
       UPDATE dua_items AS item
       SET status = 'ACTIVE', activated_at = NOW(), updated_at = NOW()
       FROM selected
       WHERE item.id = selected.id
       RETURNING item.id`,
    ),
  ]);

  return { activated: rows(results[1]).length };
}
