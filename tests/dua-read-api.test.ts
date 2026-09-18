import { describe, expect, it } from "vitest";

import { getActiveDua, listActiveDua, listActiveGroups, listActiveTags, toPublicDuaDetail } from "../src/api/dua.js";
import { AppError } from "../src/lib/errors.js";

const activeRow = {
  id: "11111111-1111-4111-8111-111111111111",
  external_id: "1",
  title: "Doa Sebelum Tidur 1",
  group_name: "Doa Sebelum dan Sesudah Tidur",
  arabic: "بِاسْمِكَ رَبِّيْ",
  latin: "Bismika robbii.",
  translation_id: "Dengan nama Engkau, wahai Tuhanku.",
  source_reference: "HR. Al-Bukhari 11/126.",
  tags: ["tidur", "malam"],
};

describe("public dua read API", () => {
  it("returns every required detail field, including source", async () => {
    const detail = toPublicDuaDetail(activeRow);
    expect(detail).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      externalId: "1",
      title: "Doa Sebelum Tidur 1",
      arabic: "بِاسْمِكَ رَبِّيْ",
      latin: "Bismika robbii.",
      translation: "Dengan nama Engkau, wahai Tuhanku.",
      source: "HR. Al-Bukhari 11/126.",
      group: "Doa Sebelum dan Sesudah Tidur",
      tags: ["tidur", "malam"],
      curation: null,
      chunks: [],
    });
  });

  it("exposes curation metadata and chunks without touching canonical fields", () => {
    const detail = toPublicDuaDetail({
      ...activeRow,
      audience: "KIDS",
      chapter: "Doa Sebelum dan Sesudah Tidur",
      difficulty: 1,
      chunks: [{ sequence: 0, arabicStart: 0, arabicEnd: 7, latinSegment: "Bismika", visualGroup: 1 }],
    });

    expect(detail.curation).toEqual({ audience: "KIDS", chapter: "Doa Sebelum dan Sesudah Tidur", difficulty: 1 });
    expect(detail.chunks).toHaveLength(1);
    expect(detail.arabic).toBe(activeRow.arabic);
    expect(detail.source).toBe(activeRow.source_reference);
  });

  it("fails if an ACTIVE detail record omits source", () => {
    expect(() => toPublicDuaDetail({ ...activeRow, source_reference: "" })).toThrow(AppError);
  });

  it("queries only ACTIVE content for list, detail, groups, and tags", async () => {
    const queries: string[] = [];
    const database = {
      query: async (query: string) => {
        queries.push(query);
        if (query.includes("SELECT DISTINCT group_name")) {
          return [{ group_name: activeRow.group_name }];
        }
        if (query.includes("SELECT DISTINCT tag.slug")) {
          return [{ slug: "tidur", name: "tidur" }];
        }
        return [activeRow];
      },
    };

    await expect(listActiveDua(database)).resolves.toHaveLength(1);
    await expect(getActiveDua(database, "11111111-1111-4111-8111-111111111111")).resolves.toMatchObject({ source: activeRow.source_reference });
    await expect(listActiveGroups(database)).resolves.toEqual([activeRow.group_name]);
    await expect(listActiveTags(database)).resolves.toEqual([{ slug: "tidur", name: "tidur" }]);
    expect(queries.every((query) => query.includes("ACTIVE"))).toBe(true);
  });

  it("returns not found when an item is absent or non-public", async () => {
    await expect(getActiveDua({ query: async () => [] }, "22222222-2222-4222-8222-222222222222")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });
});

describe("dua id validation", () => {
  it("rejects a non-uuid id without touching the database", async () => {
    let queried = false;
    const database = {
      query: async () => {
        queried = true;
        return [];
      },
    };

    await expect(getActiveDua(database, "groups")).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    expect(queried).toBe(false);
  });
});
