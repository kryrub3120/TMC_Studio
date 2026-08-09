import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { LanguageProvider, type Language } from "@tmc/ui";
import { WebApp } from "./app/WebApp";
import { UpdatePrompt } from "./components/UpdatePrompt";
import {
  getAlternates,
  getPrerenderRoutes,
  getPublicMeta,
  type PublicBasePath,
} from "./seo/publicSeo";

export function render(url: string, language: Language): string {
  return renderToString(
    <React.StrictMode>
      <LanguageProvider initialLanguage={language}>
        <StaticRouter location={url}>
          <WebApp />
        </StaticRouter>
        <UpdatePrompt />
      </LanguageProvider>
    </React.StrictMode>,
  );
}

export function getPrerenderManifest() {
  return getPrerenderRoutes().map(({ path, language, basePath }) => ({
    path,
    language,
    basePath: basePath as PublicBasePath,
    ...getPublicMeta(basePath, language),
    alternates: getAlternates(basePath),
  }));
}
