import { expect, test } from '@playwright/test';

test.describe('Public 0.13.0 release', () => {
  test('guest sees the complete coaching workflow and public release links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /TMC Studio|taktyk|tactic/i }).first()).toBeVisible();
    await expect(page.getByText(/Presety składu|Squad presets|Alineaciones guardadas/i)).toBeVisible();
    await page.goto('/changelog');
    await expect(page.getByRole('heading', { name: 'v0.13.0' })).toBeVisible();
    await expect(page.getByText(/Nazwane presety|Named squad presets|Alineaciones con nombre/i)).toBeVisible();
  });

  test('bug report form is usable without authentication on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/report-bug');
    await expect(page.getByTestId('bug-report-form')).toBeVisible();
    await page.getByLabel(/Krótki tytuł|Short problem title|Título breve/i).fill('Test report form');
    await page.getByLabel(/Co się wydarzyło|What happened|Qué ocurrió/i).fill('This is a browser-only validation of the public feedback form.');
    const formBox = await page.getByTestId('bug-report-form').boundingBox();
    expect(formBox).not.toBeNull();
    expect(formBox!.x + formBox!.width).toBeLessThanOrEqual(390);
  });
});
