/**
 * E2E: Pricing & Checkout flow.
 *
 * HARD ASSERTIONS:
 * - Modal [role="dialog"] MUST be visible after /board?upgrade=pro&cycle=yearly
 * - Modal MUST display the exact yearly Pro price
 * - Public pricing page renders with plan matrix
 * - No soft-guards: critical assertions never under `if (visible)`
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing & Checkout Flow', () => {
  test('public pricing page renders with plan cards', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Dismiss cookie banner if present
    const acceptBtn = page.locator('button:has-text("Akceptuj")').first();
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }

    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Pro")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test('Polish pricing page presents the agreed PLN prices', async ({ page }) => {
    await page.goto('/pl/pricing');

    await expect(page.getByText('29 PLN', { exact: true })).toBeVisible();
    await expect(page.getByText('99 PLN', { exact: true })).toBeVisible();
  });

  test('pricing page has paid CTA that preserves plan and billing cycle', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const acceptBtn = page.locator('button:has-text("Akceptuj")').first();
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /yearly|rocznie/i }).click();
    const proCta = page.locator('a[href="/board?upgrade=pro&cycle=yearly"]');
    await expect(proCta).toBeVisible({ timeout: 5000 });
  });

  test('Team savings use the selected billing period', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Save \$16\/mo|Oszczędzasz \$16\/mies|Ahorra \$16\/mes/i)).toBeVisible();

    await page.getByRole('button', { name: /yearly|rocznie|anual/i }).click();
    await expect(page.getByText(/Save \$160\/yr|Oszczędzasz \$160\/rok|Ahorra \$160\/año/i)).toBeVisible();
  });

  test('legal notice does not advertise the discontinued ODR platform', async ({ page }) => {
    await page.goto('/legal');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/ODR platform|Platforma ODR|Plataforma ODR/i)).toHaveCount(0);
    await expect(page.locator('a[href*="ec.europa.eu/consumers/odr"]')).toHaveCount(0);
  });

  test('cookie consent can be withdrawn from the cookie policy', async ({ page }) => {
    await page.goto('/cookies');
    await page.waitForLoadState('networkidle');

    const accept = page.getByRole('button', { name: /Accept all|Akceptuj wszystkie|Aceptar todas/i });
    if (await accept.isVisible()) await accept.click();

    await page.getByRole('button', {
      name: /Change analytics consent|Zmień zgodę na analitykę|Cambiar el consentimiento/i,
    }).click();

    await expect(page.getByRole('region', { name: /Cookie consent|Zgoda na cookies|Consentimiento/i })).toBeVisible();
  });

  test('/board?upgrade=pro&cycle=yearly opens pricing modal with yearly price', async ({ page }) => {
    await page.goto('/board?upgrade=pro&cycle=yearly');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Dismiss cookie banner (English in headless: "Accept all")
    const acceptBtn = page.locator('button:has-text("Accept")').first();
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }

    // Dismiss tutorial overlay ("Skip" in English, "Pomiń" in PL)
    const skipBtn = page.locator('button:has-text("Pomiń"), button:has-text("Skip")').first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog).toContainText('$90');
    await expect(dialog).toContainText(/\/yr|\/rok/i);

    await dialog.getByRole('button', { name: /Upgrade to Pro|Przejdź na Pro|Mejorar a Pro/i }).click();
    await expect(page.getByRole('heading', { name: /Continue for free|Kontynuuj za darmo|Continuar gratis/i })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => sessionStorage.getItem('tmc-pending-upgrade'))).toContain('"plan":"pro"');
    await expect.poll(async () => page.evaluate(() => sessionStorage.getItem('tmc-pending-upgrade'))).toContain('"cycle":"yearly"');

    // Close auth and return to the board.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // App should still be responsive
    await expect(page.locator('#root')).toBeAttached({ timeout: 5000 });
  });

  test('pricing table shows feature comparison', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const acceptBtn = page.locator('button:has-text("Akceptuj")').first();
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }

    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table').last()).toContainText('JPG', { timeout: 5000 });
  });
});
