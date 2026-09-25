/**
 * Helpers for E2E tests that exercise cloud save on the board.
 *
 * The signed-in user is a dev mock user, so project CRUD runs against the
 * localStorage-backed devCloud (apps/web/src/lib/devCloud.ts). Everything
 * above the API layer — autosave, the cloud write queue, cloudProjectId
 * persistence, the save badge — is the real application code.
 */

import { expect, type Page } from '@playwright/test';

export interface StoredPosition {
  x: number;
  y: number;
}

export interface StoredElement {
  id: string;
  type: string;
  position?: StoredPosition;
}

export interface StoredProject {
  id: string;
  name: string;
  document: {
    createdAt: string;
    steps: Array<{ id: string; elements: StoredElement[] }>;
  };
}

/**
 * Sign in as a fresh dev mock user and skip onboarding. Storage is wiped only
 * on the first navigation of the test, so reloads keep the saved state.
 */
export async function useCloudUser(
  page: Page,
  userId: string,
  plan: 'pro' | 'team' = 'pro',
): Promise<void> {
  await page.addInitScript(({ id, plan }) => {
    if (sessionStorage.getItem('tmc-e2e-initialized') !== id) {
      localStorage.clear();
      sessionStorage.setItem('tmc-e2e-initialized', id);
    }
    localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
    localStorage.setItem('tmc-language', 'pl');
    localStorage.setItem('tmc-studio-dev-cloud-user', id);
    localStorage.setItem(
      'tmc-auth',
      JSON.stringify({
        state: {
          isInitialized: true,
          isMockUser: true,
          isAuthenticated: true,
          isPro: true,
          isTeam: plan === 'team',
          user: {
            id,
            email: `${id}@tmcstudio.test`,
            full_name: 'E2E Coach',
            subscription_tier: plan,
          },
        },
        version: 0,
      }),
    );
    localStorage.setItem(
      'tmc-ui-settings',
      JSON.stringify({ state: { tutorialCompleted: true, clubWelcomeSeen: true }, version: 0 }),
    );
  }, { id: userId, plan });
}

export function boardViewport(page: Page) {
  return page.getByTestId('board-viewport');
}

export function saveStatus(page: Page) {
  return page.getByTestId('save-status');
}

/** Open the board and wait until it can take keyboard input. */
export async function openBoard(page: Page): Promise<void> {
  await page.goto('/board');
  await expect(boardViewport(page)).toBeVisible();
  await page.keyboard.press('Escape');
}

/** Remove the demo content a new board starts with. */
export async function clearBoard(page: Page): Promise<void> {
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await expect(boardViewport(page)).toHaveAttribute('data-element-count', '0');
}

/** Press a key that edits the board and wait for the element count to follow. */
export async function pressAndExpectCount(page: Page, key: string, count: number): Promise<void> {
  await page.keyboard.press(key);
  await expect(boardViewport(page)).toHaveAttribute('data-element-count', String(count));
}

/** Wait for the autosave that the last edit scheduled to reach the cloud. */
export async function expectSavedAfterEdit(page: Page): Promise<void> {
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'unsaved');
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 15_000 });
}

export async function readCloudProjects(page: Page, userId: string): Promise<StoredProject[]> {
  return page.evaluate((id) => {
    const raw = localStorage.getItem(`tmc-studio-dev-cloud-projects-${id}`);
    return raw ? JSON.parse(raw) : [];
  }, userId);
}

export async function readPersistedCloudProjectId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('tmc-studio-cloud-project');
    return raw ? (JSON.parse(raw).projectId as string) : null;
  });
}

/** The only cloud project of the user; fails if there is none or a duplicate. */
export async function expectSingleCloudProject(page: Page, userId: string): Promise<StoredProject> {
  await expect.poll(async () => (await readCloudProjects(page, userId)).length).toBe(1);
  const [project] = await readCloudProjects(page, userId);
  return project;
}

export function playerPositions(elements: StoredElement[]): StoredPosition[] {
  return elements
    .filter((element) => element.type === 'player')
    .map((element) => element.position as StoredPosition);
}
