import type { Page } from '@playwright/test';
import { test, expect, openApp, setCode, waitRendered, previewBox, previewSvg } from './helpers';

const widthOf = async (page: Page, code: string) => {
  await setCode(page, code);
  await waitRendered(page);
  return previewSvg(page).evaluate((s) => s.getBoundingClientRect().width);
};

test.describe('Typing made easier', () => {
  // "Verknüpfungen" showed as "Verknü pfungen": letters missing from the TeX
  // fonts were measured as 0 wide.
  test('TY-1 umlauts take their real width, no XeLaTeX warning', async ({ page }) => {
    await openApp(page);
    const plain = await widthOf(page, '\\text{Verknupfungen}');
    const umlaut = await widthOf(page, '\\text{Verknüpfungen}');
    expect(Math.abs(umlaut - plain)).toBeLessThan(3);
    const sz = await widthOf(page, '\\text{Strasse}');
    const eszett = await widthOf(page, '\\text{Straße}');
    expect(eszett).toBeGreaterThan(sz - 12); // ß takes room, it is not zero wide
    expect(eszett).toBeLessThan(sz);
    await expect(page.getByRole('region', { name: 'LaTeX packages' })).not.toContainText('XeLaTeX');
  });

  test('TY-2 shortcuts: => becomes an implication arrow, and can be turned off', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'A => B, x != y, a <=> b');
    await waitRendered(page);
    await expect(previewBox(page)).toHaveAttribute('aria-label', 'A \\Rightarrow B, x \\ne y, a \\Leftrightarrow b');
    await page.getByRole('checkbox', { name: /Shortcuts/ }).uncheck();
    await expect(previewBox(page)).toHaveAttribute('aria-label', 'A => B, x != y, a <=> b');
  });

  test('TY-3 shortcuts leave chemistry and text alone', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\text{a => b} => \\ce{H2 -> H2O}');
    await waitRendered(page);
    await expect(previewBox(page)).toHaveAttribute('aria-label', '\\text{a => b} \\Rightarrow \\ce{H2 -> H2O}');
  });

  test('TY-4 "Keep my spaces" shows typed spaces and remembers the choice', async ({ page }) => {
    await openApp(page);
    const tight = await widthOf(page, '\\alpha x');
    await page.getByRole('checkbox', { name: 'Keep my spaces' }).check();
    await expect(previewBox(page)).toHaveAttribute('aria-label', '\\alpha\\ x');
    await waitRendered(page);
    const spaced = await previewSvg(page).evaluate((s) => s.getBoundingClientRect().width);
    expect(spaced).toBeGreaterThan(tight + 2);
    await page.reload();
    await expect(page.getByRole('checkbox', { name: 'Keep my spaces' })).toBeChecked();
  });
});
