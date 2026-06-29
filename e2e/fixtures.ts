/**
 * Custom Playwright test fixtures for TMC Studio E2E tests.
 */

import { test as base, type Page } from '@playwright/test';

/**
 * DevLogin helper: logs in via the app's devLogin mechanism.
 *
 * The app exposes `onDevLogin` to the TopBar when `import.meta.env.DEV`.
 * This function navigates to /app, opens the auth modal via keyboard/URL,
 * and clicks the dev login button for the given tier.
 */
export async function devLogin(page: Page, tier: 'guest' | 'free' | 'pro' | 'team' = 'pro') {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');

  // The TopBar user button should be visible
  const userButton = page.locator('[data-testid="topbar-user-button"], button:has-text("Sign In"), button:has-text("Zaloguj")').first();
  if (await userButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await userButton.click();
  }

  // Click dev login button for the tier
  const devBtn = page.locator(`button:has-text("${tier}")`).first();
  if (await devBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await devBtn.click();
    await page.waitForTimeout(500);
  }

  // Wait for board to load
  await page.waitForLoadState('networkidle');
}

export interface E2EFixtures {
  devLogin: (tier?: 'guest' | 'free' | 'pro' | 'team') => Promise<void>;
}

export const test = base.extend<E2EFixtures>({
  devLogin: async ({ page }, use) => {
    await use((tier) => devLogin(page, tier));
  },
});

export { expect } from '@playwright/test';
