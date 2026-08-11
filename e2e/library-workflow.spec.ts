import { expect, test } from '@playwright/test';

test.describe('Coaching library workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
      localStorage.setItem('tmc-language', 'pl');
      localStorage.setItem('tmc-studio-dev-cloud-user', 'dev-library-workflow');
      localStorage.setItem('tmc-auth', JSON.stringify({
        state: {
          isInitialized: true,
          isMockUser: true,
          isAuthenticated: true,
          isPro: true,
          isTeam: false,
          user: { id: 'dev-library-workflow', email: 'library@tmcstudio.test', full_name: 'Library Coach', subscription_tier: 'pro' },
        },
        version: 0,
      }));
      localStorage.setItem('tmc-ui-settings', JSON.stringify({ state: { tutorialCompleted: true, clubWelcomeSeen: true }, version: 0 }));
    });
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
  });

  test('creates exercises from graphics and assembles a persistent session plan', async ({ page }) => {
    const openProjects = async () => {
      await page.locator('[data-tour="projects"] button').first().click();
      await expect(page.locator('[data-tour="projects-panel"]')).toBeVisible();
    };

    await openProjects();

    await page.getByTestId('library-tutorial-open').click();
    const tutorial = page.getByTestId('library-tutorial');
    await expect(tutorial).toContainText('Narysuj grafikę');
    await tutorial.getByRole('button', { name: 'Dalej' }).click();
    await expect(tutorial).toContainText('Zbuduj ćwiczenie');
    await tutorial.getByRole('button', { name: 'Dalej' }).click();
    await expect(tutorial).toContainText('Ułóż konspekt');
    await tutorial.getByRole('button', { name: 'Gotowe' }).click();

    await page.getByTestId('create-graphic-project').click();
    await page.keyboard.press('b');
    await page.waitForTimeout(2300);

    await openProjects();
    await page.getByTestId('create-exercise-from-graphic').click();
    const copiedElementTypes = await page.evaluate(() => {
      const document = JSON.parse(localStorage.getItem('tmc-studio-board') ?? '{}');
      return document.steps?.[0]?.elements?.map((element: { type: string }) => element.type) ?? [];
    });
    expect(copiedElementTypes).toContain('ball');
    await openProjects();

    await expect(page.getByTestId('exercise-editor')).toBeVisible();
    await expect(page.getByTestId('exercise-editor')).toContainText('Używana grafika: Untitled Board');
    await page.getByTestId('project-description').fill('Gra pozycyjna 4v4 z zawodnikami neutralnymi');
    await page.getByTestId('exercise-duration').fill('20');
    await page.getByTestId('exercise-players').fill('8 + 2 neutralnych');
    await page.getByTestId('exercise-organization').fill('Pole 30x25 m, dwa zespoły po czterech.');
    await page.getByTestId('exercise-coaching-points').fill('Skanowanie przed przyjęciem i szybka zmiana strony.');

    await page.getByTestId('create-exercise-project').click();
    await openProjects();
    await page.getByTestId('exercise-graphic-select').selectOption({ label: 'Untitled Board' });
    await page.getByTestId('attach-graphic').click();
    await expect(page.getByTestId('exercise-editor')).toContainText('Używana grafika: Untitled Board');
    await page.getByTestId('exercise-duration').fill('10');

    await page.getByTestId('create-session-project').click();
    await openProjects();
    await expect(page.getByTestId('session-editor')).toBeVisible();

    const exerciseSelect = page.getByTestId('session-exercise-select');
    await exerciseSelect.selectOption({ label: 'Ćwiczenie — Untitled Board' });
    await page.getByTestId('add-exercise-to-session').click();
    await exerciseSelect.selectOption({ label: 'Nowe ćwiczenie' });
    await page.getByTestId('add-exercise-to-session').click();

    await expect(page.getByTestId('session-exercise-item')).toHaveCount(2);
    await expect(page.getByTestId('session-editor')).toContainText('Łącznie: 30 min');
    await page.getByTestId('session-exercise-item').first().getByTitle('Przenieś niżej').click();
    await expect(page.getByTestId('session-exercise-item').first()).toContainText('Nowe ćwiczenie');
    await page.getByPlaceholder('Notatka do tego ćwiczenia').first().fill('Rozgrzewka z piłką.');
    await page.waitForTimeout(2300);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await openProjects();
    await page.getByText('Nowy konspekt', { exact: true }).last().click();
    await openProjects();
    await expect(page.getByTestId('session-exercise-item')).toHaveCount(2);
    await expect(page.getByTestId('session-editor')).toContainText('Łącznie: 30 min');
    await expect(page.getByTestId('session-exercise-item').first()).toContainText('Nowe ćwiczenie');
    await expect(page.getByPlaceholder('Notatka do tego ćwiczenia').first()).toHaveValue('Rozgrzewka z piłką.');

    await page.setViewportSize({ width: 390, height: 844 });
    const drawerDimensions = await page.locator('[data-tour="projects-panel"]').evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(drawerDimensions.scrollWidth).toBeLessThanOrEqual(drawerDimensions.clientWidth);
    await expect(page.getByTestId('session-editor')).toBeVisible();
  });
});
