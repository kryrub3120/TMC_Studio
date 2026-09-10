import { describe, expect, it } from "vitest";
import {
  PUBLIC_BASE_PATHS,
  getAlternates,
  getPrerenderRoutes,
  getPublicRoute,
  localizePublicPath,
} from "../publicSeo";

describe("public SEO routing", () => {
  it("creates stable locale-specific public URLs", () => {
    expect(localizePublicPath("/pricing", "en")).toBe("/pricing/");
    expect(localizePublicPath("/pricing", "pl")).toBe("/pl/pricing/");
    expect(localizePublicPath("/pricing?cycle=yearly", "es")).toBe(
      "/es/pricing/?cycle=yearly",
    );
    expect(localizePublicPath("/board", "pl")).toBe("/board");
  });

  it("resolves localized paths back to the source page", () => {
    expect(getPublicRoute("/pl/pricing/")).toEqual({
      language: "pl",
      basePath: "/pricing",
    });
    expect(getPublicRoute("/es")).toEqual({ language: "es", basePath: "/" });
    expect(getPublicRoute("/board")).toBeNull();
  });

  it("builds reciprocal hreflang sets and all localized pages", () => {
    expect(getAlternates("/pricing")).toEqual([
      ["en", "https://tmcstudio.app/pricing/"],
      ["pl", "https://tmcstudio.app/pl/pricing/"],
      ["es", "https://tmcstudio.app/es/pricing/"],
      ["x-default", "https://tmcstudio.app/pricing/"],
    ]);
    expect(getPrerenderRoutes()).toHaveLength(PUBLIC_BASE_PATHS.length * 3);
    expect(getPublicRoute('/pl/changelog/')).toEqual({ language: 'pl', basePath: '/changelog' });
    expect(getPublicRoute('/es/report-bug/')).toEqual({ language: 'es', basePath: '/report-bug' });
  });

  it("localizes growth and template pages", () => {
    expect(localizePublicPath("/football-tactics-board", "pl")).toBe(
      "/pl/football-tactics-board/",
    );
    expect(
      getPublicRoute("/es/templates/4-2-3-1-formation/"),
    ).toEqual({
      language: "es",
      basePath: "/templates/4-2-3-1-formation",
    });
  });
});
