import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { LanguageProvider, type Language } from "@tmc/ui";
import { WebApp } from "./app/WebApp";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { initializeMonitoring } from "./lib/monitoring";
import { getPublicRoute, localizePublicPath } from "./seo/publicSeo";
import "./index.css";

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const Router = isTauri ? HashRouter : BrowserRouter;
const publicRoute = isTauri ? null : getPublicRoute(window.location.pathname);

void initializeMonitoring();

function handleLanguageChange(language: Language) {
  // The app can navigate from a public page to /board without a reload. Resolve
  // the route at click time so changing the editor language never returns home.
  const currentPublicRoute = getPublicRoute(window.location.pathname);
  if (!currentPublicRoute) return;
  const nextPath = localizePublicPath(currentPublicRoute.basePath, language);
  if (nextPath !== window.location.pathname) window.location.assign(nextPath);
}

const tree = (
  <React.StrictMode>
    <AppErrorBoundary>
      <LanguageProvider
        initialLanguage={publicRoute?.language}
        onLanguageChange={isTauri ? undefined : handleLanguageChange}
      >
        <Router>
          <WebApp />
        </Router>
        <UpdatePrompt />
      </LanguageProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

const root = document.getElementById("root")!;
if (publicRoute && root.hasChildNodes()) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
