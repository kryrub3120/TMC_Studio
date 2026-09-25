/**
 * E2E: organising the library (launch stage E2, P0).
 *
 * Folders, moving a project into a folder, tags, favourites, pinning and
 * search — each change must survive a reload.
 */

import { test, expect, type Page } from '@playwright/test';
import { openBoard, useCloudUser, type StoredProject } from './cloud-board';

const USER_ID = 'dev-e2e-library-organize';

function project(id: string, name: string) {
  const now = new Date().toISOString();
  return {
    id,
    user_id: USER_ID,
    name,
    description: null,
    document: {
      version: '1.0.0',
      name,
      createdAt: now,
      updatedAt: now,
      currentStepIndex: 0,
      steps: [{ id: `${id}-s1`, name: '', duration: 0.8, elements: [] }],
      pitchConfig: { width: 1050, height: 680, padding: 40, gridSize: 10 },
    },
    thumbnail_url: null,
    is_public: false,
    is_template: false,
    version: 1,
    created_at: now,
    updated_at: now,
    folder_id: null,
    tags: [],
    is_favorite: false,
    is_pinned: false,
    position: 0,
  };
}

async function seedProjects(page: Page) {
  await page.addInitScript(({ id, projects }) => {
    const key = `tmc-studio-dev-cloud-projects-${id}`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(projects));
  }, { id: USER_ID, projects: [project('p-press', 'Pressing wysoki'), project('p-warm', 'Rozgrzewka'), project('p-set', 'Stałe fragmenty')] });
}

type StoredLibraryProject = StoredProject & { folder_id: string | null; tags: string[]; is_favorite: boolean; is_pinned: boolean };

async function stored(page: Page): Promise<Record<string, StoredLibraryProject>> {
  const list: StoredLibraryProject[] = await page.evaluate(
    (id) => JSON.parse(localStorage.getItem(`tmc-studio-dev-cloud-projects-${id}`) ?? '[]'),
    USER_ID,
  );
  return Object.fromEntries(list.map((p) => [p.id, p]));
}

async function openLibrary(page: Page) {
  await page.getByRole('button', { name: 'Otwórz projekty' }).click();
  const panel = page.locator('[data-tour="projects-panel"]');
  await expect(panel).toBeVisible();
  return panel;
}

async function projectAction(page: Page, name: string, item: string) {
  await page.getByRole('button', { name: `Akcje projektu ${name}` }).first().click();
  await page.getByRole('menuitem', { name: new RegExp(item) }).click();
}

test('folders, tags, favourites, pinning and search survive reload', async ({ page }) => {
  await useCloudUser(page, USER_ID);
  await seedProjects(page);
  await openBoard(page);
  const panel = await openLibrary(page);
  const actions = (name: string) => panel.getByRole('button', { name: `Akcje projektu ${name}` });

  for (const name of ['Pressing wysoki', 'Rozgrzewka', 'Stałe fragmenty']) {
    await expect(actions(name).first()).toBeVisible();
  }

  // Search by name.
  const search = panel.getByPlaceholder('Szukaj projektów…');
  await search.fill('rozg');
  await expect(actions('Rozgrzewka').first()).toBeVisible();
  await expect(actions('Pressing wysoki')).toHaveCount(0);
  await search.fill('');

  // Create a folder.
  await panel.getByRole('button', { name: 'Nowy folder' }).click();
  await page.getByPlaceholder('np. Taktyka, Treningi…').fill('Taktyka');
  await page.getByRole('button', { name: 'Utwórz folder' }).click();
  await expect(panel.getByRole('button', { name: /Taktyka/ }).first()).toBeVisible();

  // Move a project into it and tag it, from the project's actions.
  await projectAction(page, 'Pressing wysoki', 'Folder i tagi');
  const dialog = page.getByTestId('organize-project-dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Folder', { exact: true }).selectOption({ label: 'Taktyka' });
  await dialog.getByPlaceholder('Dodaj tag i naciśnij Enter').fill('U15');
  await dialog.getByPlaceholder('Dodaj tag i naciśnij Enter').press('Enter');
  await dialog.getByPlaceholder('Dodaj tag i naciśnij Enter').fill('pressing');
  await dialog.getByPlaceholder('Dodaj tag i naciśnij Enter').press('Enter');
  await expect(dialog.getByRole('button', { name: 'Usuń tag U15' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Usuń tag pressing' }).click();
  await dialog.getByRole('button', { name: 'Gotowe' }).click();
  await expect(dialog).toBeHidden();

  // Search finds it by tag.
  await search.fill('u15');
  await expect(actions('Pressing wysoki').first()).toBeVisible();
  await expect(actions('Rozgrzewka')).toHaveCount(0);
  await search.fill('');

  // Favourite and pin.
  await projectAction(page, 'Rozgrzewka', 'Dodaj do ulubionych');
  await projectAction(page, 'Stałe fragmenty', 'Przypnij na górze');

  await expect.poll(async () => {
    const byId = await stored(page);
    return {
      folder: Boolean(byId['p-press'].folder_id),
      tags: byId['p-press'].tags,
      favorite: byId['p-warm'].is_favorite,
      pinned: byId['p-set'].is_pinned,
    };
  }).toEqual({ folder: true, tags: ['U15'], favorite: true, pinned: true });

  // After a reload the folder shows only its project and the menus reflect the state.
  await page.reload();
  const reopened = await openLibrary(page);
  await reopened.getByRole('button', { name: /Taktyka/ }).first().click();
  await expect(reopened.getByRole('button', { name: 'Akcje projektu Pressing wysoki' }).first()).toBeVisible();
  await expect(reopened.getByRole('button', { name: 'Akcje projektu Rozgrzewka' })).toHaveCount(0);

  await reopened.getByRole('button', { name: /Wszystkie projekty/ }).click();
  await reopened.getByRole('button', { name: 'Akcje projektu Rozgrzewka' }).first().click();
  await expect(page.getByRole('menuitem', { name: /Usuń z ulubionych/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await reopened.getByRole('button', { name: 'Akcje projektu Stałe fragmenty' }).first().click();
  await expect(page.getByRole('menuitem', { name: /Odepnij/ })).toBeVisible();
});
