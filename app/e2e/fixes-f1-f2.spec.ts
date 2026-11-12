import { test, expect, openApp, setCode, waitRendered } from './helpers';

const clip = (page: import('@playwright/test').Page) => page.evaluate(() => navigator.clipboard.readText());
const packages = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'LaTeX packages' });

test.describe('F1 Copy for Word / PowerPoint', () => {
  test('F1-H1 puts MathML on the clipboard', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\frac{a}{b} + \\sqrt{x}');
    await waitRendered(page);
    await page.getByRole('button', { name: /Copy for Word/ }).click();
    await expect(page.getByText(/Paste into Word or PowerPoint/)).toBeVisible();
    const text = await clip(page);
    expect(text.startsWith('<math xmlns="http://www.w3.org/1998/Math/MathML"')).toBe(true);
    expect(text).toContain('<mfrac>');
    expect(text).toContain('<msqrt>');
    expect(text).not.toContain('data-mjx');
  });

  test('F1-E1 works for chemistry (extras) and multi-line', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\ce{H2O} \\\\ a = b');
    await waitRendered(page);
    await page.getByRole('button', { name: /Copy for Word/ }).click();
    const text = await clip(page);
    expect(text).toContain('<math');
    expect(text).toContain('H');
    expect(text).toContain('<mtable');
  });

  test('F1-N1 disabled while the LaTeX is broken', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\frac{1}{');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy for Word/ })).toBeDisabled();
  });
});

test.describe('F2 packages needed', () => {
  test('F2-H1 plain maths needs nothing', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'x^2 + y^2 = r^2');
    await waitRendered(page);
    await expect(packages(page)).toContainText('No extra packages');
  });

  test('F2-H2 lists packages with the reason', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\ce{H2O} + \\cancel{x} + \\mathbb{R} + \\begin{pmatrix}a\\end{pmatrix} + {\\color{ForestGreen} y}');
    await waitRendered(page);
    const p = packages(page);
    for (const name of ['mhchem', 'cancel', 'amssymb', 'amsmath', 'xcolor']) await expect(p).toContainText(name);
    await expect(p).toContainText('dvipsnames');
  });

  test('F2-H3 Copy as LaTeX includes the usepackage lines and the equation', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\dv{f}{x} = \\abs{x}');
    await waitRendered(page);
    await packages(page).getByRole('button', { name: 'Copy as LaTeX' }).click();
    const text = await clip(page);
    expect(text).toContain('\\usepackage{physics}');
    expect(text).toContain('\\[');
    expect(text).toContain('\\dv{f}{x} = \\abs{x}');
    expect(text).toContain('\\]');
  });

  test('F2-E1 top-level line breaks become gather* (amsmath)', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'a = b \\\\ c = d');
    await waitRendered(page);
    await expect(packages(page)).toContainText('amsmath');
    await packages(page).getByRole('button', { name: 'Copy as LaTeX' }).click();
    const text = await clip(page);
    expect(text).toContain('\\begin{gather*}');
    expect(text).toContain('\\usepackage{amsmath}');
  });

  test('F2-E2 warns about MathJax-only commands and Unicode', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\bbox[yellow]{x} ÷ 2');
    await waitRendered(page);
    const p = packages(page);
    await expect(p).toContainText('\\bbox');
    await expect(p).toContainText('÷');
  });
});
