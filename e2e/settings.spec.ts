import { expect, test, type Page } from '@playwright/test';

async function openSettings(page: Page, tab: RegExp) {
  await page.locator('button[title="Ustawienia"], button[title="Settings"], button[title="Ajustes"]').click();
  const dialog = page.locator('[data-tour="settings-modal"]');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('navigation').getByRole('button', { name: tab, exact: true }).click();
}

async function closeSettings(page: Page) {
  await page.getByRole('button', { name: /Zamknij ustawienia|Close settings|Cerrar ajustes/i }).click();
}

test.describe('Settings persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tmc-cookie-consent', JSON.stringify({ analytics: false, ts: 'e2e' }));
      if (!localStorage.getItem('tmc-auth')) {
        localStorage.setItem('tmc-studio-dev-cloud-user', 'dev-pro-user');
        localStorage.setItem('tmc-auth', JSON.stringify({
          state: {
            isInitialized: true,
            isMockUser: true,
            isAuthenticated: true,
            isPro: true,
            isTeam: false,
            user: {
              id: 'dev-pro-user',
              email: 'dev-pro@tmcstudio.test',
              full_name: 'Settings Test',
              subscription_tier: 'pro',
            },
          },
          version: 0,
        }));
      }
      if (!localStorage.getItem('tmc-ui-settings')) {
        localStorage.setItem('tmc-ui-settings', JSON.stringify({
          state: { tutorialCompleted: true, clubWelcomeSeen: true },
          version: 0,
        }));
      }
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('team name and palette color survive reload', async ({ page }) => {
    await openSettings(page, /Drużyny|Teams|Equipos/i);
    const name = page.getByTestId('team-home-name');
    await name.fill('TMC Academy');
    await page.getByTestId('team-home-primary-toggle').click();
    const palette = page.getByTestId('team-home-primary-palette');
    await expect(palette).toBeVisible();
    await palette.getByRole('button', { name: /#00ff00/i }).click();
    await closeSettings(page);
    await page.waitForTimeout(2300);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await openSettings(page, /Drużyny|Teams|Equipos/i);
    await expect(page.getByTestId('team-home-name')).toHaveValue('TMC Academy');
    await expect(page.getByTestId('team-home-primary-toggle')).toHaveAttribute('aria-label', /#00ff00/i);
  });

  test('single and bulk squad edits survive reload', async ({ page }) => {
    await openSettings(page, /Skład|Squad|Plantilla/i);
    await page.getByTestId('squad-name-input').fill('Jan Kowalski');
    await page.getByTestId('squad-number-input').fill('1');
    await page.getByTestId('squad-add-player').click();
    await page.getByRole('button', { name: /Dodaj wielu|Add many|Añadir varios/i }).click();
    await page.getByTestId('squad-bulk-input').fill('7 Piotr Nowak\nAdam Zielinski');
    await page.getByTestId('squad-bulk-add').click();
    await expect(page.getByLabel(/Zmień nazwę zawodnika Jan Kowalski|Edit Jan Kowalski name/i)).toBeVisible();
    await expect(page.getByLabel(/Zmień nazwę zawodnika Piotr Nowak|Edit Piotr Nowak name/i)).toBeVisible();
    await closeSettings(page);
    await page.waitForTimeout(2300);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await openSettings(page, /Skład|Squad|Plantilla/i);
    await expect(page.getByLabel(/Zmień nazwę zawodnika Jan Kowalski|Edit Jan Kowalski name/i)).toHaveValue('Jan Kowalski');
    await expect(page.getByLabel(/Zmień nazwę zawodnika Piotr Nowak|Edit Piotr Nowak name/i)).toHaveValue('Piotr Nowak');
    await expect(page.getByLabel(/Zmień nazwę zawodnika Adam Zielinski|Edit Adam Zielinski name/i)).toHaveValue('Adam Zielinski');
  });

  test('editor preferences survive reload', async ({ page }) => {
    await openSettings(page, /Preferencje|Preferences|Preferencias/i);
    await page.getByRole('radio', { name: /Jasny|Light|Claro/i }).click();
    await page.getByRole('switch', { name: /Pokaż siatkę|Show grid|Mostrar cuadrícula/i }).click();
    await closeSettings(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await openSettings(page, /Preferencje|Preferences|Preferencias/i);
    await expect(page.getByRole('radio', { name: /Jasny|Light|Claro/i })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('switch', { name: /Pokaż siatkę|Show grid|Mostrar cuadrícula/i })).toBeChecked();
  });

  test('pitch appearance survives reload', async ({ page }) => {
    await openSettings(page, /Boisko|Pitch|Campo/i);
    await page.locator('[data-pitch-theme="indoor"]').click();
    await page.getByRole('switch', { name: /Bez linii|Without lines|Sin líneas/i }).click();
    await closeSettings(page);
    await page.waitForTimeout(2300);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await openSettings(page, /Boisko|Pitch|Campo/i);
    await expect(page.locator('[data-pitch-theme="indoor"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('switch', { name: /Bez linii|Without lines|Sin líneas/i })).toBeChecked();
  });

  test('Free users can manage five players and recover a slot', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('tmc-studio-board');
      localStorage.setItem('tmc-studio-dev-cloud-user', 'dev-free-user');
      localStorage.setItem('tmc-auth', JSON.stringify({
        state: {
          isInitialized: true,
          isMockUser: true,
          isAuthenticated: true,
          isPro: false,
          isTeam: false,
          user: {
            id: 'dev-free-user',
            email: 'dev-free@tmcstudio.test',
            full_name: 'Free Settings Test',
            subscription_tier: 'free',
          },
        },
        version: 0,
      }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await openSettings(page, /Skład|Squad|Plantilla/i);

    for (let number = 1; number <= 5; number += 1) {
      await page.getByTestId('squad-name-input').fill(`Free Player ${number}`);
      await page.getByTestId('squad-number-input').fill(String(number));
      await page.getByTestId('squad-add-player').click();
    }
    await expect(page.getByTestId('squad-name-input')).toBeHidden();
    await expect(page.getByLabel(/Edit Free Player 1 name|Zmień nazwę zawodnika Free Player 1/i)).toBeVisible();
    await page.getByRole('button', { name: /Remove Free Player 1|Usuń Free Player 1/i }).click({ force: true });
    await expect(page.getByTestId('squad-name-input')).toBeVisible();
  });
});
