import { expect, test } from '@playwright/test';

const WIDTHS = [390, 768, 1024, 1280];

test.describe('Board responsive shell', () => {
  for (const width of WIDTHS) {
    test(`topbar fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/board');

      const topbar = page.locator('header').first();
      await expect(topbar).toBeVisible();
      const dimensions = await topbar.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }

  test('mobile keeps primary actions reachable and inspector closed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/board');

    await expect(page.locator('[data-tour="players"]')).toBeVisible();
    await expect(page.locator('[data-tour="export"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|zaloguj/i })).toBeVisible();
    await expect(page.locator('[data-tour="inspector"]')).toBeHidden();
  });

  test('projects drawer has a dedicated wheel-scroll container', async ({ page }) => {
    await page.goto('/board');
    await page.locator('[data-tour="projects"] button').first().click();

    const drawer = page.locator('[data-tour="projects-panel"]');
    await expect(drawer).toBeVisible();
    const scrollArea = drawer.locator('.overflow-y-auto').first();
    await expect(scrollArea).toBeVisible();
    expect(await scrollArea.evaluate((element) => getComputedStyle(element).overflowY)).toBe('auto');
  });
});
