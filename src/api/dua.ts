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

export const publicDuaDetailSchema = z.object({
  id: nonBlankText,
  externalId: nonBlankText,
  title: nonBlankText,
  arabic: nonBlankText,
  latin: nonBlankText,
  translation: nonBlankText,
  source: nonBlankText,
  group: z.string().nullable(),
  tags: z.array(nonBlankText),
});

export type PublicDuaDetail = z.infer<typeof publicDuaDetailSchema>;
export type PublicDuaListItem = Pick<PublicDuaDetail, "id" | "externalId" | "title" | "group" | "tags">;

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
  });
  if (!result.success) {
    throw new AppError(500, "INTERNAL_ERROR", "Active content failed integrity validation.");
  }
  return result.data;
}

function toPublicDuaListItem(row: Row): PublicDuaListItem {
  const parsed = z
    .object({
      id: nonBlankText,
      externalId: nonBlankText,
      title: nonBlankText,
      group: z.string().nullable(),
      tags: z.array(nonBlankText),
    })
    .safeParse({
      id: row.id,
      externalId: row.external_id,
      title: row.title,
      group: typeof row.group_name === "string" ? row.group_name : null,
      tags: textArray(row.tags),
    });
  if (!parsed.success) {
    throw new AppError(500, "INTERNAL_ERROR", "Active content failed integrity validation.");
  }
  return parsed.data;
}

const activeDuaSelect = `
  SELECT item.id, item.external_id, item.title, item.group_name, item.arabic, item.latin,
         item.translation_id, item.source_reference,
         ARRAY(
           SELECT tag.name
           FROM dua_tags tag
           INNER JOIN dua_item_tags item_tag ON item_tag.tag_id = tag.id
           WHERE item_tag.dua_id = item.id
           ORDER BY tag.name
         ) AS tags
  FROM dua_items item
  WHERE item.status = 'ACTIVE'`;

export async function listActiveDua(database: Queryable): Promise<PublicDuaListItem[]> {
  const result = await database.query(`${activeDuaSelect} ORDER BY item.group_name NULLS LAST, item.title`);
  return rows(result).map(toPublicDuaListItem);
}

export async function getActiveDua(database: Queryable, id: string): Promise<PublicDuaDetail> {
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
