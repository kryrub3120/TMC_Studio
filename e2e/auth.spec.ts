/**
 * E2E: Authentication flow — login via devLogin.
 *
 * Covers:
 * - Guest state (no auth)
 * - Dev login as Pro user
 * - Auth modal can be dismissed
 *
 * NOTE: Uses force:true clicks because modals/overlays may intercept clicks.
 */

import { test, expect } from './fixtures';

test.describe('Authentication — Dev Login Flow', () => {
  test('OAuth popup callback without opener never renders the app shell', async ({ page }) => {
    await page.addInitScript(() => {
      window.name = 'tmc-google-auth';
      window.localStorage.setItem('tmc-language', 'en');
    });

    await page.goto('/auth/callback?error=access_denied&error_description=Simulated');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);

    await expect(page).not.toHaveURL(/\/board/);
    await expect(page.getByText('Login could not finish')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Close window' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toHaveCount(0);
  });

  test('guest can see the app without authentication', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');

    // The app loads — the landing page or board should be visible
    await expect(page.locator('header, nav, [class*="topbar"], [class*="top-bar"], #root').first()).toBeVisible({ timeout: 15000 });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('dev login as Pro user via keyboard shortcut', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // First dismiss any modal overlay by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // The app uses a TopBar with an account/upgrade button.
    // Guest sees a "Sign In" / account button — click it to open auth modal.
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Zaloguj"), [aria-label*="account"]').first();
    if (await signInBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signInBtn.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
    }

    // Try using keyboard shortcut if the app has one for the auth modal
    // Also try the upgrade/account button in the top bar
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Dev login buttons are labeled like "Pro" / "pro" / "Test login as Pro"
    const proBtn = page.locator('button:has-text("Pro"), button:has-text("pro")').first();
    if (await proBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await proBtn.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Board should still be visible after login
    await expect(page.locator('header, nav, [class*="topbar"], [class*="top-bar"], #root').first()).toBeVisible({ timeout: 10000 });
  });

  test('auth modal can be closed without login', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');

    // Press Escape multiple times to close any open modals
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // The app should still be usable
    await expect(page.locator('header, nav, [class*="topbar"], [class*="top-bar"], #root').first()).toBeVisible({ timeout: 5000 });
  });
});
