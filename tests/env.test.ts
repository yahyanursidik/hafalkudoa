import { describe, expect, it } from "vitest";

import { parseEnvironment } from "../src/config/env.js";

describe("parseEnvironment", () => {
  it("accepts a PostgreSQL URL and defaults NODE_ENV", () => {
    expect(parseEnvironment({ DATABASE_URL: "postgresql://user:pass@example.com/database?sslmode=require" })).toEqual({
      DATABASE_URL: "postgresql://user:pass@example.com/database?sslmode=require",
      NODE_ENV: "development",
    });
  });

  it("rejects missing database configuration", () => {
    expect(() => parseEnvironment({})).toThrow("DATABASE_URL");
  });

  it("rejects a non-PostgreSQL connection URL", () => {
    expect(() => parseEnvironment({ DATABASE_URL: "https://example.com" })).toThrow("DATABASE_URL");
  });
});
