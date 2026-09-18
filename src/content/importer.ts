import { createHash } from "node:crypto";

import { z } from "zod";

import type { EQuranDua } from "../upstream/equran/schema.js";

const nonBlankText = z.string().refine((value) => value.trim().length > 0, {
  message: "must not be blank",
});

export const importedDuaSchema = z.object({
  externalId: nonBlankText,
  title: nonBlankText,
  group: z.string().nullable(),
  tags: z.array(nonBlankText),
  arabic: nonBlankText,
  latin: nonBlankText,
  translation: nonBlankText,
  sourceReference: nonBlankText,
  raw: z.unknown(),
});

export type ImportedDua = z.infer<typeof importedDuaSchema>;

export type DuaComparison = Pick<
  ImportedDua,
  "title" | "group" | "arabic" | "latin" | "translation" | "sourceReference"
> & {
  contentHash: string;
};

export type FieldDiff = {
  field: keyof DuaComparison;
  previous: string | null;
  candidate: string | null;
};

export class ImportValidationError extends Error {
  public constructor(
    public readonly externalId: string,
    public readonly issues: string[],
  ) {
    super(`Imported doa ${externalId} failed validation: ${issues.join(", ")}`);
    this.name = "ImportValidationError";
  }
}

/** Maps only observed eQuran fields; no canonical religious text is rewritten. */
export function mapEQuranDua(dua: EQuranDua): ImportedDua {
  const candidate = {
    externalId: String(dua.id),
    title: dua.nama,
    group: dua.grup,
    tags: dua.tag,
    arabic: dua.ar,
    latin: dua.tr,
    translation: dua.idn,
    sourceReference: dua.tentang,
    raw: dua,
  };

  const result = importedDuaSchema.safeParse(candidate);
  if (!result.success) {
    throw new ImportValidationError(
      candidate.externalId,
      result.error.issues.map((issue) => issue.path.join(".") || "record"),
    );
  }

  return result.data;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

export function contentHash(value: unknown): string {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}

export function hashImportedDua(dua: ImportedDua): string {
  return contentHash({
    externalId: dua.externalId,
    title: dua.title,
    group: dua.group,
    tags: dua.tags,
    arabic: dua.arabic,
    latin: dua.latin,
    translation: dua.translation,
    sourceReference: dua.sourceReference,
  });
}

export function diffDua(
  previous: DuaComparison | null,
  candidate: DuaComparison,
): FieldDiff[] {
  const fields: (keyof DuaComparison)[] = [
    "title",
    "group",
    "arabic",
    "latin",
    "translation",
    "sourceReference",
    "contentHash",
  ];

  return fields.flatMap((field) => {
    const oldValue = previous?.[field] ?? null;
    const newValue = candidate[field] ?? null;
    return oldValue === newValue ? [] : [{ field, previous: oldValue, candidate: newValue }];
  });
}
