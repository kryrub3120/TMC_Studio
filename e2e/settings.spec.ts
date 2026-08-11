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

async function dragOnBoard(page: Page, startX = 0.35, startY = 0.35) {
  const canvas = page.getByTestId('board-viewport').locator('canvas').last();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * startX, box!.y + box!.height * startY);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * (startX + 0.15), box!.y + box!.height * (startY + 0.12), { steps: 8 });
  await page.mouse.up();
}

async function persistedElements(page: Page) {
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const document = JSON.parse(localStorage.getItem('tmc-studio-board') ?? '{}');
    return document.steps?.[0]?.elements ?? [];
  });
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

  test('club identity and staff presets survive reload', async ({ page }) => {
    await openSettings(page, /Drużyny|Teams|Equipos/i);
    await page.getByTestId('coaching-club-name').fill('TMC Academy Wrocław');
    await page.getByTestId('coaching-club-logo-input').setInputFiles({
      name: 'club.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });
    await expect(page.getByTestId('coaching-club-logo-preview')).toBeVisible();
    await page.getByTestId('coaching-staff-name').fill('Marek Nowak');
    await page.getByTestId('coaching-staff-role').fill('Asystent');
    await page.getByTestId('coaching-staff-add').click();
    await expect(page.getByText('Marek Nowak', { exact: true })).toBeVisible();
    await closeSettings(page);
    await page.waitForTimeout(2300);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await openSettings(page, /Drużyny|Teams|Equipos/i);
    await expect(page.getByTestId('coaching-club-name')).toHaveValue('TMC Academy Wrocław');
    await expect(page.getByTestId('coaching-club-logo-preview')).toBeVisible();
    await expect(page.getByText('Marek Nowak', { exact: true })).toBeVisible();
    await expect(page.getByText('Asystent', { exact: true })).toBeVisible();
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
    const gridToggle = page.getByRole('switch', { name: /Pokaż siatkę|Show grid|Mostrar cuadrícula/i });
    const snapToggle = page.getByRole('switch', { name: /Przyciągaj do siatki|Snap to grid|Ajustar a la cuadrícula/i });
    await gridToggle.click();
    await snapToggle.click();
    await expect(gridToggle).toBeChecked();
    await expect(snapToggle).not.toBeChecked();
    await closeSettings(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await openSettings(page, /Preferencje|Preferences|Preferencias/i);
    await expect(page.getByRole('radio', { name: /Jasny|Light|Claro/i })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('switch', { name: /Pokaż siatkę|Show grid|Mostrar cuadrícula/i })).toBeChecked();
    await expect(page.getByRole('switch', { name: /Przyciągaj do siatki|Snap to grid|Ajustar a la cuadrícula/i })).not.toBeChecked();
  });

  test('arrow and zone defaults affect newly created board elements', async ({ page }) => {
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '0');
    await openSettings(page, /Preferencje|Preferences|Preferencias/i);
    const runWidth = page.getByTestId('arrow-default-run-width');
    await runWidth.focus();
    await runWidth.press('Home');
    for (let index = 0; index < 8; index += 1) await runWidth.press('ArrowRight');
    await page.getByTestId('arrow-default-run-color-toggle').click();
    await page.getByTestId('arrow-default-run-color-palette').getByRole('button', { name: /#00ff00/i }).click();
    await page.getByRole('radio', { name: /Przerywana|Dashed|Discontinua/i }).click();
    await page.getByTestId('zone-default-fill-color-toggle').click();
    await page.getByTestId('zone-default-fill-color-palette').getByRole('button', { name: /#ff6b6b/i }).click();
    await expect(page.getByTestId('arrow-default-run-width')).toHaveValue('9');
    await expect(page.getByTestId('arrow-default-run-color-toggle')).toHaveAttribute('aria-label', /#00ff00/i);
    await expect(page.getByTestId('zone-default-fill-color-toggle')).toHaveAttribute('aria-label', /#ff6b6b/i);
    await closeSettings(page);

    // Remove the empty-board overlay before testing pointer drawing.
    await page.keyboard.press('p');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '1');
    await page.keyboard.press('r');
    await dragOnBoard(page);
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '2');
    await page.keyboard.press('z');
    await dragOnBoard(page, 0.55, 0.55);
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '3');

    const elements = await persistedElements(page);
    const arrow = elements.find((element: { type: string; arrowType?: string }) => element.type === 'arrow' && element.arrowType === 'run');
    const zone = elements.find((element: { type: string }) => element.type === 'zone');
    expect(arrow).toMatchObject({ strokeWidth: 9, color: '#00ff00' });
    expect(zone).toMatchObject({ borderStyle: 'dashed', fillColor: '#ff6b6b' });
  });

  test('saved lineup restores named players with Alt+1', async ({ page }) => {
    const viewport = page.getByTestId('board-viewport');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.press('p');
    await page.keyboard.press('p');
    await expect(viewport).toHaveAttribute('data-element-count', '2');

    await openSettings(page, /Skład|Squad|Plantilla/i);
    await page.getByRole('button', { name: /Zapisz D1|Save T1|Guardar E1/i }).first().click();
    await closeSettings(page);
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await expect(viewport).toHaveAttribute('data-element-count', '0');
    await page.keyboard.press('Alt+1');
    await expect(viewport).toHaveAttribute('data-element-count', '2');
  });

  test('plus and minus resize selected equipment on the board', async ({ page }) => {
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '0');
    await page.keyboard.press('m');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '1');
    await page.keyboard.press('Control+a');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-selected-count', '1');

    await page.keyboard.press('=');
    let elements = await persistedElements(page);
    let equipment = elements.find((element: { type: string }) => element.type === 'equipment');
    expect(equipment).toMatchObject({ type: 'equipment' });
    expect(equipment.scale).toBeCloseTo(1.1);

    await page.keyboard.press('Shift+-');
    elements = await persistedElements(page);
    equipment = elements.find((element: { type: string }) => element.type === 'equipment');
    expect(equipment.scale).toBeCloseTo(0.99);
  });

  test('custom keyboard shortcut executes and factory reset removes it', async ({ page }) => {
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await openSettings(page, /Skróty|Shortcuts|Atajos/i);
    await expect(page.getByText(/Increase selected elements|Powiększ zaznaczone elementy|Aumentar elementos seleccionados/i)).toBeVisible();
    const coneShortcut = page.getByRole('button', { name: /Edit shortcut: Cone|Edytuj skrót: Pachołek|Editar atajo: Cono/i });
    await coneShortcut.click();
    await coneShortcut.press('x');
    await expect(coneShortcut).toHaveText('X');
    await closeSettings(page);

    await page.keyboard.press('x');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '1');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    await openSettings(page, /Skróty|Shortcuts|Atajos/i);
    await page.getByRole('button', { name: /Reset to factory|Reset do fabrycznych|Restablecer fábrica/i }).click();
    await closeSettings(page);
    await page.keyboard.press('x');
    await expect(page.getByTestId('board-viewport')).toHaveAttribute('data-element-count', '0');
  });

  test('FAQ actions are translated and manual save executes', async ({ page }) => {
    await openSettings(page, /Pomoc|Help|Ayuda/i);
    const search = page.getByRole('textbox', { name: /Search help|Szukaj w pomocy|Buscar ayuda/i });
    await search.fill('subscription');
    await expect(page.getByRole('button', { name: /How do I manage my subscription/i })).toBeVisible();
    await search.fill('');
    await page.getByRole('button', { name: /How do I manage my subscription|Jak zarządzać subskrypcją|Cómo gestiono mi suscripción/i }).click();
    const billingCta = page.getByRole('button', { name: /Open billing|Otwórz płatności|Abrir facturación/i });
    await expect(billingCta).toBeVisible();
    await expect(page.getByText('faq.items.manageSubscription.cta')).toHaveCount(0);
    await billingCta.click();
    await expect(page.getByRole('heading', { name: /Current Plan|Aktualny plan|Plan actual/i })).toBeVisible();

    await page.getByRole('navigation').getByRole('button', { name: /Pomoc|Help|Ayuda/i, exact: true }).click();
    await page.getByRole('button', { name: /Troubleshooting|Rozwiązywanie problemów|Solución de problemas/i }).click();
    await page.getByRole('button', { name: /My project didn't save|Projekt się nie zapisał|Mi proyecto no se guardó/i }).click();
    await page.getByRole('button', { name: /Manual save|Zapisz ręcznie|Guardado manual/i }).click();
    await expect(page.getByText(/Project saved|Projekt zapisany|Proyecto guardado/i)).toBeVisible();
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
