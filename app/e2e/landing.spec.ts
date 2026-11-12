import { test, expect, axe } from './helpers';

test.describe('Landing page (/about)', () => {
  test('L-H1 hero, sections and a working call to action', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: 'Equations for your slides and documents' })).toBeVisible();
    for (const h of ['How it works', 'What you get', 'Pricing', 'Questions']) {
      await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible();
    }
    await expect(page.getByRole('img', { name: /Equadeck editor/ })).toBeVisible();
    await axe(page);
    await page.getByRole('link', { name: 'Open the editor' }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('textbox', { name: 'LaTeX source' })).toBeVisible();
  });

  test('L-N1 no invented proof and nothing for sale that does not exist', async ({ page }) => {
    await page.goto('/about');
    const text = (await page.locator('body').innerText()).toLowerCase();
    for (const banned of ['trusted by', 'testimonial', '★', 'users love', 'rated ']) expect(text).not.toContain(banned);
    await expect(page.getByText('Not available yet')).toBeVisible();
    await expect(page.getByRole('button', { name: /buy|subscribe|upgrade/i })).toHaveCount(0);
  });

  test('L-E1 the editor links to the about page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
  });
});
