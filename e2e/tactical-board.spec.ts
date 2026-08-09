/**
 * E2E: Golden path — guest creates a tactical board and exports it.
 *
 * HARD ASSERTIONS:
 * - Export PNG: waitForEvent('download'), assert .png filename
 * - Keyboard shortcuts work (no crash)
 * - No soft-guards: critical assertions never wrapped in `if (visible)`
 *
 * Board elements are on Konva canvas (no DOM access) — the golden path
 * proof is export success (proves state exists).
 */

import { test, expect } from '@playwright/test';

test.describe('Board onboarding', () => {
  test('tutorial exposes a prominent global skip action', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
      localStorage.setItem('tmc-ui-settings', JSON.stringify({
        state: { tutorialCompleted: false, clubWelcomeSeen: true },
        version: 0,
      }));
    });
    await page.goto('/app');
    await expect(page.getByTestId('tutorial-skip')).toBeVisible();
    await page.getByTestId('tutorial-skip').click();
    await expect(page.getByTestId('tutorial-skip')).toBeHidden();
  });
});

test.describe('Tactical Board — Guest Golden Path', () => {
  const clearBoard = async (page: import('@playwright/test').Page) => {
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '0');
  };

  const dragOnPitch = async (
    page: import('@playwright/test').Page,
    startRatio = { x: 0.12, y: 0.12 },
  ) => {
    const canvas = page.getByTestId('board-viewport').locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const start = { x: box!.x + box!.width * startRatio.x, y: box!.y + box!.height * startRatio.y };
    const end = { x: start.x + 120, y: start.y + 75 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });
    await page.mouse.up();
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Dismiss tutorial overlay
    const skipBtn = page.getByTestId('tutorial-skip');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('guest can open the board page', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('TMC Studio');
  });

  test('add player via keyboard does not crash the app', async ({ page }) => {
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    await page.keyboard.press('b');
    await page.waitForTimeout(500);

    // If the app crashed, the export button would be detached
    await expect(page.locator('[data-tour="export"]')).toBeAttached({ timeout: 5000 });
  });

  test('golden path: add player → export PNG → file downloaded', async ({ page }) => {
    // Arrange: add a player to create state
    await page.keyboard.press('p');
    await page.waitForTimeout(500);

    // Act: click export button
    await page.locator('[data-tour="export"]').click();
    await page.waitForTimeout(500);

    // Assert: export menu is open
    await expect(page.locator('[data-tour="export-menu"]')).toBeVisible({ timeout: 3000 });

    // Arrange download listener BEFORE clicking the export option
    const downloadPromise = page.waitForEvent('download');

    // Act: click "PNG — Current step" (locale-independent via data-tour + role)
    const pngButton = page.locator('[data-tour="export-menu"] button').filter({ hasText: 'PNG' }).first();
    await pngButton.click();

    // Assert: file download triggered
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(png|jpe?g)$/i);

    // App should still be responsive
    await expect(page.locator('[data-tour="export"]')).toBeAttached({ timeout: 5000 });
  });

  test('golden path: add away player via Shift+P', async ({ page }) => {
    await page.keyboard.press('p');
    await page.waitForTimeout(300);
    await page.keyboard.press('Shift+p');
    await page.waitForTimeout(300);

    await expect(page.locator('[data-tour="export"]')).toBeAttached({ timeout: 5000 });
  });

  test('released animation timeline and SVG export are available', async ({ page }) => {
    await expect(page.locator('[data-tour="timeline"]')).toBeVisible();

    await page.locator('[data-tour="export"]').click();
    const exportMenu = page.locator('[data-tour="export-menu"]');
    await expect(exportMenu).toBeVisible();
    await expect(exportMenu.getByRole('button', { name: /SVG/i })).toBeVisible();
  });

  test('empty drag selects at fit zoom instead of throwing the pitch aside', async ({ page }) => {
    const viewport = page.getByTestId('board-viewport');
    await expect(viewport).toHaveAttribute('data-user-zoom', '1.000');

    const panX = await viewport.getAttribute('data-pan-x');
    const panY = await viewport.getAttribute('data-pan-y');
    const canvas = viewport.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const start = { x: box!.x + box!.width * 0.12, y: box!.y + box!.height * 0.12 };
    const end = { x: start.x + 80, y: start.y + 55 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 6 });
    await expect(viewport).toHaveAttribute('data-marquee-active', 'true');
    await page.mouse.up();

    await expect(viewport).toHaveAttribute('data-marquee-active', 'false');
    await expect(viewport).toHaveAttribute('data-pan-x', panX!);
    await expect(viewport).toHaveAttribute('data-pan-y', panY!);
  });

  test('explicit zoom pan cancels marquee selection', async ({ page }) => {
    const viewport = page.getByTestId('board-viewport');
    await expect(viewport).toHaveAttribute('data-user-zoom', '1.000');
    await page.getByRole('button', { name: /Przybliż|Zoom in/i }).click();
    await expect.poll(async () => Number(await viewport.getAttribute('data-user-zoom'))).toBeGreaterThan(1.05);
    const panX = await viewport.getAttribute('data-pan-x');

    const canvas = viewport.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const start = { x: box!.x + box!.width * 0.12, y: box!.y + box!.height * 0.12 };
    const end = { x: start.x + 90, y: start.y + 35 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });

    await expect(viewport).toHaveAttribute('data-marquee-active', 'false');
    expect(await viewport.getAttribute('data-pan-x')).not.toBe(panX);
    await page.mouse.up();
  });

  for (const board of [
    { id: 'half-2d', view: 'half' },
    { id: 'penalty-2d', view: 'penalty-area' },
  ]) {
    test(`white mode preserves the ${board.view} board`, async ({ page }) => {
      const viewport = page.getByTestId('board-viewport');
      await page.locator('[data-tour="pitch"]').click();
      await page.locator(`[data-board-id="${board.id}"]`).click();
      await page.getByRole('button', { name: /Zresetuj planszę|Reset board|Restablecer pizarra/i }).click();
      await expect(viewport).toHaveAttribute('data-pitch-view', board.view);

      await page.keyboard.press('w');
      await expect(viewport).toHaveAttribute('data-pitch-view', board.view);
      await page.keyboard.press('w');
      await expect(viewport).toHaveAttribute('data-pitch-view', board.view);
    });
  }

  test('collapsed squad bench offers direct first-player creation', async ({ page }) => {
    const quickAdd = page.getByRole('button', { name: /Dodaj pierwszego zawodnika|Add first player/i });
    await expect(quickAdd).toBeVisible();
    await quickAdd.click();
    await expect(page.getByPlaceholder(/Zawodnik|Player/i)).toBeVisible();
  });

  test('keyboard tools add players, ball, text and equipment', async ({ page }) => {
    const viewport = page.getByTestId('board-viewport');
    await clearBoard(page);

    for (const key of ['p', 'Shift+p', 'b', 't', 'k', 'q']) {
      const before = Number(await viewport.getAttribute('data-element-count'));
      await page.keyboard.press(key);
      await expect(viewport).toHaveAttribute('data-element-count', String(before + 1));
    }
  });

  test('canvas tools draw a pass arrow and two zone shapes', async ({ page }) => {
    const viewport = page.getByTestId('board-viewport');
    await clearBoard(page);

    await page.keyboard.press('a');
    await dragOnPitch(page);
    await expect(viewport).toHaveAttribute('data-element-count', '1');

    await page.keyboard.press('z');
    await dragOnPitch(page, { x: 0.68, y: 0.16 });
    await expect(viewport).toHaveAttribute('data-element-count', '2');

    await page.keyboard.press('Shift+z');
    await dragOnPitch(page, { x: 0.66, y: 0.68 });
    await expect(viewport).toHaveAttribute('data-element-count', '3');
  });

  test('undo and redo restore board element changes', async ({ page }) => {
    const viewport = page.getByTestId('board-viewport');
    await clearBoard(page);
    await page.keyboard.press('p');
    await expect(viewport).toHaveAttribute('data-element-count', '1');
    await page.keyboard.press('Control+z');
    await expect(viewport).toHaveAttribute('data-element-count', '0');
    await page.keyboard.press('Control+Shift+z');
    await expect(viewport).toHaveAttribute('data-element-count', '1');
  });

  test('topbar settings shortcut opens preferences directly', async ({ page }) => {
    await page.locator('button[title="Ustawienia"], button[title="Settings"], button[title="Ajustes"]').click();
    await expect(page.locator('[data-tour="settings-modal"]')).toBeVisible();
    await expect(page.getByText(/Preferencje|Preferences|Preferencias/i).first()).toBeVisible();
  });
});
