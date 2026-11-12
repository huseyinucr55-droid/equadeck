import { readFileSync } from 'node:fs';
import { test, expect, openApp, setCode, code, waitRendered, editor, axe } from './helpers';

test('F10-H1 PDF export is a real PDF', async ({ page }) => {
  await openApp(page);
  await waitRendered(page);
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /^PDF$/ }).click();
  const file = await dl;
  expect(file.suggestedFilename()).toBe('equation.pdf');
  expect(readFileSync((await file.path())!).subarray(0, 5).toString()).toBe('%PDF-');
});

test('X-1 Copy LaTeX puts the code on the clipboard', async ({ page }) => {
  await openApp(page);
  await setCode(page, '\\sqrt{2}');
  await page.getByRole('button', { name: 'Copy LaTeX' }).click();
  await expect(page.getByText('LaTeX copied.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('\\sqrt{2}');
});

test('X-2 autocomplete inserts a command with its slots', async ({ page }) => {
  await openApp(page);
  await setCode(page, '');
  await editor(page).click();
  await page.keyboard.type('\\fra');
  await expect(page.getByRole('option', { name: /\\frac/ }).first()).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.type('1');
  expect(await code(page)).toBe('\\frac{1}{}');
});

test('X-3 privacy page', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Back to the editor/ })).toBeVisible();
  await axe(page);
});

test('X-4 raster preview shows the exported image', async ({ page }) => {
  await openApp(page);
  await waitRendered(page);
  await page.getByText('Preview as image').click();
  await expect(page.getByRole('switch', { name: 'Preview as image' })).toBeChecked();
  await expect(page.locator('section[aria-label="Preview"] img')).toBeVisible();
  await page.getByText('Preview as image').click();
  await expect(page.locator('section[aria-label="Preview"] img')).toHaveCount(0);
});

// BUG-007: on a slow connection the PDF libraries arrive after the click's
// user activation has expired and Chrome cancels the automatic download.
test('F10-E1 slow PDF chunk: offers a Save button instead of losing the file', async ({ page }) => {
  await page.route(/jspdf|svg2pdf/, async (route) => {
    await new Promise((r) => setTimeout(r, 4500));
    await route.continue();
  });
  await openApp(page);
  await waitRendered(page);
  await page.getByRole('button', { name: /^PDF$/ }).click();
  const save = page.getByRole('button', { name: 'Save PDF' });
  await expect(save).toBeVisible({ timeout: 20_000 });
  const dl = page.waitForEvent('download');
  await save.click();
  const file = await dl;
  const failure = await file.failure();
  expect(failure, `download failed: ${failure} (${file.url()})`).toBeNull();
  expect(readFileSync((await file.path())!).subarray(0, 5).toString()).toBe('%PDF-');
});
