import { describe, expect, it } from "vitest";
import { duaPageCount, paginateDua, publicDuaDetailSchema, publicDuaListItemSchema, type PublicDuaListItem } from "./dua-api.js";

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
