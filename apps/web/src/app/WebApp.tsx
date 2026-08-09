import React, { Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  AuthCallbackPage,
  InvitePage,
  NotFoundPage,
  ResetPasswordPage,
} from "../pages";
import { CookieConsentBanner } from "../components/CookieConsentBanner";
import { renderPublicRouteElements } from "./PublicRoutes";

const App = React.lazy(() => import("../App"));

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function Editor() {
  return (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  );
}

function LegacyAppRedirect() {
  const location = useLocation();
  return <Navigate to={`/board${location.search}${location.hash}`} replace />;
}

export function WebApp() {
  return (
    <>
      <Routes>
        {renderPublicRouteElements(isTauri ? <Editor /> : undefined)}
        <Route path="/board" element={<Editor />} />
        <Route path="/app" element={<LegacyAppRedirect />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/download" element={<Navigate to="/board" replace />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieConsentBanner />
    </>
  );
}
