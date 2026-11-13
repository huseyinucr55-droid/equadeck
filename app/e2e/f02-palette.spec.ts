import { test, expect, openApp, setCode, code } from './helpers';

const key = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('tabpanel').getByRole('button', { name, exact: true });

test.describe('F02 build an equation with the palette', () => {
  test('F02-H1 a key wraps the selection', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'a+b');
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+ArrowRight');
    await key(page, 'superscript').click();
    expect(await code(page)).toBe('^{a}+b');
  });

  test('F02-E1 no selection: cursor lands in the first slot', async ({ page }) => {
    await openApp(page);
    await setCode(page, '');
    await key(page, 'fraction').click();
    await page.keyboard.type('1');
    // Readable commands are on by default (rendered as \frac).
    expect(await code(page)).toBe('\\Fraction{1}{}');
  });

  test('F02-E2 search filters across groups and clears back to the tab', async ({ page }) => {
    await openApp(page);
    const search = page.getByRole('searchbox', { name: 'Search symbols' });
    await search.fill('arrow');
    await expect(key(page, 'right arrow')).toBeVisible();
    await expect(key(page, 'alpha')).toHaveCount(0);
    await search.fill('');
    await expect(key(page, 'superscript')).toBeVisible();
  });

  test('F02-E3 search with no match says so', async ({ page }) => {
    await openApp(page);
    await page.getByRole('searchbox', { name: 'Search symbols' }).fill('zzzz');
    await expect(page.getByText('No symbols match')).toBeVisible();
  });

  test('F02-E4 keyboard: arrows move between keys, Enter inserts', async ({ page }) => {
    await openApp(page);
    await setCode(page, '');
    await key(page, 'superscript').focus();
    await page.keyboard.press('ArrowRight');
    await expect(key(page, 'subscript')).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await code(page)).toBe('_{}');
  });

  test('F02-E5 tabs switch with arrow keys', async ({ page }) => {
    await openApp(page);
    await page.getByRole('tab', { name: 'Basics' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Relations' })).toHaveAttribute('aria-selected', 'true');
    await expect(key(page, 'not equal')).toBeVisible();
  });
});
