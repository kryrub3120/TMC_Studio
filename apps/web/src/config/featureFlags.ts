/**
 * Feature Flags
 * TMC Studio - Centralised, build-time feature toggles.
 *
 * Flags are driven by Vite environment variables (`VITE_*`) so they can be
 * controlled per-environment via `.env.local` (dev) or the hosting dashboard
 * (Netlify, production). All flags default to the SAFEST value (off) so that a
 * missing/misconfigured env var never accidentally exposes an unfinished
 * feature in production.
 *
 * Usage:
 *   import { ANIMATION_ENABLED } from '../config/featureFlags';
 *   if (ANIMATION_ENABLED) { ... }
 */

/// <reference types="vite/client" />

/**
 * Parse a Vite env var as a boolean flag.
 * Only the literal string `'true'` enables the flag; everything else
 * (undefined, '', 'false', '0', etc.) resolves to `false`.
 */
function parseFlag(value: string | boolean | undefined): boolean {
  return value === true || value === 'true';
}

/**
 * Animation module toggle.
 *
 * When `false` (the default / MVP configuration) the entire animation UI is
 * hidden: the bottom steps bar and all animation keyboard shortcuts
 * (L / N / X, prev/next step). The canvas, folders and the rest of the app
 * keep working normally — animation logic stays dormant (no playback loop,
 * interpolation is a no-op while `isPlaying` is false).
 *
 * Enable locally via `.env.local`:
 *   VITE_ANIMATION_ENABLED=true
 */
export const ANIMATION_ENABLED: boolean = parseFlag(
  import.meta.env.VITE_ANIMATION_ENABLED,
);
