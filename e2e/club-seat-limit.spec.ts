/**
 * E2E: Team seat limit (launch stage E2, P0).
 *
 * A Team club has 5 seats: members + pending invitations. At the limit the
 * invite form is replaced by a message, and an invitation that still reaches
 * the server (stale tab) is rejected with the same message. The club runs on
 * the devCloud mock, which enforces the limit like the Netlify function.
 */

import { test, expect, type Page } from '@playwright/test';
import { openBoard, useCloudUser } from './cloud-board';

const SEAT_LIMIT_MESSAGE = /Osiągnięto limit miejsc w planie Team/;

async function openClubSettings(page: Page) {
  await page.locator('button[title="Ustawienia"]').click();
  const dialog = page.locator('[data-tour="settings-modal"]');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('navigation').getByRole('button', { name: 'Klub', exact: true }).click();
  return dialog;
}

async function invite(dialog: ReturnType<Page['locator']>, email: string) {
  await dialog.getByPlaceholder('trener@przyklad.pl').fill(email);
  await dialog.getByRole('button', { name: 'Wyślij zaproszenie' }).click();
}

test.describe('Club seat limit', () => {
  test('blocks invitations at 5 seats and frees a seat on revoke', async ({ page }) => {
    await useCloudUser(page, 'dev-e2e-club-owner', 'team');
    await openBoard(page);

    const dialog = await openClubSettings(page);
    await dialog.getByPlaceholder(/Akademia Młodzieżowa/).fill('E2E Club');
    await dialog.getByRole('button', { name: 'Utwórz klub' }).click();
    await expect(dialog.getByText('Wykorzystane miejsca: 1 / 5')).toBeVisible();

    for (let i = 1; i <= 4; i += 1) {
      await invite(dialog, `coach${i}@test.local`);
      await expect(dialog.getByText(`Wykorzystane miejsca: ${i + 1} / 5`)).toBeVisible();
    }

    await expect(dialog.getByText(SEAT_LIMIT_MESSAGE)).toBeVisible();
    await expect(dialog.getByPlaceholder('trener@przyklad.pl')).toBeHidden();

    await dialog.getByRole('button', { name: 'Anuluj' }).first().click();
    await expect(dialog.getByText('Wykorzystane miejsca: 4 / 5')).toBeVisible();
    await expect(dialog.getByPlaceholder('trener@przyklad.pl')).toBeVisible();
  });

  test('rejects an invitation from a stale tab once the club is full', async ({ page, context }) => {
    await useCloudUser(page, 'dev-e2e-club-race', 'team');
    await openBoard(page);

    const dialog = await openClubSettings(page);
    await dialog.getByPlaceholder(/Akademia Młodzieżowa/).fill('Race Club');
    await dialog.getByRole('button', { name: 'Utwórz klub' }).click();
    for (let i = 1; i <= 3; i += 1) await invite(dialog, `coach${i}@test.local`);
    await expect(dialog.getByText('Wykorzystane miejsca: 4 / 5')).toBeVisible();

    // A second tab (same browser storage, no fresh sign-in) takes the last seat
    // while the first still shows the invite form.
    const other = await context.newPage();
    await openBoard(other);
    const otherDialog = await openClubSettings(other);
    await invite(otherDialog, 'last-seat@test.local');
    await expect(otherDialog.getByText('Wykorzystane miejsca: 5 / 5')).toBeVisible();

    await invite(dialog, 'one-too-many@test.local');
    await expect(dialog.getByText(SEAT_LIMIT_MESSAGE)).toBeVisible();

    const invitations = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('tmc-studio-dev-cloud-invitations-dev-e2e-club-race') ?? '[]'),
    );
    expect(invitations.map((inv: { email: string }) => inv.email)).not.toContain('one-too-many@test.local');
  });
});
