import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  duaBundleUrl,
  duaPageCount,
  fetchActiveDuaDetail,
  fetchActiveDuaList,
  fetchDuaChapters,
  paginateDua,
  publicDuaDetailSchema,
  publicDuaListItemSchema,
  resetDuaBundleCache,
  type PublicDuaListItem,
} from "./dua-api.js";

const item = (id: number): PublicDuaListItem => ({
  id: String(id),
  externalId: String(id),
  title: `Doa ${id}`,
  group: "Contoh",
  tags: ["contoh"],
  curation: null,
});

describe("internal public dua client", () => {
  it("defaults curation and chunks when the API omits them", () => {
    const parsed = publicDuaListItemSchema.parse({ id: "1", externalId: "1", title: "Doa", group: null, tags: [] });
    expect(parsed.curation).toBeNull();
  });

  it("paginates without placing the full collection on one child screen", () => {
    const items = Array.from({ length: 25 }, (_, index) => item(index + 1));
    expect(duaPageCount(items.length)).toBe(3);
    expect(paginateDua(items, 0)).toHaveLength(12);
    expect(paginateDua(items, 2)).toEqual([item(25)]);
  });

  it("rejects detail data that omits source content", () => {
    expect(() => publicDuaDetailSchema.parse(item(1))).toThrow();
  });
});

const detail = (id: string, audience: "KIDS" | "ADULT") => ({
  id,
  externalId: id,
  title: `Doa ${id}`,
  group: "Contoh",
  tags: ["contoh"],
  curation: { audience, chapter: "Contoh", difficulty: 1 },
  arabic: "بِاسْمِكَ",
  latin: "Bismika",
  translation: "Dengan nama Engkau",
  source: "HR. Al-Bukhari 11/126.",
  chunks: [],
});

function bundleFetcher(): { fetcher: typeof fetch; calls: () => number } {
  let calls = 0;
  const fetcher = (async () => {
    calls += 1;
    return {
      ok: true,
      json: async () => ({
        generatedAt: "2026-09-18T00:00:00.000Z",
        chapters: [{ chapter: "Contoh", total: 2, kids: 1 }],
        items: [detail("a", "KIDS"), detail("b", "ADULT")],
      }),
    };
  }) as unknown as typeof fetch;
  return { fetcher, calls: () => calls };
}

describe("static catalogue bundle", () => {
  beforeEach(() => {
    resetDuaBundleCache();
  });

  it("reads the catalogue from the shipped file, not from an API", async () => {
    const { fetcher } = bundleFetcher();
    const spy = vi.fn(fetcher);
    await fetchActiveDuaList("ALL", spy as unknown as typeof fetch);
    expect(spy).toHaveBeenCalledWith(duaBundleUrl);
  });

  it("filters by audience and finds a detail without a second request", async () => {
    const { fetcher, calls } = bundleFetcher();

    await expect(fetchActiveDuaList("KIDS", fetcher)).resolves.toHaveLength(1);
    await expect(fetchActiveDuaDetail("b", fetcher)).resolves.toMatchObject({ source: "HR. Al-Bukhari 11/126." });
    await expect(fetchDuaChapters(fetcher)).resolves.toEqual([{ chapter: "Contoh", total: 2, kids: 1 }]);
    expect(calls()).toBe(1);
  });

  it("reports a missing doa instead of rendering an empty page", async () => {
    const { fetcher } = bundleFetcher();
    await expect(fetchActiveDuaDetail("missing", fetcher)).rejects.toThrow("Doa tidak ditemukan.");
  });

  it("does not cache a failed load", async () => {
    let attempts = 0;
    const failing = (async () => {
      attempts += 1;
      return { ok: false, json: async () => ({}) };
    }) as unknown as typeof fetch;

    await expect(fetchActiveDuaList("ALL", failing)).rejects.toThrow();
    await expect(fetchActiveDuaList("ALL", failing)).rejects.toThrow();
    expect(attempts).toBe(2);
  });
});
