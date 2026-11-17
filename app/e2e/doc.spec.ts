// Document view (/doc): a Word-style page with ribbon and status bar.
import type { Page } from '@playwright/test';
import { test, expect, axe } from './helpers';

const sheet = (page: Page) => page.locator('.doc-sheet');
const body = (page: Page) => page.getByRole('textbox', { name: 'Document text' });
const tab = (page: Page, name: string) => page.getByRole('tab', { name });

async function openDoc(page: Page) {
  await page.goto('/doc');
  await expect(body(page)).toBeVisible({ timeout: 20_000 });
}

async function typeLine(page: Page, text: string) {
  await body(page).click();
  await page.keyboard.insertText(text);
}

test.describe('Document view', () => {
  test('DOC-1 opens a white A4 page with ribbon and status bar', async ({ page }) => {
    await openDoc(page);
    await expect(sheet(page)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    const w = await sheet(page).evaluate((s) => s.getBoundingClientRect().width / Number(getComputedStyle(s).zoom || 1));
    expect(Math.round(w)).toBe(794); // 210 mm
    await expect(page.getByRole('tablist', { name: 'Ribbon' })).toBeVisible();
    await expect(page.getByText('Page 1 of 1')).toBeVisible();
    await axe(page);
  });

  test('DOC-2 bold from the ribbon, italic with Ctrl+I, colour, highlight, list', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Hallo Welt');
    await page.keyboard.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold (Ctrl+B)' }).click();
    await expect(body(page).locator('strong')).toHaveText('Hallo Welt');
    await expect(page.getByRole('button', { name: 'Bold (Ctrl+B)' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ControlOrMeta+i');
    await expect(body(page).locator('em')).toHaveText('Hallo Welt');
    await page.getByRole('button', { name: 'Text colour #c92a2a' }).click();
    await expect(body(page).locator('[style*="color"]').first()).toHaveAttribute('style', /201, 42, 42|#c92a2a/);
    await page.getByRole('button', { name: 'Highlight #fff3bf' }).click();
    await expect(body(page).locator('mark')).toHaveCount(1);
    await page.getByRole('button', { name: 'Bullet list' }).click();
    await expect(body(page).locator('ul li')).toHaveCount(1);
  });

  test('DOC-3 paper: squared, lined and blank', async ({ page }) => {
    await openDoc(page);
    await tab(page, 'Layout').click();
    const bg = () => body(page).evaluate((c) => getComputedStyle(c).backgroundImage);
    await page.getByRole('button', { name: 'Squared' }).click();
    expect(await bg()).toContain('linear-gradient');
    await page.getByRole('button', { name: 'Lined' }).click();
    expect(await bg()).toContain('linear-gradient');
    await page.getByRole('button', { name: 'Blank' }).click();
    expect(await bg()).toBe('none');
  });

  test('DOC-4 zoom with the slider and the buttons', async ({ page }) => {
    await openDoc(page);
    const zoom = () => sheet(page).evaluate((s) => Number(getComputedStyle(s).zoom));
    const start = await zoom();
    await page.getByRole('contentinfo').getByRole('button', { name: 'Zoom in' }).click();
    expect(await zoom()).toBeCloseTo(start + 0.1, 2);
    await page.getByRole('slider', { name: 'Zoom' }).fill('150');
    expect(await zoom()).toBeCloseTo(1.5, 2);
    await expect(page.getByLabel('Zoom level')).toHaveText('150%');
  });

  test('DOC-5 autosave keeps text, title and paper after a reload', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Bleibt erhalten');
    await page.getByLabel('Document title').fill('Mathe Heft');
    await tab(page, 'Layout').click();
    await page.getByRole('button', { name: 'Lined' }).click();
    await expect(page.getByText('Saved in this browser')).toBeVisible();
    await page.waitForTimeout(700);
    await page.reload();
    await expect(body(page)).toContainText('Bleibt erhalten');
    await expect(page.getByLabel('Document title')).toHaveValue('Mathe Heft');
    await expect(sheet(page)).toHaveAttribute('data-paper', 'lined');
  });

  test('DOC-6 new, open and delete documents', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Erstes Dokument');
    await page.getByLabel('Document title').fill('Eins');
    await tab(page, 'File').click();
    await page.getByRole('button', { name: 'New' }).click();
    await expect(body(page)).not.toContainText('Erstes Dokument');
    await page.getByLabel('Document title').fill('Zwei');
    await page.getByRole('button', { name: 'Open' }).click();
    const list = page.getByRole('region', { name: 'Your documents' });
    await expect(list.getByRole('button', { name: /^Eins/ })).toBeVisible();
    await list.getByRole('button', { name: /^Eins/ }).click();
    await expect(body(page)).toContainText('Erstes Dokument');
    await page.getByRole('button', { name: 'Open' }).click();
    page.once('dialog', (d) => d.accept());
    await list.getByRole('button', { name: 'Delete Zwei' }).click();
    await expect(list.getByRole('button', { name: /^Zwei/ })).toHaveCount(0);
  });

  test('DOC-7 German labels and links between the two views', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Document' }).click();
    await expect(body(page)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Language: English/ }).click();
    await expect(tab(page, 'Einfügen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fett (Strg+B)' })).toBeVisible();
    await expect(page.getByText('Seite 1 von 1')).toBeVisible();
    await axe(page);
    await page.getByRole('link', { name: 'Einzelne Formel' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  // Phase 2: formulas typed straight onto the page.
  const fields = (page: Page) =>
    page.evaluate(() => [...document.querySelectorAll('.doc-math math-field')].map((m) => (m as HTMLElement & { value: string }).value));

  test('DOC-8 Alt+= starts a formula in the text; it is kept after a reload', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Es gilt ');
    await page.keyboard.press('Alt+Equal');
    await expect(page.locator('.doc-math-inline math-field')).toBeFocused();
    // After "a^2" the cursor drops back from the exponent by itself.
    await page.keyboard.type('a^2+b^2');
    await page.keyboard.press('Escape');
    await page.keyboard.insertText(' fertig');
    await expect(body(page)).toContainText('fertig');
    expect(await fields(page)).toEqual(['a^2+b^2']);
    await axe(page);
    await page.waitForTimeout(700);
    await page.reload();
    await expect(page.locator('.doc-math-inline math-field')).toHaveCount(1);
    expect(await fields(page)).toEqual(['a^2+b^2']);
  });

  test('DOC-9 Insert tab: fraction with boxes, symbols, a formula on its own line', async ({ page }) => {
    await openDoc(page);
    await body(page).click();
    await tab(page, 'Insert').click();
    await page.getByRole('group', { name: 'Structures' }).getByRole('button', { name: 'Fraction' }).click();
    await expect(page.locator('.doc-math-inline math-field')).toBeFocused();
    await page.keyboard.type('1');
    await page.keyboard.press('Tab');
    await page.keyboard.type('2');
    expect(await fields(page)).toEqual(['\\frac12']);
    // A symbol goes into the formula you are typing in.
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'element of', exact: true }).click();
    expect(await fields(page)).toEqual(['\\frac12\\in']);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'On its own line' }).click();
    await expect(page.locator('.doc-math-block math-field')).toBeFocused();
    await page.keyboard.type('x');
    await expect(page.locator('.doc-math-block')).toHaveCount(1);
  });

  test('DOC-10 German words inside a formula become symbols', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'x');
    const formula = async (keys: string) => {
      await page.keyboard.press('Alt+Equal');
      await expect(page.locator('.doc-math math-field').last()).toBeFocused();
      await page.keyboard.type(keys);
      await page.keyboard.press('Escape');
      await page.keyboard.insertText(' ');
    };
    await formula('summe');
    await formula('xelementvonA');
    await formula('unendlich');
    expect(await fields(page)).toEqual(['\\sum', 'x\\in A', '\\infty']);
  });
});
