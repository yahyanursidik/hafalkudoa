import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  eQuranDuaDetailResponseSchema,
  eQuranDuaListResponseSchema,
} from "../src/upstream/equran/schema.js";

const fixtureDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/equran");

async function readFixture(name: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(fixtureDirectory, name), "utf8")) as unknown;
}

describe("eQuran doa upstream contract", () => {
  it("parses the observed list response without losing required fields", async () => {
    const response = eQuranDuaListResponseSchema.parse(await readFixture("doa-list.sample.json"));
    const dua = response.data[0];

    expect(response.total).toBe(227);
    expect(dua).toBeDefined();
    if (!dua) {
      throw new Error("The list fixture must contain a doa record.");
    }
    expect(dua).toMatchObject({
      id: 1,
      grup: "Doa Sebelum dan Sesudah Tidur",
      nama: "Doa Sebelum Tidur 1",
      tag: ["tidur", "malam"],
    });
    expect(dua.ar).not.toHaveLength(0);
    expect(dua.tr).not.toHaveLength(0);
    expect(dua.idn).not.toHaveLength(0);
    expect(dua.tentang).toContain("HR. Al-Bukhari 11/126");
  });

  it("parses the observed detail response with the same exact record shape", async () => {
    const response = eQuranDuaDetailResponseSchema.parse(await readFixture("doa-1.json"));

    expect(response.data.id).toBe(1);
    expect(response.data.ar).not.toHaveLength(0);
    expect(response.data.tr).not.toHaveLength(0);
    expect(response.data.idn).not.toHaveLength(0);
    expect(response.data.tentang).toContain("Sumber: Hisnul Muslim.");
  });
});
