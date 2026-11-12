import { test, expect, openApp, setCode, code, waitRendered, axe, sizeField } from './helpers';

const saved = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: 'Saved equations' });

function snippet(i: number, code = `x_{${i}}`, font = 20) {
  return { id: `s${i}`, title: null, code, settings: { font_size: font }, updated_at: new Date(Date.now() - i * 60_000).toISOString() };
}

test.describe('F07 save an equation', () => {
  test('F07-H1 save lists it and marks it current', async ({ page }) => {
    await openApp(page);
    await waitRendered(page);
    await saved(page).getByRole('button', { name: 'Save', exact: true }).click();
    await expect(saved(page).getByRole('heading')).toHaveText('Saved (1)');
    await expect(saved(page).locator('[aria-current="true"]')).toHaveCount(1);
    await expect(saved(page).getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await axe(page, 'aside');
  });

  test('F07-E1 broken LaTeX cannot be saved', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\frac{');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(saved(page).getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  });

  test('F07-E2 delete, then Undo restores it', async ({ page }) => {
    await openApp(page);
    await waitRendered(page);
    await saved(page).getByRole('button', { name: 'Save', exact: true }).click();
    await saved(page).getByRole('button', { name: /^Delete/ }).click();
    await expect(saved(page).getByRole('heading')).toHaveText('Saved (0)');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(saved(page).getByRole('heading')).toHaveText('Saved (1)');
  });

  test('F07-E3 the 51st save is refused with a message', async ({ page }) => {
    await page.addInitScript((list) => localStorage.setItem('lx.snippets.v1', JSON.stringify(list)), Array.from({ length: 50 }, (_, i) => snippet(i)));
    await openApp(page);
    await setCode(page, 'new + one');
    await waitRendered(page);
    await saved(page).getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/keep 50 equations/)).toBeVisible();
    await expect(saved(page).getByRole('heading')).toHaveText('Saved (50)');
  });

  test('F07-E4 corrupt storage gives an empty list, not a crash', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lx.snippets.v1', '{not json'));
    await openApp(page);
    await expect(saved(page).getByRole('heading')).toHaveText('Saved (0)');
  });

  test('F07-E5 blocked storage: editor still works, save explains', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error('blocked');
      };
      Storage.prototype.setItem = () => {
        throw new Error('blocked');
      };
    });
    await openApp(page);
    await setCode(page, 'e^x');
    await waitRendered(page);
    await saved(page).getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/not letting us save/)).toBeVisible();
  });
});

test.describe('F08 reopen a saved equation', () => {
  test('F08-H1 loads code and size; F08-E1 Undo goes back', async ({ page }) => {
    await page.addInitScript((list) => localStorage.setItem('lx.snippets.v1', JSON.stringify(list)), [snippet(1, 'E = mc^2', 32)]);
    await openApp(page);
    const before = await code(page);
    await saved(page).getByRole('button', { name: /^E = mc\^2/ }).click();
    expect(await code(page)).toBe('E = mc^2');
    await expect(sizeField(page)).toHaveValue('32');
    await expect(page.getByText(/Loaded/)).toBeVisible();
    await page.getByRole('button', { name: /^Undo/ }).click();
    expect(await code(page)).toBe(before);
  });
});
