/**
 * E2E: cloud save integrity (launch stage E2).
 *
 * Guards the E1 fixes: a reload must keep editing the same cloud project
 * (no duplicate INSERT), and a finished autosave must show "saved" instead of
 * staying "unsaved".
 */

import { test, expect } from '@playwright/test';
import {
  boardViewport,
  clearBoard,
  expectSavedAfterEdit,
  expectSingleCloudProject,
  openBoard,
  pressAndExpectCount,
  readPersistedCloudProjectId,
  saveStatus,
  useCloudUser,
} from './cloud-board';

test.describe('Cloud save integrity', () => {
  test('create → edit → reload keeps one project and shows Saved', async ({ page }) => {
    const userId = 'dev-e2e-save-reload';
    await useCloudUser(page, userId);
    await openBoard(page);

    // First edits of a new document create the cloud project.
    await clearBoard(page);
    await pressAndExpectCount(page, 'p', 1);
    await pressAndExpectCount(page, 'p', 2);
    await expectSavedAfterEdit(page);

    const created = await expectSingleCloudProject(page, userId);
    expect(created.document.steps[0].elements).toHaveLength(2);
    expect(await readPersistedCloudProjectId(page)).toBe(created.id);

    await page.reload();
    await expect(boardViewport(page)).toHaveAttribute('data-element-count', '2');
    await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved');

    // The first autosave after a reload must UPDATE the same row.
    await page.keyboard.press('Escape');
    await pressAndExpectCount(page, 'b', 3);
    await expectSavedAfterEdit(page);

    const updated = await expectSingleCloudProject(page, userId);
    expect(updated.id).toBe(created.id);
    expect(updated.document.steps[0].elements).toHaveLength(3);
  });

  test('edits spread across several autosaves end in one up-to-date project', async ({ page }) => {
    const userId = 'dev-e2e-save-bursts';
    await useCloudUser(page, userId);
    await openBoard(page);
    await clearBoard(page);

    // Each burst lands before, during or after the previous 2 s autosave.
    let count = 0;
    for (const pauseMs of [0, 1900, 2100, 2500]) {
      await page.waitForTimeout(pauseMs);
      count += 1;
      await pressAndExpectCount(page, 'p', count);
    }
    await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 15_000 });

    const project = await expectSingleCloudProject(page, userId);
    expect(project.document.steps[0].elements).toHaveLength(count);

    await page.reload();
    await expect(boardViewport(page)).toHaveAttribute('data-element-count', String(count));
    expect((await expectSingleCloudProject(page, userId)).id).toBe(project.id);
  });
});
