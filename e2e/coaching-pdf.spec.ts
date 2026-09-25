/**
 * E2E: exercise PDF with Polish text that does not fit on one page
 * (launch stage E2, P0). The PDF is a rendering of the page, so Polish
 * letters come from the browser fonts; this checks the long text is split
 * across pages instead of being cut off.
 */

import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openBoard, useCloudUser } from './cloud-board';

const POLISH = 'Zażółć gęślą jaźń — ćwiczenie łączące pressing, przejście i wykończenie. ';
const POLISH_LENGTH = POLISH.length;

test('a long exercise with Polish text exports to a multi-page PDF', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await useCloudUser(page, 'dev-e2e-coaching-pdf');
  await page.addInitScript(() => {
    localStorage.setItem('tmc-exercise-guide-seen', '1');
    localStorage.setItem('tmc-session-guide-seen', '1');
  });
  await openBoard(page);

  await page.getByRole('button', { name: 'Otwórz projekty' }).click();
  await expect(page.locator('[data-tour="projects-panel"]')).toBeVisible();
  await page.getByTestId('library-type-exercise').click();
  await page.getByTestId('create-exercise-project').click();
  await expect(page.getByTestId('exercise-workspace')).toBeVisible();

  const name = page.getByLabel('Nazwa ćwiczenia').first();
  await name.fill('Łódź — gra pozycyjna');
  await name.press('Enter');
  await page.getByLabel('Treść ćwiczenia').fill(POLISH.repeat(60));
  await page.getByLabel('Organizacja').fill(POLISH.repeat(25));
  await page.getByLabel('Kluczowe wskazówki').fill(POLISH.repeat(25));

  // Capture the clone that is rendered into the PDF: html2canvas draws a
  // textarea as one unwrapped line, so the clone must hold wrapped text blocks.
  await page.evaluate(() => {
    const seen: { textareas: number; longestText: number; placeholders: number }[] = [];
    (window as unknown as { __pdfClones: typeof seen }).__pdfClones = seen;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement) || node.getAttribute('aria-hidden') !== 'true' || !node.dataset.pdfKind) return;
          seen.push({
            textareas: node.querySelectorAll('textarea').length,
            longestText: Math.max(0, ...Array.from(node.querySelectorAll('[data-pdf-text]')).map((el) => el.textContent?.length ?? 0)),
            placeholders: node.querySelectorAll('[placeholder]').length,
          });
        });
      }
    }).observe(document.body, { childList: true });
  });

  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  await page.getByRole('button', { name: 'Pobierz PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const path = testInfo.outputPath('long-exercise.pdf');
  await download.saveAs(path);

  const pdf = (await readFile(path)).toString('latin1');
  const pages = pdf.match(/\/Type\s*\/Page(?!s)/g) ?? [];
  expect(pages.length).toBeGreaterThanOrEqual(2);

  const clones = await page.evaluate(() => (window as unknown as { __pdfClones: unknown[] }).__pdfClones);
  expect(clones).toEqual([
    { textareas: 0, longestText: POLISH_LENGTH * 60, placeholders: 0 },
  ]);
});
