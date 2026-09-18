import { describe, expect, it } from "vitest";

import {
  audienceOf,
  buildCurationPlan,
  chapterOrder,
  difficultyOf,
  fallbackChapter,
  normalizeChapter,
  summarizePlan,
  type CuratableDua,
} from "../src/content/curation.js";

function dua(overrides: Partial<CuratableDua> = {}): CuratableDua {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Doa Sebelum Tidur",
    group: "Doa Sebelum dan Sesudah Tidur",
    arabic: "بِاسْمِكَ رَبِّيْ وَضَعْتُ جَنْبِيْ",
    tags: ["tidur"],
    ...overrides,
  };
}

describe("curation rules", () => {
  it("marks an everyday doa as kid-owned", () => {
    expect(audienceOf(dua())).toEqual({ audience: "KIDS", rule: "kids-topic:tidur" });
  });

  it("keeps adult topics out of the child path", () => {
    expect(audienceOf(dua({ title: "Doa Jenazah", group: "Doa Jenazah", tags: [] })).audience).toBe("ADULT");
    expect(audienceOf(dua({ title: "Doa agar terbebas hutang", group: null, tags: [] })).audience).toBe("ADULT");
  });

  it("routes parent-guided topics to FAMILY", () => {
    expect(audienceOf(dua({ title: "Doa Terkait Puasa", group: "Doa Terkait Puasa", tags: [] })).audience).toBe("FAMILY");
  });

  it("does not hand a child a very long text even on a kid topic", () => {
    const long = audienceOf(dua({ arabic: "ا".repeat(400) }));
    expect(long.audience).toBe("FAMILY");
    expect(long.rule).toBe("too-long:400");
  });

  it("grades difficulty from the Arabic word count only", () => {
    expect(difficultyOf("كلمة كلمة")).toBe(1);
    expect(difficultyOf(Array.from({ length: 15 }, () => "كلمة").join(" "))).toBe(2);
    expect(difficultyOf(Array.from({ length: 30 }, () => "كلمة").join(" "))).toBe(3);
  });

  it("normalizes chapters and falls back when the upstream group is missing", () => {
    expect(normalizeChapter("Ucapan Terkait Hari Raya.")).toBe("Ucapan Terkait Hari Raya");
    expect(normalizeChapter("   ")).toBe(fallbackChapter);
    expect(chapterOrder("Doa Sebelum dan Sesudah Tidur")).toBeLessThan(chapterOrder("Doa Jenazah"));
  });

  it("produces a stable, gapless display order across runs", () => {
    const items = [
      dua({ id: "a", title: "Doa Jenazah", group: "Doa Jenazah" }),
      dua({ id: "b" }),
      dua({ id: "c", title: "Doa Sesudah Makan", group: "Doa Terkait Makan", tags: ["makan"] }),
    ];

    const first = buildCurationPlan(items);
    const second = buildCurationPlan([...items].reverse());

    expect(first.map((entry) => entry.duaId)).toEqual(["b", "c", "a"]);
    expect(first.map((entry) => entry.displayOrder)).toEqual([0, 1, 2]);
    expect(second).toEqual(first);
  });

  it("summarizes a plan by audience and chapter", () => {
    const plan = buildCurationPlan([dua({ id: "a" }), dua({ id: "b", title: "Doa Jenazah", group: "Doa Jenazah" })]);
    expect(summarizePlan(plan)).toEqual({ KIDS: 1, FAMILY: 0, ADULT: 1, chapters: 2 });
  });
});
