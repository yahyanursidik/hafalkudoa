import { describe, expect, it } from "vitest";

import { checkHealth } from "../src/api/health.js";

const content = { items: 225, generatedAt: "2026-09-18T00:00:00.000Z" };

describe("checkHealth", () => {
  it("reports the served content and a reachable database", async () => {
    const result = await checkHealth({ ...content, database: { query: async () => [{ "?column?": 1 }] } });
    expect(result).toEqual({
      statusCode: 200,
      body: { status: "ok", content: "ok", items: 225, generatedAt: content.generatedAt, database: "ok" },
    });
  });

  it("stays healthy, without exposing the error, when the database is down", async () => {
    const result = await checkHealth({
      ...content,
      database: { query: async () => Promise.reject(new Error("connection refused")) },
    });
    expect(result.statusCode).toBe(200);
    expect(result.body.database).toBe("unavailable");
    expect(JSON.stringify(result.body)).not.toContain("connection refused");
  });

  it("says so when no database is configured at all", async () => {
    const result = await checkHealth(content);
    expect(result.body).toMatchObject({ status: "ok", content: "ok", database: "not-configured" });
  });
});
