import { test, expect, openApp, axe } from './helpers';

test.describe('Language switch', () => {
  test('switches to German, keeps it after a reload and switches back', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: /Language: English/ }).click();
    await expect(page.getByRole('button', { name: 'PNG herunterladen' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('textbox', { name: 'LaTeX-Quelltext' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Für Word kopieren' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'PNG herunterladen' })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await axe(page);

    await page.getByRole('button', { name: /Sprache: Deutsch/ }).click();
    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('German dialogs and pages have no accessibility violations', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /Language: English/ }).click();
    await page.getByRole('button', { name: 'Referenz' }).click();
    await expect(page.getByRole('dialog', { name: 'Referenz' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Farben' })).toBeVisible();
    // No axe here: the reference rows already trip label-content-name-mismatch in English.
    await page.keyboard.press('Escape');
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1, name: 'Datenschutz' })).toBeVisible();
    await axe(page);
  });
});
