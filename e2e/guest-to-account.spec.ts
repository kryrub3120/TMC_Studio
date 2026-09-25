/**
 * E2E: work done as a guest survives creating an account (launch stage E2, P0).
 *
 * A guest's board is only saved locally. After signing in it must reach the
 * cloud on its own, without another edit, so it is not lost on another device.
 * The sign-in is simulated by storing a dev mock session and reloading, which
 * is the state the app sees after the auth redirect.
 */

import { test, expect } from '@playwright/test';
import { boardViewport, clearBoard, expectSingleCloudProject, openBoard, readCloudProjects, saveStatus } from './cloud-board';

const USER_ID = 'dev-e2e-guest-signup';

test('a guest board is uploaded to the new account without another edit', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('tmc-e2e-guest') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('tmc-e2e-guest', '1');
    }
    localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
    localStorage.setItem('tmc-language', 'pl');
    localStorage.setItem(
      'tmc-ui-settings',
      JSON.stringify({ state: { tutorialCompleted: true, clubWelcomeSeen: true }, version: 0 }),
    );
  });

  // As a guest: draw two players; the board is kept locally.
  await openBoard(page);
  await clearBoard(page);
  await page.keyboard.press('p');
  await page.keyboard.press('p');
  await expect(boardViewport(page)).toHaveAttribute('data-element-count', '2');
  await expect
    .poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('tmc-studio-board') ?? '{"steps":[{"elements":[]}]}').steps[0].elements.length), { timeout: 10_000 })
    .toBe(2);

  // Sign in (dev mock session) and come back to the board.
  await page.evaluate((id) => {
    localStorage.setItem('tmc-studio-dev-cloud-user', id);
    localStorage.setItem('tmc-auth', JSON.stringify({
      state: {
        isInitialized: true,
        isMockUser: true,
        isAuthenticated: true,
        isPro: false,
        isTeam: false,
        user: { id, email: `${id}@tmcstudio.test`, full_name: 'New Coach', subscription_tier: 'free' },
      },
      version: 0,
    }));
  }, USER_ID);
  expect(await readCloudProjects(page, USER_ID)).toHaveLength(0);
  await page.reload();

  // No edit: the guest board must still become the account's project.
  await expect(boardViewport(page)).toHaveAttribute('data-element-count', '2');
  const project = await expectSingleCloudProject(page, USER_ID);
  expect(project.document.steps[0].elements).toHaveLength(2);
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 15_000 });

  // Another reload must not create a duplicate.
  await page.reload();
  await expect(boardViewport(page)).toHaveAttribute('data-element-count', '2');
  await page.waitForTimeout(2500);
  expect(await readCloudProjects(page, USER_ID)).toHaveLength(1);
});

test('opening the app as a new user does not upload the untouched demo board', async ({ page }) => {
  const userId = 'dev-e2e-untouched-demo';
  await page.addInitScript((id) => {
    if (sessionStorage.getItem('tmc-e2e-demo') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('tmc-e2e-demo', '1');
    }
    localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
    localStorage.setItem('tmc-studio-dev-cloud-user', id);
    localStorage.setItem('tmc-auth', JSON.stringify({
      state: {
        isInitialized: true, isMockUser: true, isAuthenticated: true, isPro: false, isTeam: false,
        user: { id, email: `${id}@tmcstudio.test`, full_name: 'Demo', subscription_tier: 'free' },
      },
      version: 0,
    }));
    localStorage.setItem('tmc-ui-settings', JSON.stringify({ state: { tutorialCompleted: true, clubWelcomeSeen: true }, version: 0 }));
  }, userId);

  await openBoard(page);
  await page.waitForTimeout(3000);
  expect(await readCloudProjects(page, userId)).toHaveLength(0);
});
