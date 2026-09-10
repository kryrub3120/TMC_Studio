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
  if (!publicRoute) return;
  const nextPath = localizePublicPath(publicRoute.basePath, language);
  if (nextPath !== window.location.pathname) window.location.assign(nextPath);
}

const tree = (
  <React.StrictMode>
    <AppErrorBoundary>
      <LanguageProvider
        initialLanguage={publicRoute?.language}
        onLanguageChange={publicRoute ? handleLanguageChange : undefined}
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
