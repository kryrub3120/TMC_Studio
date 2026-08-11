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

  test('projects drawer exposes graphics, exercises and session plans without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/board');
    await page.locator('[data-tour="projects"] button').first().click();
    const drawer = page.locator('[data-tour="projects-panel"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByTestId('create-graphic-project')).toBeVisible();
    await expect(drawer.getByTestId('library-type-graphic')).toBeVisible();
    await expect(drawer.getByTestId('library-type-exercise')).toBeVisible();
    await expect(drawer.getByTestId('library-type-session')).toBeVisible();
    const dimensions = await drawer.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test('Free plan enforces three projects per library type', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
      localStorage.setItem('tmc-studio-dev-cloud-user', 'dev-free-project-limit');
      if (sessionStorage.getItem('tmc-free-limit-test-initialized') !== '1') {
        localStorage.removeItem('tmc-studio-dev-cloud-projects-dev-free-project-limit');
        localStorage.removeItem('tmc-studio-dev-cloud-folders-dev-free-project-limit');
        localStorage.removeItem('tmc-studio-board');
        sessionStorage.setItem('tmc-free-limit-test-initialized', '1');
      }
      localStorage.setItem('tmc-auth', JSON.stringify({
        state: {
          isInitialized: true,
          isMockUser: true,
          isAuthenticated: true,
          isPro: false,
          isTeam: false,
          user: { id: 'dev-free-project-limit', email: 'free-projects@tmcstudio.test', full_name: 'Free Projects', subscription_tier: 'free' },
        },
        version: 0,
      }));
      localStorage.setItem('tmc-ui-settings', JSON.stringify({ state: { tutorialCompleted: true, clubWelcomeSeen: true }, version: 0 }));
      localStorage.setItem('tmc-exercise-guide-seen', '1');
      localStorage.setItem('tmc-session-guide-seen', '1');
    });
    await page.goto('/board');

    const openLibrary = async () => {
      const workspaceButton = page.getByRole('button', { name: /Library|Biblioteka|Biblioteca/i });
      if (await workspaceButton.isVisible().catch(() => false)) await workspaceButton.click();
      else await page.locator('[data-tour="projects"] button').first().click();
    };

    for (let count = 0; count < 3; count += 1) {
      await openLibrary();
      await page.getByTestId('library-type-exercise').click();
      await page.getByTestId('create-exercise-project').click();
      await page.waitForTimeout(200);
    }

    await openLibrary();
    await page.getByTestId('library-type-exercise').click();
    await page.getByTestId('create-exercise-project').click();
    await expect(page.getByRole('heading', { name: /Osiągnięto limit planu Free|Free plan limit reached|Límite del plan Free/i })).toBeVisible();
  });

  test('settings use full-width content below scrollable tabs on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
      localStorage.setItem('tmc-ui-settings', JSON.stringify({
        state: { tutorialCompleted: true, clubWelcomeSeen: true },
        version: 0,
      }));
    });
    await page.goto('/board');
    await page.getByRole('button', { name: /Edytuj skład|Edit squad roster/i, exact: true }).click();

    const modal = page.locator('[data-tour="settings-modal"]');
    await expect(modal).toBeVisible();
    await modal.getByRole('navigation').getByRole('button', { name: /Drużyny|Teams|Equipos/i, exact: true }).click();
    const nameInput = page.getByTestId('team-home-name');
    await expect(nameInput).toBeVisible();

    const layout = await modal.evaluate((element) => {
      const input = element.querySelector('[data-testid="team-home-name"]');
      return {
        modalWidth: element.getBoundingClientRect().width,
        viewportWidth: document.documentElement.clientWidth,
        inputWidth: input?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(layout.modalWidth).toBeLessThanOrEqual(layout.viewportWidth - 8);
    expect(layout.inputWidth).toBeGreaterThan(250);
  });
});
