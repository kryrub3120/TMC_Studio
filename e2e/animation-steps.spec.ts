/**
 * E2E: animation steps survive cloud save and reload (launch stage E2).
 *
 * Guards the E1 fix: autosave writes the canvas into the step being edited.
 * Before it, every autosave wrote into steps[0] and overwrote the first frame.
 *
 * Each step gets a different element count (visible on the viewport) and a
 * different player position (checked in the saved cloud document).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  boardViewport,
  clearBoard,
  expectSavedAfterEdit,
  expectSingleCloudProject,
  openBoard,
  playerPositions,
  pressAndExpectCount,
  saveStatus,
  useCloudUser,
  type StoredPosition,
} from './cloud-board';

const NUDGE_PX = 5;

async function expectStep(page: Page, index: number, elementCount: number): Promise<void> {
  const viewport = boardViewport(page);
  await expect(viewport).toHaveAttribute('data-step-index', String(index));
  await expect(viewport).toHaveAttribute('data-element-count', String(elementCount));
}

/** Select everything on the current step and move it with the arrow key. */
async function nudgeAll(page: Page, key: 'ArrowRight' | 'ArrowDown', times: number): Promise<void> {
  await page.keyboard.press('Control+a');
  for (let i = 0; i < times; i += 1) await page.keyboard.press(key);
  await page.keyboard.press('Escape');
  await expect(boardViewport(page)).toHaveAttribute('data-selected-count', '0');
}

async function addStep(page: Page, index: number, elementCount: number): Promise<void> {
  await page.keyboard.press('n');
  await expectStep(page, index, elementCount);
}

/**
 * Step 1: one player at P.
 * Step 2: that player at P + (20, 0), plus a ball.
 * Step 3: that player at P + (20, 20), the ball, plus a second player.
 */
async function buildThreeSteps(page: Page): Promise<void> {
  await clearBoard(page);
  await pressAndExpectCount(page, 'p', 1);
  await page.keyboard.press('Escape');

  await addStep(page, 1, 1);
  await nudgeAll(page, 'ArrowRight', 4);
  await pressAndExpectCount(page, 'b', 2);
  await page.keyboard.press('Escape');

  await addStep(page, 2, 2);
  await nudgeAll(page, 'ArrowDown', 4);
  await pressAndExpectCount(page, 'p', 3);
  await page.keyboard.press('Escape');
}

function expectThreeStepPositions(steps: Array<{ elements: Array<{ type: string; position?: StoredPosition }> }>) {
  expect(steps).toHaveLength(3);
  expect(steps.map((step) => step.elements.length)).toEqual([1, 2, 3]);

  const [p1] = playerPositions(steps[0].elements);
  const [p2] = playerPositions(steps[1].elements);
  const [p3] = playerPositions(steps[2].elements);
  const shift = 4 * NUDGE_PX;
  expect(p2).toEqual({ x: p1.x + shift, y: p1.y });
  expect(p3).toEqual({ x: p1.x + shift, y: p1.y + shift });
}

test.describe('Animation steps', () => {
  test('autosave on step 3 keeps all three steps after reload', async ({ page }) => {
    const userId = 'dev-e2e-steps-last';
    await useCloudUser(page, userId);
    await openBoard(page);

    await buildThreeSteps(page);
    await expectSavedAfterEdit(page);

    const project = await expectSingleCloudProject(page, userId);
    expectThreeStepPositions(project.document.steps);

    await page.reload();
    await expect(boardViewport(page)).toHaveAttribute('data-step-count', '3');
    await expectStep(page, 0, 1);
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 1, 2);
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 2, 3);
  });

  test('editing step 2 changes only step 2', async ({ page }) => {
    const userId = 'dev-e2e-steps-middle';
    await useCloudUser(page, userId);
    await openBoard(page);

    await buildThreeSteps(page);
    await expectSavedAfterEdit(page);
    const before = (await expectSingleCloudProject(page, userId)).document.steps;

    await page.keyboard.press('ArrowLeft');
    await expectStep(page, 1, 2);
    await pressAndExpectCount(page, 'Shift+p', 3);
    await page.keyboard.press('Escape');
    await expectSavedAfterEdit(page);

    const after = (await expectSingleCloudProject(page, userId)).document.steps;
    expect(after[0]).toEqual(before[0]);
    expect(after[1].elements).toHaveLength(3);
    expect(after[1].elements.slice(0, 2)).toEqual(before[1].elements);
    expect(after[2]).toEqual(before[2]);

    await page.reload();
    await expectStep(page, 0, 1);
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 1, 3);
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 2, 3);
  });

  test('playback runs through all steps and leaves them intact', async ({ page }) => {
    const userId = 'dev-e2e-steps-playback';
    await useCloudUser(page, userId);
    await openBoard(page);

    await buildThreeSteps(page);
    await expectSavedAfterEdit(page);
    const saved = (await expectSingleCloudProject(page, userId)).document.steps;
    expectThreeStepPositions(saved);

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expectStep(page, 0, 1);

    await page.getByTitle(/Odtwórz/).click();
    const viewport = boardViewport(page);
    await expect(viewport).toHaveAttribute('data-playing', 'true');
    await expect(viewport).toHaveAttribute('data-step-index', '1');
    await expect(viewport).toHaveAttribute('data-step-index', '2');
    await expect(viewport).toHaveAttribute('data-playing', 'false');

    // Playback must not write interpolated frames into the steps.
    await expectStep(page, 2, 3);
    await page.keyboard.press('ArrowLeft');
    await expectStep(page, 1, 2);
    await page.keyboard.press('ArrowLeft');
    await expectStep(page, 0, 1);

    // Let any autosave triggered by playback finish, then compare.
    await page.waitForTimeout(2500);
    await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 15_000 });
    expect((await expectSingleCloudProject(page, userId)).document.steps).toEqual(saved);
  });
});
