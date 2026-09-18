import { describe, expect, it } from "vitest";

import { buildChunks } from "../src/content/chunking.js";

const arabic = "بِسْمِ اللهِ الَّذِيْ لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ";
const latin = "Bismillahil ladzi la yadhurru ma'asmihi syai'un fil ardhi wa la fis sama'i";

describe("memorisation chunks", () => {
  it("returns offsets that slice back to the untouched Arabic text", () => {
    const chunks = buildChunks(arabic, latin);

    expect(chunks.length).toBeGreaterThan(1);
    const rebuilt = chunks.map((chunk) => arabic.slice(chunk.arabicStart, chunk.arabicEnd)).join(" ");
    expect(rebuilt).toBe(arabic);
  });

  it("keeps every chunk non-empty and in sequence", () => {
    const chunks = buildChunks(arabic, latin);

    chunks.forEach((chunk, index) => {
      expect(chunk.sequence).toBe(index);
      expect(chunk.arabicEnd).toBeGreaterThan(chunk.arabicStart);
      expect(chunk.visualGroup).toBeGreaterThanOrEqual(1);
      expect(chunk.visualGroup).toBeLessThanOrEqual(5);
    });
  });

  it("never leaves a single trailing word alone", () => {
    const nineWords = "واحد اثنان ثلاثة أربعة خمسة ستة سبعة ثمانية تسعة";
    const chunks = buildChunks(nineWords, "satu dua tiga empat lima enam tujuh delapan sembilan");

    expect(chunks).toHaveLength(2);
    expect(chunks[1]?.latinSegment).toBe("lima enam tujuh delapan sembilan");
  });

  it("splits the Latin aid alongside the Arabic groups", () => {
    const chunks = buildChunks("واحد اثنان ثلاثة أربعة خمسة ستة سبعة ثمانية", "satu dua tiga empat lima enam tujuh delapan");

    expect(chunks.map((chunk) => chunk.latinSegment)).toEqual(["satu dua tiga empat", "lima enam tujuh delapan"]);
  });

  it("returns nothing for blank Arabic instead of inventing a chunk", () => {
    expect(buildChunks("   ", "apa pun")).toEqual([]);
  });
});
