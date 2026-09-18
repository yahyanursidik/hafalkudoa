import { getDatabase } from "../db/client.js";
import type { EQuranDua } from "../upstream/equran/schema.js";
import {
  contentHash,
  hashImportedDua,
  ImportValidationError,
  mapEQuranDua,
  type ImportedDua,
} from "./importer.js";

type Row = Record<string, unknown>;

function rows(result: unknown): Row[] {
  return Array.isArray(result) ? result.filter((entry): entry is Row => typeof entry === "object" && entry !== null) : [];
}

function requiredId(result: unknown, label: string): string {
  const id = rows(result)[0]?.id;
  if (typeof id !== "string") {
    throw new Error(`${label} did not return an id.`);
  }
  return id;
}

export type SyncResult = {
  batchId: string;
  rawImported: number;
  candidatesCreated: number;
  unchangedActive: number;
};

export type InvalidUpstreamDua = {
  externalId: string;
  issues: string[];
};

export type PartialSyncResult = SyncResult & {
  invalid: InvalidUpstreamDua[];
};

async function recordRawImport(batchId: string, externalId: string, raw: unknown): Promise<void> {
  const database = getDatabase();
  await database.query(
    `INSERT INTO dua_raw_imports (batch_id, external_id, raw_payload_json, content_hash)
     VALUES ($1, $2, $3::jsonb, $4)`,
    [batchId, externalId, JSON.stringify(raw), contentHash(raw)],
  );
}

async function activeHashFor(externalId: string): Promise<string | null> {
  const result = await getDatabase().query(
    `SELECT content_hash
     FROM dua_items
     WHERE external_id = $1 AND status = 'ACTIVE'
     ORDER BY activated_at DESC NULLS LAST
     LIMIT 1`,
    [externalId],
  );
  const value = rows(result)[0]?.content_hash;
  return typeof value === "string" ? value : null;
}

async function createReviewCandidate(batchId: string, dua: ImportedDua, hash: string): Promise<string> {
  const created = await getDatabase().query(
    `INSERT INTO dua_items (
       external_id, title, group_name, arabic, latin, translation_id,
       source_reference, content_hash, status, import_batch_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'REVIEW_REQUIRED', $9)
     RETURNING id`,
    [
      dua.externalId,
      dua.title,
      dua.group,
      dua.arabic,
      dua.latin,
      dua.translation,
      dua.sourceReference,
      hash,
      batchId,
    ],
  );
  return requiredId(created, "Review candidate");
}

function tagSlug(tag: string): string {
  return tag.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, "-");
}

async function attachTags(duaId: string, tags: string[]): Promise<void> {
  const database = getDatabase();
  for (const tag of tags) {
    const tagRow = await database.query(
      `INSERT INTO dua_tags (slug, name)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tagSlug(tag), tag.trim()],
    );
    const tagId = requiredId(tagRow, "Dua tag");
    await database.query(
      `INSERT INTO dua_item_tags (dua_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [duaId, tagId],
    );
  }
}

export function partitionImportedDua(upstreamDua: EQuranDua[]): {
  valid: ImportedDua[];
  invalid: InvalidUpstreamDua[];
} {
  const valid: ImportedDua[] = [];
  const invalid: InvalidUpstreamDua[] = [];

  for (const upstream of upstreamDua) {
    try {
      valid.push(mapEQuranDua(upstream));
    } catch (error) {
      if (error instanceof ImportValidationError) {
        invalid.push({ externalId: error.externalId, issues: error.issues });
        continue;
      }
      throw error;
    }
  }

  return { valid, invalid };
}

async function startBatch(upstreamDua: EQuranDua[]): Promise<string> {
  const startedBatch = await getDatabase().query(
    `INSERT INTO dua_import_batches (upstream_url, status, item_count, checksum)
     VALUES ($1, 'STARTED', $2, $3)
     RETURNING id`,
    ["https://equran.id/api/doa", upstreamDua.length, contentHash(upstreamDua)],
  );
  return requiredId(startedBatch, "Import batch");
}

async function persistCandidates(batchId: string, candidates: ImportedDua[]): Promise<Omit<SyncResult, "batchId" | "rawImported">> {
  let candidatesCreated = 0;
  let unchangedActive = 0;
  for (const candidate of candidates) {
    const candidateHash = hashImportedDua(candidate);
    if ((await activeHashFor(candidate.externalId)) === candidateHash) {
      unchangedActive += 1;
      continue;
    }
    const candidateId = await createReviewCandidate(batchId, candidate, candidateHash);
    await attachTags(candidateId, candidate.tags);
    candidatesCreated += 1;
  }
  return { candidatesCreated, unchangedActive };
}

export async function syncCandidateDua(upstreamDua: EQuranDua[]): Promise<SyncResult> {
  const database = getDatabase();
  const batchId = await startBatch(upstreamDua);

  try {
    for (const upstream of upstreamDua) {
      await recordRawImport(batchId, String(upstream.id), upstream);
    }
    const candidates = upstreamDua.map(mapEQuranDua);
    const persisted = await persistCandidates(batchId, candidates);

    await database.query(
      `UPDATE dua_import_batches
       SET completed_at = NOW(), status = 'COMPLETED'
       WHERE id = $1`,
      [batchId],
    );
    return { batchId, rawImported: upstreamDua.length, ...persisted };
  } catch (error) {
    await database.query(
      `UPDATE dua_import_batches
       SET completed_at = NOW(), status = 'FAILED'
       WHERE id = $1`,
      [batchId],
    );
    throw error;
  }
}

/**
 * Explicit recovery path for an upstream response with malformed items.
 * Raw payloads remain retained, while only fully valid candidates proceed.
 */
export async function syncValidCandidateDua(upstreamDua: EQuranDua[]): Promise<PartialSyncResult> {
  const database = getDatabase();
  const batchId = await startBatch(upstreamDua);

  try {
    for (const upstream of upstreamDua) {
      await recordRawImport(batchId, String(upstream.id), upstream);
    }
    const { valid, invalid } = partitionImportedDua(upstreamDua);
    const persisted = await persistCandidates(batchId, valid);

    await database.query(
      `UPDATE dua_import_batches
       SET completed_at = NOW(), status = 'COMPLETED'
       WHERE id = $1`,
      [batchId],
    );
    return { batchId, rawImported: upstreamDua.length, ...persisted, invalid };
  } catch (error) {
    await database.query(
      `UPDATE dua_import_batches
       SET completed_at = NOW(), status = 'FAILED'
       WHERE id = $1`,
      [batchId],
    );
    throw error;
  }
}
