import { describe, expect, it } from "vitest";

import { checkHealth } from "../src/api/health.js";

describe("checkHealth", () => {
  it("reports ready when Neon responds", async () => {
    const result = await checkHealth({ query: async () => [{ "?column?": 1 }] });
    expect(result).toEqual({ statusCode: 200, body: { status: "ok", database: "ok" } });
  });

  it("does not expose database errors", async () => {
    const result = await checkHealth({ query: async () => Promise.reject(new Error("connection refused")) });
    expect(result).toEqual({ statusCode: 503, body: { status: "error", database: "unavailable" } });
  });
});
