import { translate, type Language } from "@tmc/ui";
import {
  GROWTH_PAGE_PATHS,
  getGrowthPage,
  isGrowthPagePath,
} from "./growthContent";

export const SITE_URL = "https://tmcstudio.app";

export const PUBLIC_BASE_PATHS = [
  "/",
  "/pricing",
  "/privacy",
  "/terms",
  "/cookies",
  "/refunds",
  "/legal",
  "/accessibility",
  ...GROWTH_PAGE_PATHS,
] as const;

export type PublicBasePath = (typeof PUBLIC_BASE_PATHS)[number];

const LEGAL_META: Partial<
  Record<PublicBasePath, { title: string; description: string }>
> = {
  "/privacy": {
    title: "legal.privacy.title",
    description: "legal.privacy.intro.body",
  },
  "/terms": {
    title: "legal.terms.title",
    description: "legal.terms.description.body",
  },
  "/cookies": {
    title: "legal.cookies.title",
    description: "legal.cookies.what.body",
  },
  "/refunds": {
    title: "legal.refunds.title",
    description: "legal.refunds.intro",
  },
  "/legal": {
    title: "legal.legalNotice.title",
    description: "legal.legalNotice.intro",
  },
  "/accessibility": {
    title: "legal.accessibility.title",
    description: "legal.accessibility.commitmentBody",
  },
};

function normalizePath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function localizePublicPath(path: string, language: Language): string {
  const url = new URL(path, SITE_URL);
  let basePath = normalizePath(url.pathname);

  if (basePath === "/pl" || basePath === "/es") basePath = "/";
  else basePath = basePath.replace(/^\/(pl|es)(?=\/)/, "");

  if (!PUBLIC_BASE_PATHS.includes(basePath as PublicBasePath)) return path;

  const prefix = language === "en" ? "" : `/${language}`;
  const localized = basePath === "/" ? prefix || "/" : `${prefix}${basePath}`;
  const withTrailingSlash = localized === "/" ? "/" : `${localized}/`;
  return `${withTrailingSlash}${url.search}${url.hash}`;
}

export function getPublicRoute(
  pathname: string,
): { language: Language; basePath: PublicBasePath } | null {
  const normalized = normalizePath(pathname);
  const match = normalized.match(/^\/(pl|es)(?=\/|$)/);
  const language = (match?.[1] as Language | undefined) ?? "en";
  const basePath = match
    ? normalizePath(normalized.slice(match[0].length))
    : normalized;

  if (!PUBLIC_BASE_PATHS.includes(basePath as PublicBasePath)) return null;
  return { language, basePath: basePath as PublicBasePath };
}

export function getPublicMeta(basePath: PublicBasePath, language: Language) {
  if (isGrowthPagePath(basePath)) {
    const page = getGrowthPage(basePath, language);
    return { title: page.metaTitle, description: page.metaDescription };
  }
  if (basePath === "/") {
    return {
      title: translate("seo.landing.title", undefined, language),
      description: translate("seo.landing.description", undefined, language),
    };
  }
  if (basePath === "/pricing") {
    return {
      title: translate("seo.pricing.title", undefined, language),
      description: translate("seo.pricing.description", undefined, language),
    };
  }

  const keys = LEGAL_META[basePath];
  if (!keys) throw new Error(`Missing SEO metadata for ${basePath}`);
  return {
    title: `${translate(keys.title, undefined, language)} | TMC Studio`,
    description: translate(keys.description, undefined, language),
  };
}

export function getCanonicalUrl(
  basePath: PublicBasePath,
  language: Language,
): string {
  return `${SITE_URL}${localizePublicPath(basePath, language)}`;
}

export function getAlternates(basePath: PublicBasePath) {
  return [
    ["en", getCanonicalUrl(basePath, "en")],
    ["pl", getCanonicalUrl(basePath, "pl")],
    ["es", getCanonicalUrl(basePath, "es")],
    ["x-default", getCanonicalUrl(basePath, "en")],
  ] as const;
}

export function getPrerenderRoutes() {
  return PUBLIC_BASE_PATHS.flatMap((basePath) =>
    (["en", "pl", "es"] as const).map((language) => ({
      language,
      basePath,
      path: localizePublicPath(basePath, language),
    })),
  );
}
