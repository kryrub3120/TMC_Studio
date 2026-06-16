/**
 * analytics — privacy-aware, consent-gated event tracking.
 *
 * No events are sent unless the user granted analytics consent via the cookie
 * banner (see components/CookieConsentBanner). There is no provider wired yet;
 * events are structured-logged and ready to forward to Plausible/PostHog.
 *
 * Key product metric: time-to-first-export (TTFE) — proves the "30 seconds"
 * promise. We start a timer when the editor mounts and record the delta on the
 * first export of a session.
 */
import { logger } from './logger';
import { getCookieConsent } from '../components/CookieConsentBanner';

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

/** Track an event (no-op unless analytics consent was granted). */
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (!analyticsAllowed()) return;
  // TODO(provider): forward to Plausible/PostHog, e.g.
  //   (window as any).plausible?.(event, { props });
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
