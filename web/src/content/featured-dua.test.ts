import { describe, expect, it } from "vitest";
import { featuredDua } from "./featured-dua.js";

describe("featured local dua", () => {
  it("keeps all reading and provenance fields present", () => {
    expect(featuredDua.arabic.trim()).not.toBe("");
    expect(featuredDua.latin.trim()).not.toBe("");
    expect(featuredDua.translation.trim()).not.toBe("");
    expect(featuredDua.source.trim()).not.toBe("");
  });

  it("keeps the upstream reference text", () => {
    expect(featuredDua.source).toContain("HR. Al-Bukhari 11/126, Muslim 4/2084.");
    expect(featuredDua.source).toContain("Sumber: Hisnul Muslim.");
  });
});
