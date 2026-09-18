import { z } from "zod";

const nonBlankText = z.string().refine((value) => value.trim().length > 0, { message: "must not be blank" });

export const duaAudienceSchema = z.enum(["KIDS", "FAMILY", "ADULT"]);
export type DuaAudience = z.infer<typeof duaAudienceSchema>;

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

export const duaChapterSchema = z.object({
  chapter: nonBlankText,
  total: z.number().int().nonnegative(),
  kids: z.number().int().nonnegative(),
});

export const publicDuaListItemSchema = z.object({
  id: nonBlankText,
  externalId: nonBlankText,
  title: nonBlankText,
  group: z.string().nullable(),
  tags: z.array(nonBlankText),
  curation: duaCurationSchema.nullable().default(null),
});

export const publicDuaDetailSchema = publicDuaListItemSchema.extend({
  arabic: nonBlankText,
  latin: nonBlankText,
  translation: nonBlankText,
  source: nonBlankText,
  chunks: z.array(duaChunkSchema).default([]),
});

export type PublicDuaListItem = z.infer<typeof publicDuaListItemSchema>;
export type PublicDuaDetail = z.infer<typeof publicDuaDetailSchema>;
export type DuaChapter = z.infer<typeof duaChapterSchema>;
export type DuaChunk = z.infer<typeof duaChunkSchema>;

export const duaPageSize = 12;

export function paginateDua(items: readonly PublicDuaListItem[], page: number): PublicDuaListItem[] {
  return items.slice(page * duaPageSize, (page + 1) * duaPageSize);
}

export function duaPageCount(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / duaPageSize));
}

async function fetchJson(url: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error("Daftar doa belum dapat dimuat.");
  }
  return response.json();
}

export async function fetchActiveDuaList(
  audience: DuaAudience | "ALL" = "ALL",
  fetcher: typeof fetch = fetch,
): Promise<PublicDuaListItem[]> {
  const query = audience === "ALL" ? "" : `?audience=${audience}`;
  return z.array(publicDuaListItemSchema).parse(await fetchJson(`/api/v1/dua${query}`, fetcher));
}

export async function fetchDuaChapters(fetcher: typeof fetch = fetch): Promise<DuaChapter[]> {
  return z.array(duaChapterSchema).parse(await fetchJson("/api/v1/dua/chapters", fetcher));
}

export async function fetchActiveDuaDetail(id: string, fetcher: typeof fetch = fetch): Promise<PublicDuaDetail> {
  return publicDuaDetailSchema.parse(await fetchJson(`/api/v1/dua/${encodeURIComponent(id)}`, fetcher));
}
