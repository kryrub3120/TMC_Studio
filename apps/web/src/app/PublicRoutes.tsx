import { Route } from "react-router-dom";
import {
  AccessibilityPage,
  ChangelogPage,
  CookiePolicy,
  GrowthPage,
  LandingPage,
  LegalNoticePage,
  PricingPage,
  PrivacyPolicy,
  RefundsPage,
  ReportBugPage,
  TermsOfService,
} from "../pages";
import { isGrowthPagePath } from "../seo/growthContent";
import { getPrerenderRoutes, type PublicBasePath } from "../seo/publicSeo";

const COMPONENTS: Partial<Record<PublicBasePath, React.ReactElement>> = {
  "/": <LandingPage />,
  "/pricing": <PricingPage />,
  "/privacy": <PrivacyPolicy />,
  "/terms": <TermsOfService />,
  "/cookies": <CookiePolicy />,
  "/refunds": <RefundsPage />,
  "/legal": <LegalNoticePage />,
  "/accessibility": <AccessibilityPage />,
  "/changelog": <ChangelogPage />,
  "/report-bug": <ReportBugPage />,
};

export function renderPublicRouteElements(homeOverride?: React.ReactElement) {
  return getPrerenderRoutes().map(({ path, basePath, language }) => (
    <Route
      key={`${language}:${basePath}`}
      path={path}
      element={
        basePath === "/" && language === "en" && homeOverride
          ? homeOverride
          : isGrowthPagePath(basePath)
            ? <GrowthPage path={basePath} />
            : COMPONENTS[basePath]
      }
    />
  ));
}
