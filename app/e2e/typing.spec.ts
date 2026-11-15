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

  test('TY-6 "für alle#" and "integral" + space become symbols, deleted in one go', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /Language: English/ }).click();
    const box = page.getByRole('textbox', { name: 'LaTeX-Quelltext' });
    await box.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Delete');
    // Two words need "#".
    await page.keyboard.type('für alle#x element von#A');
    expect(await code(page)).toBe('\\FürAlle x \\ElementVon A');
    await expect(page.getByRole('img', { name: '\\forall x \\in A', exact: true })).toBeVisible();
    // The editor shows the symbols, not the commands.
    await expect(page.locator('.cm-symbol')).toHaveCount(2);
    // One Backspace after "A" removes "A", the next the whole ∈.
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    expect(await code(page)).toBe('\\FürAlle x ');
    // One word: a space is enough. "kleiner" waits, it could become "kleiner gleich".
    await page.keyboard.type('integral ');
    expect(await code(page)).toBe('\\FürAlle x \\Integral_{}^{}');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('a kleiner b');
    expect(await code(page)).toBe('a kleiner b');
    // Unknown words keep their #.
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('hallo#');
    expect(await code(page)).toBe('hallo#');
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
