import { test, expect, axe } from './helpers';

test.describe('Legal pages', () => {
  test('P-H1 privacy names every processor and what is stored', async ({ page }) => {
    await page.goto('/privacy');
    const main = page.getByRole('main');
    await expect(main).toContainText('GitHub Pages'); // the host, which logs visitor IPs
    await expect(main).toContainText('saved equations'); // stored in the browser too
    await axe(page);
  });

  test('T-H1 terms page exists, is linked from the editor, and passes axe', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Terms of use' })).toBeVisible();
    await axe(page);
    await page.getByRole('link', { name: /Back to the editor/ }).click();
    await expect(page.getByRole('textbox', { name: 'LaTeX source' })).toBeVisible();
  });
});
