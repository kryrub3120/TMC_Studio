import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  LandingPage,
  PricingPage,
  PrivacyPolicy,
  TermsOfService,
  CookiePolicy,
  InvitePage,
  RefundsPage,
  LegalNoticePage,
  AccessibilityPage,
} from './pages';
import { LanguageProvider } from '@tmc/ui';
import { UpdatePrompt } from './components/UpdatePrompt';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import './index.css';

// The editor (App) is the heavy part of the bundle (Konva canvas, board state).
// Lazy-load it so the marketing landing page at `/` stays light and fast.
const App = React.lazy(() => import('./App'));

// In the Tauri desktop build the app is served from a custom protocol
// (tauri://localhost) where path-based routing is unreliable. Use HashRouter
// there and keep BrowserRouter for the web deployment.
const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const Router = isTauri ? HashRouter : BrowserRouter;

// Desktop opens straight into the editor; web shows the marketing landing.
const HomeElement = isTauri ? (
  <Suspense fallback={null}>
    <App />
  </Suspense>
) : (
  <LandingPage />
);

function OAuthCallbackRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isTauri || location.pathname === '/app') return;
    const params = new URLSearchParams(location.search);
    const hasOAuthCallback =
      params.has('code') ||
      params.has('error') ||
      location.hash.includes('access_token') ||
      location.hash.includes('error');

    if (hasOAuthCallback) {
      navigate(`/app${location.search}${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <Router>
        <OAuthCallbackRouteGuard />
        <Routes>
          <Route path="/" element={HomeElement} />
          <Route
            path="/app"
            element={
              <Suspense fallback={null}>
                <App />
              </Suspense>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/download" element={<Navigate to="/app" replace />} />
          <Route path="/refunds" element={<RefundsPage />} />
          <Route path="/legal" element={<LegalNoticePage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
        </Routes>
        <CookieConsentBanner />
      </Router>
      <UpdatePrompt />
    </LanguageProvider>
  </React.StrictMode>
);
