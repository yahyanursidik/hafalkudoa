import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { activeDuaContentSchema } from "../src/content/validation.js";

const migrationPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations/0001_content_schema.sql",
);

const validActiveDua = {
  externalId: "1",
  arabic: "بِاسْمِكَ رَبِّيْ",
  latin: "Bismika robbii.",
  translationId: "Dengan nama Engkau, wahai Tuhanku.",
  sourceReference: "HR. Al-Bukhari 11/126.",
  contentHash: "a8db5b4d9916c4aaac69ffba4c8df261bb3571e714b404b13d19012e9dbabf24",
};

describe("ACTIVE doa content integrity", () => {
  it("requires Arabic, Latin, translation, source, external ID, and a content hash", () => {
    expect(activeDuaContentSchema.safeParse(validActiveDua).success).toBe(true);

    for (const field of ["arabic", "latin", "translationId", "sourceReference"] as const) {
      expect(activeDuaContentSchema.safeParse({ ...validActiveDua, [field]: "   " }).success).toBe(false);
    }

    expect(activeDuaContentSchema.safeParse({ ...validActiveDua, externalId: "" }).success).toBe(false);
    expect(activeDuaContentSchema.safeParse({ ...validActiveDua, contentHash: "" }).success).toBe(false);
  });

  it("keeps canonical religious text unchanged during validation", () => {
    const result = activeDuaContentSchema.parse(validActiveDua);
    expect(result.arabic).toBe(validActiveDua.arabic);
    expect(result.sourceReference).toBe(validActiveDua.sourceReference);
  });
});

describe("B1 content migration", () => {
  it("includes all content and raw-audit tables with the ACTIVE database constraint", async () => {
    const sql = await readFile(migrationPath, "utf8");

    for (const table of [
      "dua_import_batches",
      "dua_raw_imports",
      "dua_items",
      "dua_tags",
      "dua_item_tags",
      "dua_chunks",
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
    }

    expect(sql).toContain("raw_payload_json JSONB NOT NULL");
    expect(sql).toContain("CONSTRAINT active_dua_requires_complete_content");
    expect(sql).toContain("status <> 'ACTIVE'");
    expect(sql).not.toMatch(/audio|recitation|pronunciation/i);
  });
});
