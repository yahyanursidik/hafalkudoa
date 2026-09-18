import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { requireActivatable, requireApprovedStatus, type ReviewItem } from "../src/content/review.js";

const commandPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts/doa.ts");

const approvedItem: ReviewItem = {
  id: "candidate-1",
  externalId: "1",
  status: "APPROVED",
  title: "Doa Sebelum Tidur 1",
  group: "Tidur",
  arabic: "بِاسْمِكَ رَبِّيْ",
  latin: "Bismika robbii.",
  translation: "Dengan nama Engkau, wahai Tuhanku.",
  sourceReference: "HR. Al-Bukhari 11/126.",
  contentHash: "a8db5b4d9916c4aaac69ffba4c8df261bb3571e714b404b13d19012e9dbabf24",
  tags: ["tidur"],
};

describe("manual review activation policy", () => {
  it("requires APPROVED status and every mandatory content field", () => {
    expect(() => requireApprovedStatus(approvedItem)).not.toThrow();
    expect(() => requireActivatable(approvedItem)).not.toThrow();

    expect(() => requireApprovedStatus({ ...approvedItem, status: "REVIEW_REQUIRED" })).toThrow("Only APPROVED");
    expect(() => requireActivatable({ ...approvedItem, sourceReference: " " })).toThrow("does not meet ACTIVE");
  });

  it("requires an explicit command-line confirmation before activation", async () => {
    const command = await readFile(commandPath, "utf8");
    expect(command).toContain('confirmation !== "--confirm"');
    expect(command).toContain("doa_candidate_activated");
    expect(command).toContain('confirmation !== "--confirm"');
    expect(command).toContain("doa_candidates_published");
  });
});
