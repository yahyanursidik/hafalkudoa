import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { fetchEQuranDuaList } from "../src/upstream/equran/client.js";
import {
  diffDua,
  hashImportedDua,
  ImportValidationError,
  mapEQuranDua,
} from "../src/content/importer.js";
import { partitionImportedDua } from "../src/content/sync.js";
import { eQuranDuaListResponseSchema } from "../src/upstream/equran/schema.js";

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/equran/doa-list.sample.json",
);

async function fixture(): Promise<unknown> {
  return JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
}

describe("eQuran candidate importer", () => {
  it("fetches, validates, and maps only observed eQuran fields", async () => {
    const upstream = await fixture();
    const response = await fetchEQuranDuaList(async () => ({
      ok: true,
      status: 200,
      json: async () => upstream,
    }));
    const record = response.data[0];
    expect(record).toBeDefined();
    if (!record) {
      throw new Error("Fixture requires a doa record.");
    }

    expect(mapEQuranDua(record)).toMatchObject({
      externalId: "1",
      title: "Doa Sebelum Tidur 1",
      group: "Doa Sebelum dan Sesudah Tidur",
      tags: ["tidur", "malam"],
      sourceReference: expect.stringContaining("HR. Al-Bukhari 11/126"),
    });
  });

  it("rejects missing Arabic, Latin, translation, or upstream source", async () => {
    const response = eQuranDuaListResponseSchema.parse(await fixture());
    const record = response.data[0];
    expect(record).toBeDefined();
    if (!record) {
      throw new Error("Fixture requires a doa record.");
    }

    for (const field of ["ar", "tr", "idn", "tentang"] as const) {
      expect(() => mapEQuranDua({ ...record, [field]: " " })).toThrow(ImportValidationError);
    }
  });

  it("can isolate malformed upstream content while retaining valid candidates", async () => {
    const response = eQuranDuaListResponseSchema.parse(await fixture());
    const record = response.data[0];
    expect(record).toBeDefined();
    if (!record) {
      throw new Error("Fixture requires a doa record.");
    }

    const partitioned = partitionImportedDua([record, { ...record, id: 42, tr: " ", idn: " " }]);
    expect(partitioned.valid).toHaveLength(1);
    expect(partitioned.invalid).toEqual([{ externalId: "42", issues: ["latin", "translation"] }]);
  });

  it("creates deterministic hashes and field-level diffs without rewriting content", async () => {
    const response = eQuranDuaListResponseSchema.parse(await fixture());
    const record = response.data[0];
    expect(record).toBeDefined();
    if (!record) {
      throw new Error("Fixture requires a doa record.");
    }
    const imported = mapEQuranDua(record);
    const candidate = {
      title: imported.title,
      group: imported.group,
      arabic: imported.arabic,
      latin: imported.latin,
      translation: imported.translation,
      sourceReference: imported.sourceReference,
      contentHash: hashImportedDua(imported),
    };

    expect(hashImportedDua(imported)).toBe(candidate.contentHash);
    expect(diffDua(candidate, candidate)).toEqual([]);
    expect(diffDua({ ...candidate, sourceReference: "HR. Different." }, candidate)).toEqual([
      { field: "sourceReference", previous: "HR. Different.", candidate: imported.sourceReference },
    ]);
  });

  it("fails safely when eQuran returns an HTTP error", async () => {
    await expect(fetchEQuranDuaList(async () => ({ ok: false, status: 503, json: async () => ({}) }))).rejects.toThrow(
      "status 503",
    );
  });
});
