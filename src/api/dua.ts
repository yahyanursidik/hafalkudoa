import { z } from "zod";

import { AppError } from "../lib/errors.js";

export type Queryable = {
  query: (query: string, params?: unknown[]) => Promise<unknown>;
};

type Row = Record<string, unknown>;

function rows(result: unknown): Row[] {
  return Array.isArray(result) ? result.filter((entry): entry is Row => typeof entry === "object" && entry !== null) : [];
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

const nonBlankText = z.string().refine((value) => value.trim().length > 0, { message: "must not be blank" });

export const duaAudienceSchema = z.enum(["KIDS", "FAMILY", "ADULT"]);
export type DuaAudience = z.infer<typeof duaAudienceSchema>;

/** Presentation metadata only. It never replaces or edits canonical content. */
export const duaCurationSchema = z.object({
  audience: duaAudienceSchema,
  chapter: nonBlankText,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const duaChunkSchema = z.object({
  sequence: z.number().int().nonnegative(),
  arabicStart: z.number().int().nonnegative(),
  arabicEnd: z.number().int().positive(),
  latinSegment: z.string(),
  visualGroup: z.number().int().min(1).max(5),
});

const publicDuaBaseSchema = z.object({
  id: nonBlankText,
  externalId: nonBlankText,
  title: nonBlankText,
  group: z.string().nullable(),
  tags: z.array(nonBlankText),
  curation: duaCurationSchema.nullable(),
});

export const publicDuaDetailSchema = publicDuaBaseSchema.extend({
  arabic: nonBlankText,
  latin: nonBlankText,
  translation: nonBlankText,
  source: nonBlankText,
  chunks: z.array(duaChunkSchema),
});

export type PublicDuaDetail = z.infer<typeof publicDuaDetailSchema>;
export type PublicDuaListItem = z.infer<typeof publicDuaBaseSchema>;

function toCuration(row: Row): unknown {
  if (typeof row.audience !== "string") {
    return null;
  }
  return { audience: row.audience, chapter: row.chapter, difficulty: Number(row.difficulty) };
}

function toChunks(value: unknown): unknown {
  return Array.isArray(value) ? value : [];
}

function toPublicDuaDetail(row: Row): PublicDuaDetail {
  const result = publicDuaDetailSchema.safeParse({
    id: row.id,
    externalId: row.external_id,
    title: row.title,
    arabic: row.arabic,
    latin: row.latin,
    translation: row.translation_id,
    source: row.source_reference,
    group: typeof row.group_name === "string" ? row.group_name : null,
    tags: textArray(row.tags),
    curation: toCuration(row),
    chunks: toChunks(row.chunks),
  });
  if (!result.success) {
    throw new AppError(500, "INTERNAL_ERROR", "Active content failed integrity validation.");
  }
  return result.data;
}

function toPublicDuaListItem(row: Row): PublicDuaListItem {
  const parsed = publicDuaBaseSchema.safeParse({
    id: row.id,
    externalId: row.external_id,
    title: row.title,
    group: typeof row.group_name === "string" ? row.group_name : null,
    tags: textArray(row.tags),
    curation: toCuration(row),
  });
  if (!parsed.success) {
    throw new AppError(500, "INTERNAL_ERROR", "Active content failed integrity validation.");
  }
  return parsed.data;
}

const activeDuaSelect = `
  SELECT item.id, item.external_id, item.title, item.group_name, item.arabic, item.latin,
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
  WHERE item.status = 'ACTIVE'`;

const listOrder = "ORDER BY curation.display_order NULLS LAST, item.group_name NULLS LAST, item.title";

export type ListActiveDuaOptions = {
  audience?: DuaAudience;
};

export async function listActiveDua(
  database: Queryable,
  options: ListActiveDuaOptions = {},
): Promise<PublicDuaListItem[]> {
  const result = options.audience
    ? await database.query(`${activeDuaSelect} AND curation.audience = $1 ${listOrder}`, [options.audience])
    : await database.query(`${activeDuaSelect} ${listOrder}`);
  return rows(result).map(toPublicDuaListItem);
}

export function parseAudience(value: unknown): DuaAudience | undefined {
  if (value === undefined || value === "" || value === "ALL") {
    return undefined;
  }
  const parsed = duaAudienceSchema.safeParse(typeof value === "string" ? value.toUpperCase() : value);
  if (!parsed.success) {
    throw new AppError(400, "BAD_REQUEST", "audience must be one of KIDS, FAMILY, ADULT, ALL.");
  }
  return parsed.data;
}

const duaIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDuaId(value: string): boolean {
  return duaIdPattern.test(value);
}

export async function getActiveDua(database: Queryable, id: string): Promise<PublicDuaDetail> {
  if (!isDuaId(id)) {
    throw new AppError(404, "NOT_FOUND", "Doa not found.");
  }

  const result = await database.query(`${activeDuaSelect} AND item.id = $1`, [id]);
  const row = rows(result)[0];
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Doa not found.");
  }
  return toPublicDuaDetail(row);
}

export async function listActiveGroups(database: Queryable): Promise<string[]> {
  const result = await database.query(
    `SELECT DISTINCT group_name
     FROM dua_items
     WHERE status = 'ACTIVE' AND group_name IS NOT NULL AND BTRIM(group_name) <> ''
     ORDER BY group_name`,
  );
  return rows(result).flatMap((row) => (typeof row.group_name === "string" ? [row.group_name] : []));
}

export type DuaChapter = {
  chapter: string;
  total: number;
  kids: number;
};

export async function listActiveChapters(database: Queryable): Promise<DuaChapter[]> {
  const result = await database.query(
    `SELECT curation.chapter,
            count(*)::int AS total,
            count(*) FILTER (WHERE curation.audience = 'KIDS')::int AS kids,
            min(curation.chapter_order) AS chapter_order,
            min(curation.display_order) AS display_order
     FROM dua_curation curation
     INNER JOIN dua_items item ON item.id = curation.dua_id
     WHERE item.status = 'ACTIVE'
     GROUP BY curation.chapter
     ORDER BY chapter_order, display_order`,
  );
  return rows(result).flatMap((row) => {
    return typeof row.chapter === "string"
      ? [{ chapter: row.chapter, total: Number(row.total), kids: Number(row.kids) }]
      : [];
  });
}

export async function listActiveTags(database: Queryable): Promise<{ slug: string; name: string }[]> {
  const result = await database.query(
    `SELECT DISTINCT tag.slug, tag.name
     FROM dua_tags tag
     INNER JOIN dua_item_tags item_tag ON item_tag.tag_id = tag.id
     INNER JOIN dua_items item ON item.id = item_tag.dua_id
     WHERE item.status = 'ACTIVE'
     ORDER BY tag.name`,
  );
  return rows(result).flatMap((row) => {
    return typeof row.slug === "string" && typeof row.name === "string" ? [{ slug: row.slug, name: row.name }] : [];
  });
}

export { toPublicDuaDetail };
