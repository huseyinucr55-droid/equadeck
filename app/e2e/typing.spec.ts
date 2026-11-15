import type { Page } from '@playwright/test';
import { test, expect, openApp, setCode, waitRendered, previewBox, previewSvg, code } from './helpers';

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

  test('TY-5 commands are found by their German meaning and described in German', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /Language: English/ }).click();
    const box = page.getByRole('textbox', { name: 'LaTeX-Quelltext' });
    const clear = async () => {
      await box.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Delete');
    };
    await clear();
    await page.keyboard.type('\\in');
    await expect(page.getByRole('option', { name: /\\ElementVon\s*\\in · Element von/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await clear();
    await page.keyboard.insertText('x ');
    await page.keyboard.type('Element von');
    await expect(page.getByRole('option', { name: /\\in/ }).first()).toBeVisible();
    await page.waitForTimeout(300); // CodeMirror ignores Enter right after the list opens
    await page.keyboard.press('Enter');
    await page.keyboard.type('A');
    // The readable command stays in the editor; the preview and copies get real LaTeX.
    expect(await code(page)).toBe('x \\ElementVon A');
    await expect(page.getByRole('img', { name: 'x \\in A', exact: true })).toBeVisible();
    await clear();
    await page.keyboard.type('\\unendlich');
    await expect(page.getByRole('option', { name: /\\Unendlich.*\\infty/ }).first()).toBeVisible();
    await page.keyboard.press('Escape');

    // Turned off, picking a command inserts the LaTeX name.
    await page.getByRole('checkbox', { name: /Lesbare Befehle/ }).uncheck();
    await clear();
    await page.keyboard.type('\\elem');
    await expect(page.getByRole('option', { name: /\\in\s*Element von/ })).toBeVisible();
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    expect(await code(page)).toBe('\\in ');
  });

  test('TY-6 words are text, "summe" suggests Σ, symbols delete in one go', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /Language: English/ }).click();
    // No Text button any more: words are text by themselves.
    await expect(page.getByRole('button', { name: 'Text', exact: true })).toHaveCount(0);
    const box = page.getByRole('textbox', { name: 'LaTeX-Quelltext' });
    const clear = async () => {
      await box.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Delete');
    };
    await clear();
    await page.keyboard.insertText('Seien A und B zwei  Mengen');
    await expect(page.getByRole('img', { name: '\\text{Seien} A \\text{und} B \\text{zwei}  \\text{Mengen}', exact: true })).toBeVisible();
    // One line, side by side: two words in a row once became a line break.
    const rendered = () => expect(page.getByRole('button', { name: 'PNG herunterladen' })).toBeEnabled();
    await page.keyboard.insertText(' mit');
    await rendered();
    const oneLine = await page.locator('section[aria-label="Vorschau"] svg').first().evaluate((s) => s.getBoundingClientRect().height);
    await clear();
    await page.keyboard.insertText('Seien');
    await rendered();
    const word = await page.locator('section[aria-label="Vorschau"] svg').first().evaluate((s) => s.getBoundingClientRect().height);
    expect(oneLine).toBeLessThan(word * 1.5);

    // A plain word opens the list with the first entry chosen; Enter takes it.
    await clear();
    await page.keyboard.type('summe');
    const first = page.getByRole('option').first();
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(first).toContainText('\\Summe');
    await page.waitForTimeout(300); // CodeMirror ignores Enter right after the list opens
    await page.keyboard.press('Enter');
    expect(await code(page)).toBe('\\Summe_{}^{}');

    // Symbols show as symbols and one Backspace removes a whole one.
    await clear();
    await page.keyboard.type('x element von');
    await expect(page.getByRole('option').first()).toContainText('\\ElementVon');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    expect(await code(page)).toBe('x \\ElementVon ');
    await expect(page.locator('.cm-symbol')).toHaveCount(1);
    await page.keyboard.press('Backspace');
    expect(await code(page)).toBe('x ');

    // # is just a character again.
    await page.keyboard.type('#');
    expect(await code(page)).toBe('x #');
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
