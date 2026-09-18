import { describe, expect, it } from "vitest";

import { AppError, toErrorResponse } from "../src/lib/errors.js";

describe("toErrorResponse", () => {
  it("formats known errors consistently", () => {
    expect(toErrorResponse(new AppError(404, "NOT_FOUND", "Missing."), "request-1")).toEqual({
      statusCode: 404,
      body: { error: { code: "NOT_FOUND", message: "Missing.", requestId: "request-1" } },
    });
  });

  it("does not expose unknown error details", () => {
    expect(toErrorResponse(new Error("database password leaked"), "request-2")).toEqual({
      statusCode: 500,
      body: {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
          requestId: "request-2",
        },
      },
    });
  });
});
