/**
 * analytics — privacy-aware, consent-gated event tracking.
 *
 * No events are sent unless the user granted analytics consent via the cookie
 * banner (see components/CookieConsentBanner).
 *
 * Provider: Plausible-compatible API. Supports:
 *  - `window.plausible` (if Plausible script is loaded)
 *  - Fallback via `navigator.sendBeacon` to a self-hosted endpoint or Plausible
 *    proxy (configure PLUASIBLE_HOST / VITE_PLAUSIBLE_HOST env var).
 *
 * Key product metric: time-to-first-export (TTFE) — proves the "30 seconds"
 * promise. We start a timer when the editor mounts and record the delta on the
 * first export of a session.
 */
import { logger } from './logger';
import { getCookieConsent } from '../components/CookieConsentBanner';

const PLAUSIBLE_HOST = import.meta.env.VITE_PLAUSIBLE_HOST || 'https://plausible.io';

export const EVENTS = {
  LANDING_VIEW: 'landing_view',
  OPEN_BOARD: 'open_board',
  FIRST_ELEMENT_ADDED: 'first_element_added',
  FIRST_EXPORT: 'first_export',
  EXPORT: 'export',
  SIGNUP: 'signup',
  LIMIT_HIT: 'limit_hit',
  PRICING_VIEW: 'pricing_view',
  UPGRADE: 'upgrade',
} as const;

type ExportType = 'png' | 'jpg' | 'gif' | 'pdf' | 'svg';

let boardSessionStart: number | null = null;
let firstExportFired = false;

function analyticsAllowed(): boolean {
  return getCookieConsent()?.analytics === true;
}

/** Forward an event to Plausible-compatible endpoint. */
function forward(event: string, props: Record<string, unknown>): void {
  try {
    // If Plausible script is loaded, use it (supports custom props via callback)
    if (typeof (window as any).plausible === 'function') {
      (window as any).plausible(event, { props });
      return;
    }
    // Fallback: fetch to Plausible proxy endpoint.
    // sendBeacon sends credentials=include by default, which breaks Plausible's
    // Access-Control-Allow-Origin: * (CORS spec forbids wildcard + credentials).
    // fetch with credentials:omit + keepalive:true is the fix.
    const payload = { name: event, url: window.location.href, domain: window.location.hostname, props };
    void fetch(`${PLAUSIBLE_HOST}/api/event`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
    });
  } catch {
    // analytics failure is non-blocking — silently ignore
  }
}

/** Track an event (no-op unless analytics consent was granted). */
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (!analyticsAllowed()) return;
  forward(event, props);
  logger.debug('[analytics]', event, props);
}

/** Start the time-to-first-export timer (call when the editor mounts). */
export function startBoardSession(): void {
  if (boardSessionStart === null) boardSessionStart = Date.now();
}

/** Record an export; fires first_export with TTFE once per session. */
export function trackExport(type: ExportType): void {
  track(EVENTS.EXPORT, { type });
  if (!firstExportFired) {
    firstExportFired = true;
    const ttfeMs = boardSessionStart !== null ? Date.now() - boardSessionStart : null;
    track(EVENTS.FIRST_EXPORT, { type, ttfeMs });
  }
}
