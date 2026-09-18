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

export const duaBundleSchema = z.object({
  generatedAt: z.string(),
  chapters: z.array(duaChapterSchema),
  items: z.array(publicDuaDetailSchema),
});

export type PublicDuaListItem = z.infer<typeof publicDuaListItemSchema>;
export type PublicDuaDetail = z.infer<typeof publicDuaDetailSchema>;
export type DuaChapter = z.infer<typeof duaChapterSchema>;
export type DuaChunk = z.infer<typeof duaChunkSchema>;
export type DuaBundle = z.infer<typeof duaBundleSchema>;

export const duaPageSize = 12;

export function paginateDua(items: readonly PublicDuaListItem[], page: number): PublicDuaListItem[] {
  return items.slice(page * duaPageSize, (page + 1) * duaPageSize);
}

export function duaPageCount(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / duaPageSize));
}

/**
 * The catalogue ships with the app as a static file. Reading it needs no
 * database and no upstream API, so the doa still open when either is down.
 */
export const duaBundleUrl = "/content/dua.json";

let bundleRequest: Promise<DuaBundle> | undefined;

export function resetDuaBundleCache(): void {
  bundleRequest = undefined;
}

export async function loadDuaBundle(fetcher: typeof fetch = fetch): Promise<DuaBundle> {
  bundleRequest ??= (async () => {
    const response = await fetcher(duaBundleUrl);
    if (!response.ok) {
      throw new Error("Daftar doa belum dapat dimuat.");
    }
    return duaBundleSchema.parse(await response.json());
  })().catch((error: unknown) => {
    bundleRequest = undefined;
    throw error;
  });

  return bundleRequest;
}

export async function fetchActiveDuaList(
  audience: DuaAudience | "ALL" = "ALL",
  fetcher: typeof fetch = fetch,
): Promise<PublicDuaListItem[]> {
  const { items } = await loadDuaBundle(fetcher);
  return audience === "ALL" ? items : items.filter((item) => item.curation?.audience === audience);
}

export async function fetchDuaChapters(fetcher: typeof fetch = fetch): Promise<DuaChapter[]> {
  return (await loadDuaBundle(fetcher)).chapters;
}

export async function fetchActiveDuaDetail(id: string, fetcher: typeof fetch = fetch): Promise<PublicDuaDetail> {
  const detail = (await loadDuaBundle(fetcher)).items.find((item) => item.id === id);
  if (!detail) {
    throw new Error("Doa tidak ditemukan.");
  }
  return detail;
}
