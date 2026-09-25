/**
 * Production smoke test (launch checklist P0): after every production deploy,
 * a dedicated test account signs in, creates a project, edits it, reloads,
 * exports a PNG and deletes the project.
 *
 * Runs only with SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD set (see
 * .github/workflows/production-smoke.yml); skipped in the regular E2E run.
 * It touches only projects named "Smoke …" in the test account.
 */

import { test, expect, type Page } from '@playwright/test';

const email = process.env.SMOKE_TEST_EMAIL;
const password = process.env.SMOKE_TEST_PASSWORD;

test.skip(!email || !password, 'SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD not set');

const viewport = (page: Page) => page.getByTestId('board-viewport');
const saveStatus = (page: Page) => page.getByTestId('save-status');
const library = (page: Page) => page.locator('[data-tour="projects-panel"]');

async function openLibrary(page: Page) {
  await page.getByRole('button', { name: 'Open Projects' }).click();
  await expect(library(page)).toBeVisible();
}

async function deleteProject(page: Page, name: string) {
  await library(page).getByRole('button', { name: `Project actions for ${name}` }).first().click();
  await page.getByRole('menuitem', { name: /Delete/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(library(page).getByRole('button', { name: `Project actions for ${name}` })).toHaveCount(0);
}

test('sign in → new project → edit → reload → export PNG → delete', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'smoke' }));
    localStorage.setItem('tmc-language', 'en');
    if (!localStorage.getItem('tmc-ui-settings')) {
      localStorage.setItem('tmc-ui-settings', JSON.stringify({ state: { tutorialCompleted: true, clubWelcomeSeen: true }, version: 0 }));
    }
  });

  // Sign in with e-mail and password.
  await page.goto('/board');
  await expect(viewport(page)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Sign In' }).first().click();
  const form = page.locator('form').filter({ has: page.locator('input[type="email"]') });
  await form.locator('input[type="email"]').fill(email!);
  await form.locator('input[type="password"]').first().fill(password!);
  await form.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toHaveCount(0, { timeout: 30_000 });

  // Remove projects left behind by an earlier failed run.
  await openLibrary(page);
  const leftovers = await library(page)
    .getByRole('button', { name: /^Project actions for Smoke / })
    .evaluateAll((buttons) => [...new Set(buttons.map((b) => b.getAttribute('aria-label')!.replace('Project actions for ', '')))]);
  for (const name of leftovers) await deleteProject(page, name);

  // New project with a unique name.
  const name = `Smoke ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
  await library(page).locator('[data-testid^="create-"][data-testid$="-project"]').first().click();
  await expect(library(page)).toBeHidden();
  await page.getByRole('banner').getByTitle('Click to rename').first().click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(name);
  await page.keyboard.press('Enter');

  // Edit: two players.
  await page.keyboard.press('Escape');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await expect(viewport(page)).toHaveAttribute('data-element-count', '0');
  await page.keyboard.press('p');
  await page.keyboard.press('p');
  await expect(viewport(page)).toHaveAttribute('data-element-count', '2');
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'unsaved');
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 30_000 });

  // Reload: same project, same content, saved.
  await page.reload();
  await expect(viewport(page)).toHaveAttribute('data-element-count', '2', { timeout: 30_000 });
  await expect(page.getByRole('button', { name })).toBeVisible();
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved');

  // Export PNG.
  await page.locator('[data-tour="export"]').click();
  const download = page.waitForEvent('download', { timeout: 30_000 });
  await page.locator('[data-tour="export-menu"] button').filter({ hasText: 'PNG' }).first().click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await page.keyboard.press('Escape');

  // Delete the project again.
  await openLibrary(page);
  await deleteProject(page, name);
});
