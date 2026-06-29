/**
 * E2E: Golden path — guest creates a tactical board and exports it.
 *
 * HARD ASSERTIONS:
 * - Export PNG: waitForEvent('download'), assert .png filename
 * - Keyboard shortcuts work (no crash)
 * - No soft-guards: critical assertions never wrapped in `if (visible)`
 *
 * Board elements are on Konva canvas (no DOM access) — the golden path
 * proof is export success (proves state exists).
 */

import { test, expect } from './fixtures';

test.describe('Tactical Board — Guest Golden Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Dismiss tutorial overlay
    const skipBtn = page.locator('button:has-text("Pomiń")').first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('guest can open the board page', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('TMC Studio');
  });

  test('add player via keyboard does not crash the app', async ({ page }) => {
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    // If the app crashed, the export button would be detached
    await expect(page.locator('[data-tour="export"]')).toBeAttached({ timeout: 5000 });
  });

  test('golden path: add player → export PNG → file downloaded', async ({ page }) => {
    // Arrange: add a player to create state
    await page.keyboard.press('p');
    await page.waitForTimeout(500);

    // Act: click export button
    await page.locator('[data-tour="export"]').click();
    await page.waitForTimeout(500);

    // Assert: export menu is open
    await expect(page.locator('[data-tour="export-menu"]')).toBeVisible({ timeout: 3000 });

    // Arrange download listener BEFORE clicking the export option
    const downloadPromise = page.waitForEvent('download');

    // Act: click "PNG — Current step" (locale-independent via data-tour + role)
    const pngButton = page.locator('[data-tour="export-menu"] button').filter({ hasText: 'PNG' }).first();
    await pngButton.click();

    // Assert: file download triggered
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(png|jpe?g)$/i);

    // App should still be responsive
    await expect(page.locator('[data-tour="export"]')).toBeAttached({ timeout: 5000 });
  });

  test('golden path: add away player via Shift+P', async ({ page }) => {
    await page.keyboard.press('p');
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift+p');
    await page.waitForTimeout(300);

    await expect(page.locator('[data-tour="export"]')).toBeAttached({ timeout: 5000 });
  });
});
