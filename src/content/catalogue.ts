/**
 * The served catalogue.
 *
 * Neon stays the authoring and review system: sync, curate, chunk, export.
 * Serving reads the exported bundle instead, which is committed and shipped
 * inside the deployment. A read request therefore cannot fail because a
 * database or an upstream API is unreachable — there is nothing to reach.
 *
 * Regenerate with `npm run doa:export` after any content change.
 */
import bundle from "../../web/public/content/dua.json" with { type: "json" };

import {
  duaAudienceSchema,
  isDuaId,
  publicDuaDetailSchema,
  type DuaAudience,
  type DuaChapter,
  type PublicDuaDetail,
  type PublicDuaListItem,
} from "../api/dua.js";
import { AppError } from "../lib/errors.js";

const items: PublicDuaDetail[] = bundle.items.map((item) => publicDuaDetailSchema.parse(item));

const itemsById = new Map(items.map((item) => [item.id, item]));

function toListItem(item: PublicDuaDetail): PublicDuaListItem {
  return {
    id: item.id,
    externalId: item.externalId,
    title: item.title,
    group: item.group,
    tags: item.tags,
    curation: item.curation,
  };
}

export function catalogueGeneratedAt(): string {
  return bundle.generatedAt;
}

export function listCatalogue(audience?: DuaAudience): PublicDuaListItem[] {
  const selected = audience ? items.filter((item) => item.curation?.audience === audience) : items;
  return selected.map(toListItem);
}

export function getCatalogueDua(id: string): PublicDuaDetail {
  const item = isDuaId(id) ? itemsById.get(id) : undefined;
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Doa not found.");
  }
  return item;
}

export function catalogueChapters(): DuaChapter[] {
  return bundle.chapters.map((chapter) => ({
    chapter: chapter.chapter,
    total: chapter.total,
    kids: chapter.kids,
  }));
}

export function catalogueGroups(): string[] {
  const groups = new Set(items.flatMap((item) => (item.group && item.group.trim().length > 0 ? [item.group] : [])));
  return [...groups].sort((left, right) => left.localeCompare(right, "id"));
}

export function catalogueTags(): { slug: string; name: string }[] {
  const names = new Set(items.flatMap((item) => item.tags));
  return [...names]
    .sort((left, right) => left.localeCompare(right, "id"))
    .map((name) => ({ slug: name.replace(/\s+/g, "-").toLowerCase(), name }));
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
