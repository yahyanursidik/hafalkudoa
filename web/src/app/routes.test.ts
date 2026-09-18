import { describe, expect, it } from "vitest";
import { appRoutes, routeForPath } from "./routes.js";

describe("F0 route contract", () => {
  it("exposes the five child navigation destinations", () => {
    expect(appRoutes.map((route) => route.path)).toEqual(["/", "/hafalan", "/murajaah", "/doa", "/saya"]);
  });

  it("resolves only declared navigation paths", () => {
    expect(routeForPath("/doa")?.label).toBe("Doa");
    expect(routeForPath("/unknown")).toBeUndefined();
  });
});
