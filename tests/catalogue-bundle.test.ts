import { describe, expect, it } from "vitest";

import { publicDuaDetailSchema } from "../src/api/dua.js";
import {
  catalogueChapters,
  catalogueGroups,
  catalogueTags,
  getCatalogueDua,
  listCatalogue,
  parseAudience,
} from "../src/content/catalogue.js";
import { AppError } from "../src/lib/errors.js";

/**
 * These run without a database. They are the gate that keeps a broken or
 * half-exported bundle from shipping, since the bundle is what users read.
 */
describe("shipped catalogue bundle", () => {
  const items = listCatalogue();

  it("ships the full reviewed catalogue", () => {
    expect(items.length).toBeGreaterThanOrEqual(200);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });

  it("gives every doa the mandatory content, source included", () => {
    items.forEach((item) => {
      const detail = getCatalogueDua(item.id);
      expect(() => publicDuaDetailSchema.parse(detail)).not.toThrow();
      expect(detail.source.trim().length).toBeGreaterThan(0);
      expect(detail.arabic.trim().length).toBeGreaterThan(0);
    });
  });

  it("keeps chunk offsets inside the canonical Arabic they slice", () => {
    items.forEach((item) => {
      const detail = getCatalogueDua(item.id);
      detail.chunks.forEach((chunk) => {
        expect(chunk.arabicEnd).toBeGreaterThan(chunk.arabicStart);
        expect(chunk.arabicEnd).toBeLessThanOrEqual(detail.arabic.length);
        expect(detail.arabic.slice(chunk.arabicStart, chunk.arabicEnd).trim().length).toBeGreaterThan(0);
      });
    });
  });

  it("curates every doa and keeps a real child path", () => {
    expect(items.every((item) => item.curation !== null)).toBe(true);
    expect(listCatalogue("KIDS").length).toBeGreaterThan(50);
    expect(listCatalogue("KIDS").every((item) => item.curation?.audience === "KIDS")).toBe(true);
  });

  it("derives chapters, groups, and tags from the same bundle", () => {
    expect(catalogueChapters().length).toBeGreaterThan(0);
    expect(catalogueGroups().length).toBeGreaterThan(0);
    expect(catalogueTags().length).toBeGreaterThan(0);
    expect(catalogueChapters().reduce((total, chapter) => total + chapter.total, 0)).toBe(items.length);
  });

  it("answers 404 for an unknown or malformed id", () => {
    expect(() => getCatalogueDua("groups")).toThrow(AppError);
    expect(() => getCatalogueDua("11111111-1111-4111-8111-111111111111")).toThrow(AppError);
  });

  it("rejects an unknown audience filter", () => {
    expect(parseAudience("KIDS")).toBe("KIDS");
    expect(parseAudience("ALL")).toBeUndefined();
    expect(() => parseAudience("bogus")).toThrow(AppError);
  });
});
