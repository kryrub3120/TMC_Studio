/**
 * E2E: step operations survive save and reload (launch stage E2, P0).
 *
 * Adding, deleting and renaming a step must be saved on their own, without
 * any other edit on the board, and the board must come back on reload with
 * the same steps. Playback: pause, resume and loop.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  boardViewport,
  clearBoard,
  expectSavedAfterEdit,
  expectSingleCloudProject,
  openBoard,
  pressAndExpectCount,
  useCloudUser,
} from './cloud-board';

async function expectSteps(page: Page, count: number, index: number) {
  const viewport = boardViewport(page);
  await expect(viewport).toHaveAttribute('data-step-count', String(count));
  await expect(viewport).toHaveAttribute('data-step-index', String(index));
}

/** One player on step 1, then empty-handed step additions only. */
async function boardWithOnePlayer(page: Page, userId: string) {
  await useCloudUser(page, userId);
  await openBoard(page);
  await clearBoard(page);
  await pressAndExpectCount(page, 'p', 1);
  await page.keyboard.press('Escape');
  await expectSavedAfterEdit(page);
}

test.describe('Step operations', () => {
  test('adding a step is saved without any other edit', async ({ page }) => {
    const userId = 'dev-e2e-steps-add';
    await boardWithOnePlayer(page, userId);

    await page.getByTitle('Dodaj krok (N)').click();
    await expectSteps(page, 2, 1);
    await expectSavedAfterEdit(page);
    expect((await expectSingleCloudProject(page, userId)).document.steps).toHaveLength(2);

    await page.reload();
    await expectSteps(page, 2, 0);
  });

  test('deleting a step is saved and the remaining steps keep their content', async ({ page }) => {
    const userId = 'dev-e2e-steps-delete';
    await boardWithOnePlayer(page, userId);

    // Step 2 gets a ball, step 3 a second player: 1 / 2 / 3 elements.
    await page.keyboard.press('n');
    await pressAndExpectCount(page, 'b', 2);
    await page.keyboard.press('Escape');
    await page.keyboard.press('n');
    await pressAndExpectCount(page, 'p', 3);
    await page.keyboard.press('Escape');
    await expectSteps(page, 3, 2);
    await expectSavedAfterEdit(page);

    // Delete the middle step with its chip button.
    await page.keyboard.press('ArrowLeft');
    await expectSteps(page, 3, 1);
    await page.getByRole('button', { name: 'Krok 2', exact: true }).hover();
    await page.getByRole('button', { name: 'Krok 2', exact: true }).locator('xpath=following-sibling::button').click();
    await expectSteps(page, 2, 1);
    await expectSavedAfterEdit(page);

    const steps = (await expectSingleCloudProject(page, userId)).document.steps;
    expect(steps.map((step) => step.elements.length)).toEqual([1, 3]);

    await page.reload();
    await expectSteps(page, 2, 0);
    await expect(boardViewport(page)).toHaveAttribute('data-element-count', '1');
    await page.keyboard.press('ArrowRight');
    await expect(boardViewport(page)).toHaveAttribute('data-element-count', '3');
  });

  test('renaming a step is saved', async ({ page }) => {
    const userId = 'dev-e2e-steps-rename';
    await boardWithOnePlayer(page, userId);
    await page.keyboard.press('n');
    await expectSteps(page, 2, 1);
    await expectSavedAfterEdit(page);

    await page.getByRole('button', { name: 'Krok 2', exact: true }).dblclick();
    const input = page.locator('input[type="text"]').last();
    await input.fill('Pressing');
    await input.press('Enter');
    await expect(page.getByRole('button', { name: 'Pressing', exact: true })).toBeVisible();
    await expectSavedAfterEdit(page);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Pressing', exact: true })).toBeVisible();
  });

  test('playback can be paused and loops back to step 1', async ({ page }) => {
    await boardWithOnePlayer(page, 'dev-e2e-steps-playback');
    await page.keyboard.press('n');
    await page.keyboard.press('n');
    await expectSteps(page, 3, 2);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expectSteps(page, 3, 0);

    const viewport = boardViewport(page);
    await page.getByTitle('Odtwórz (Space)').click();
    await expect(viewport).toHaveAttribute('data-playing', 'true');
    await expect(viewport).toHaveAttribute('data-step-index', '1');
    await page.getByTitle('Pauza (Space)').click();
    await expect(viewport).toHaveAttribute('data-playing', 'false');
    const pausedAt = await viewport.getAttribute('data-step-index');
    await page.waitForTimeout(1500);
    await expect(viewport).toHaveAttribute('data-step-index', pausedAt ?? '1');

    await page.getByTitle('Pętla (L)').click();
    await page.getByTitle('Odtwórz (Space)').click();
    await expect(viewport).toHaveAttribute('data-step-index', '2');
    await expect(viewport).toHaveAttribute('data-step-index', '0', { timeout: 15_000 });
    await expect(viewport).toHaveAttribute('data-playing', 'true');
    await page.getByTitle('Pauza (Space)').click();
    await expect(viewport).toHaveAttribute('data-playing', 'false');
  });
});
