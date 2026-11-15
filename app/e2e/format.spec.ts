import type { Page } from '@playwright/test';
import { test, expect, openApp, setCode, waitRendered, previewBox, previewSvg, code, editor } from './helpers';

const menu = (page: Page) => page.getByRole('menu', { name: 'Formatting' });
const item = (page: Page, name: string) => menu(page).getByRole('menuitem', { name, exact: true });

/** Type `text`, select all of it and right-click on the selection. */
async function selectAndRightClick(page: Page, text: string) {
  await setCode(page, text);
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
  await expect(menu(page)).toBeVisible();
}

async function expectRendered(page: Page, latex: string | RegExp) {
  await waitRendered(page);
  await expect(previewSvg(page)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(previewBox(page)).toHaveAttribute('aria-label', latex);
}

test.describe('Right-click formatting menu', () => {
  test('FM-1 bold wraps the selected word and renders', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'Hallo');
    await item(page, 'Bold').click();
    await expect(menu(page)).toHaveCount(0);
    expect(await code(page)).toBe('\\textbf{Hallo}');
    await expectRendered(page, '\\textbf{Hallo}');
    // The selection covers the formatted text and the editor has focus again.
    await expect(editor(page)).toBeFocused();
    // A second Bold takes it off again (toggle).
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Bold').click();
    expect(await code(page)).toBe('Hallo');
  });

  test('FM-2 bold on maths uses \\mathbf, and one Ctrl+Z undoes it', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'x^2 + y');
    await item(page, 'Bold').click();
    expect(await code(page)).toBe('\\mathbf{x^2 + y}');
    await expectRendered(page, '\\mathbf{x^2 + y}');
    await page.keyboard.press('ControlOrMeta+z');
    expect(await code(page)).toBe('x^2 + y');
  });

  test('FM-3 text colour red', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'Hallo Welt');
    await item(page, 'Text colour: Red').click();
    expect(await code(page)).toBe('\\textcolor{#c92a2a}{Hallo Welt}');
    await expectRendered(page, '\\textcolor{#c92a2a}{\\text{Hallo} \\text{Welt}}');
    expect((await previewSvg(page).innerHTML()).toLowerCase()).toContain('#c92a2a');
    // Another colour replaces it instead of nesting.
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Text colour: Blue').click();
    expect(await code(page)).toBe('\\textcolor{#1971c2}{Hallo Welt}');
  });

  test('FM-4 highlight', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'Hallo x^2');
    await item(page, 'Highlight: Yellow').click();
    expect(await code(page)).toBe('\\bbox[#fff3bf,2px]{Hallo x^2}');
    await expectRendered(page, '\\bbox[#fff3bf,2px]{\\text{Hallo} x^2}');
    expect((await previewSvg(page).innerHTML()).toLowerCase()).toContain('#fff3bf');
  });

  test('FM-5 font size', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'Hallo');
    await item(page, 'Large').click();
    expect(await code(page)).toBe('{\\large Hallo}');
    await expectRendered(page, '{\\large \\text{Hallo}}');
    const small = await previewSvg(page).evaluate((s) => s.getBoundingClientRect().height);
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Huge').click();
    expect(await code(page)).toBe('{\\huge Hallo}');
    await waitRendered(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    const big = await previewSvg(page).evaluate((s) => s.getBoundingClientRect().height);
    expect(big).toBeGreaterThan(small);
    // Normal takes the size away.
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Normal').click();
    expect(await code(page)).toBe('Hallo');
  });

  test('FM-6 underline, italic and font', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'Hallo');
    await item(page, 'Underline').click();
    expect(await code(page)).toBe('\\underline{Hallo}');
    await expectRendered(page, '\\underline{\\text{Hallo}}');
    await setCode(page, 'Hallo');
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Italic').click();
    expect(await code(page)).toBe('\\textit{Hallo}');
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Typewriter').click();
    expect(await code(page)).toBe('\\texttt{\\textit{Hallo}}');
    await expectRendered(page, '\\texttt{\\textit{Hallo}}');
  });

  test('FM-7 bullet points on two lines', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'eins\nzwei');
    await item(page, 'Bullet point').click();
    expect(await code(page)).toBe('\\bullet\\; eins\n\\bullet\\; zwei');
    await expectRendered(page, /^\\bullet\\; \\text\{eins\} \\\\\n\\bullet\\; \\text\{zwei\}$/);
    // The same again takes them away.
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Bullet point').click();
    expect(await code(page)).toBe('eins\nzwei');
  });

  test('FM-8 clear formatting unwraps what the menu added', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'Hallo');
    await item(page, 'Bold').click();
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Text colour: Red').click();
    expect(await code(page)).toBe('\\textcolor{#c92a2a}{\\textbf{Hallo}}');
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await item(page, 'Clear formatting').click();
    expect(await code(page)).toBe('Hallo');
    await expectRendered(page, '\\text{Hallo}');
  });

  test('FM-9 Esc closes the menu and the editor keeps focus; no selection keeps the browser menu', async ({ page }) => {
    await openApp(page);
    await selectAndRightClick(page, 'Hallo');
    await expect(menu(page).getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu(page)).toHaveCount(0);
    await expect(editor(page)).toBeFocused();
    expect(await code(page)).toBe('Hallo');
    // Nothing selected: no custom menu.
    await page.keyboard.press('End');
    await editor(page).click({ button: 'right', position: { x: 6, y: 8 } });
    await expect(menu(page)).toHaveCount(0);
  });

  test('FM-10 Shift+F10 opens it, arrows and Enter pick, and it stays in the window', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'Hallo');
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Shift+F10');
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('ArrowDown'); // Italic
    await page.keyboard.press('Enter');
    expect(await code(page)).toBe('\\textit{Hallo}');
    await expect(editor(page)).toBeFocused();
    const box = await (async () => {
      await page.keyboard.press('ContextMenu');
      await expect(menu(page)).toBeVisible();
      return menu(page).boundingBox();
    })();
    const vp = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height);
    await page.keyboard.press('Escape');
  });

  test('FM-11 German labels and 40px tap targets', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /Language: English/ }).click();
    const de = page.getByRole('textbox', { name: 'LaTeX-Quelltext' });
    await de.click();
    await page.keyboard.insertText('Hallo');
    await page.keyboard.press('ControlOrMeta+a');
    await de.click({ button: 'right', position: { x: 6, y: 8 } });
    const m = page.getByRole('menu', { name: 'Formatierung' });
    await expect(m).toBeVisible();
    for (const name of ['Fett', 'Kursiv', 'Unterstrichen', 'Aufzählungspunkt', 'Formatierung entfernen', 'Riesig', 'Schriftfarbe: Rot']) {
      await expect(m.getByRole('menuitem', { name, exact: true })).toBeVisible();
    }
    const heights = await m.getByRole('menuitem').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(40);
  });
});
