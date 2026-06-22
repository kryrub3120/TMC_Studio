/**
 * Global setup for Playwright E2E tests.
 *
 * Currently no shared auth state — each test uses devLogin which sets
 * Zustand store directly (no real Supabase call). If we later need a
 * pre-authenticated browser context (e.g. for checkout e2e), this is
 * where we'd store session cookies/tokens.
 */

export default async function globalSetup(): Promise<void> {
  // Placeholder for future shared auth state
  console.log('[E2E] Global setup complete');
}
