import { z } from "zod";

const nonBlankText = z.string().refine((value) => value.trim().length > 0, { message: "must not be blank" });

export const publicDuaListItemSchema = z.object({
  id: nonBlankText,
  externalId: nonBlankText,
  title: nonBlankText,
  group: z.string().nullable(),
  tags: z.array(nonBlankText),
});

export const publicDuaDetailSchema = publicDuaListItemSchema.extend({
  arabic: nonBlankText,
  latin: nonBlankText,
  translation: nonBlankText,
  source: nonBlankText,
});

export type PublicDuaListItem = z.infer<typeof publicDuaListItemSchema>;
export type PublicDuaDetail = z.infer<typeof publicDuaDetailSchema>;

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

export async function fetchActiveDuaList(fetcher: typeof fetch = fetch): Promise<PublicDuaListItem[]> {
  return z.array(publicDuaListItemSchema).parse(await fetchJson("/api/v1/dua", fetcher));
}

export async function fetchActiveDuaDetail(id: string, fetcher: typeof fetch = fetch): Promise<PublicDuaDetail> {
  return publicDuaDetailSchema.parse(await fetchJson(`/api/v1/dua/${encodeURIComponent(id)}`, fetcher));
}
