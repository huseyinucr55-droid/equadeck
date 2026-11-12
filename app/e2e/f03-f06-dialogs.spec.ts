import { test, expect, openApp, setCode, code, axe, waitRendered } from './helpers';

test.describe('F03 insert a matrix', () => {
  test('F03-H1 parentheses 3×3, cursor in the first cell', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'A = ');
    await page.getByRole('button', { name: 'Matrix' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insert matrix' });
    await expect(dialog).toBeVisible();
    await axe(page, 'dialog[open]');
    await dialog.getByRole('radio', { name: 'Parentheses' }).check();
    await dialog.getByRole('button', { name: 'Insert' }).click();
    await expect(dialog).toBeHidden();
    await page.keyboard.type('1');
    expect(await code(page)).toContain('A = \\begin{pmatrix}\n 1&');
    expect((await code(page)).match(/\\\\/g)?.length).toBe(2); // 3 rows
  });

  test('F03-E1 rows out of range disable Insert', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Matrix' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insert matrix' });
    for (const v of ['0', '13']) {
      await dialog.getByLabel('Rows').fill(v);
      await expect(dialog.getByRole('button', { name: 'Insert' })).toBeDisabled();
      await expect(dialog.getByText('1 to 12')).toBeVisible();
    }
  });

  test('F03-E2 Esc cancels and returns focus', async ({ page }) => {
    await openApp(page);
    const before = await code(page);
    await page.getByRole('button', { name: 'Matrix' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Matrix' })).toBeFocused();
    expect(await code(page)).toBe(before);
  });
});

test.describe('F04 start from an example', () => {
  test('F04-H1 a click replaces the content', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Examples' }).click();
    await expect(page.getByRole('dialog', { name: 'Examples' })).toBeVisible();
    await axe(page, 'dialog[open]');
    await page.getByRole('button', { name: /Quadratic formula/ }).click();
    expect(await code(page)).toBe('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
    await expect(page.getByText('Example loaded')).toBeVisible();
  });

  test('F04-E1 Shift+click appends on a new line', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'a=b');
    await page.getByRole('button', { name: 'Examples' }).click();
    await page.getByRole('button', { name: /Euler's identity/ }).click({ modifiers: ['Shift'] });
    expect(await code(page)).toBe('a=b \\\\\ne^{i\\pi} + 1 = 0');
  });

  test('F04-E2 Undo brings back the previous equation', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'mine');
    await page.getByRole('button', { name: 'Examples' }).click();
    await page.getByRole('button', { name: /Bayes/ }).click();
    await page.getByRole('button', { name: /^Undo/ }).click();
    expect(await code(page)).toBe('mine');
  });
});

test.describe('F05 look up syntax', () => {
  test('F05-H1 a chemistry row inserts at the cursor', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'x');
    await page.getByRole('button', { name: 'Reference' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reference' });
    await dialog.getByRole('tab', { name: 'Chemistry' }).click();
    await axe(page, 'dialog[open]');
    await dialog.getByRole('button', { name: 'Insert \\ce{H2O}' }).click();
    await expect(dialog).toBeHidden();
    expect(await code(page)).toBe('x\\ce{H2O}');
    await waitRendered(page);
  });

  test('F05-E1 every row on every sheet renders', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Reference' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reference' });
    for (const tab of await dialog.getByRole('tab').all()) {
      await tab.click();
      const rows = dialog.locator('#ref-panel li');
      await expect(rows.first().locator('.math svg')).toBeVisible();
      const missing = await rows.evaluateAll((lis) =>
        lis.filter((li) => !li.querySelector('.math svg')).map((li) => li.querySelector('code')?.textContent),
      );
      expect(missing, `unrendered rows on ${await tab.innerText()}`).toEqual([]);
    }
  });
});

test.describe('F06 undo and redo', () => {
  test('F06-E1 both disabled on a fresh page', async ({ page }) => {
    await openApp(page);
    await expect(page.getByRole('button', { name: /^Undo/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /^Redo/ })).toBeDisabled();
  });

  test('F06-H1 undo and redo an edit', async ({ page }) => {
    await openApp(page);
    const seed = await code(page);
    await setCode(page, 'changed');
    await page.getByRole('button', { name: /^Undo/ }).click();
    expect(await code(page)).toBe(seed);
    await page.getByRole('button', { name: /^Redo/ }).click();
    expect(await code(page)).toBe('changed');
    await expect(page.getByRole('button', { name: /^Redo/ })).toBeDisabled();
  });
});

test.describe('F09 sign in (no accounts yet)', () => {
  test('F09-H1 the dialog explains and closes', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Sign in' }).click();
    const dialog = page.getByRole('dialog', { name: 'Sign in' });
    await expect(dialog).toContainText('Accounts are coming later');
    await axe(page, 'dialog[open]');
    await dialog.getByRole('button', { name: 'Close' }).first().click();
    await expect(dialog).toBeHidden();
  });
});
