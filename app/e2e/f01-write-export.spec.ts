import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect, openApp, setCode, code, waitRendered, previewBox, axe, editor, sizeField } from './helpers';

/** Decode a PNG in the page: size, a corner pixel's alpha, and the first opaque pixel's colour. */
async function inspectPng(page: Page, buf: Buffer) {
  return page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob);
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
    let ink: number[] | null = null;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) { ink = [d[i], d[i + 1], d[i + 2]]; break; }
    return { w: bmp.width, h: bmp.height, cornerAlpha: d[3], ink };
  }, buf.toString('base64'));
}

async function downloadPng(page: Page) {
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download PNG/ }).click();
  const file = await dl;
  return { name: file.suggestedFilename(), buf: readFileSync((await file.path())!) };
}

test.describe('F01 write an equation and download it', () => {
  test('F01-H1 happy path: PNG with a transparent background', async ({ page }) => {
    await openApp(page);
    await axe(page);
    await setCode(page, '\\int_0^1 x^2 \\, dx = \\frac{1}{3}');
    await waitRendered(page);
    const { name, buf } = await downloadPng(page);
    expect(name).toBe('equation.png');
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    const png = await inspectPng(page, buf);
    expect(png.w).toBeGreaterThan(50);
    expect(png.cornerAlpha).toBe(0);
  });

  test('F01-E1 empty input disables export', async ({ page }) => {
    await openApp(page);
    await setCode(page, '');
    await expect(page.getByText('Your equation appears here.')).toBeVisible();
    for (const n of [/Download PNG/, /^SVG$/, /^PDF$/, /Copy image/, /Copy LaTeX/]) {
      await expect(page.getByRole('button', { name: n })).toBeDisabled();
    }
  });

  test('F01-E2 very long input scrolls inside the preview, not the page', async ({ page }) => {
    await openApp(page);
    await setCode(page, Array.from({ length: 300 }, (_, i) => `x_{${i}}`).join('+'));
    await waitRendered(page);
    const m = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      box: (() => {
        const b = document.querySelector('section[aria-label="Preview"] [role="img"]')!;
        return b.scrollWidth - b.clientWidth;
      })(),
    }));
    expect(m.page).toBeLessThanOrEqual(0);
    expect(m.box).toBeGreaterThan(0);
  });

  test('F01-E3 accents and emoji render', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\text{café, naïve, ✓ 😀} = 1');
    await waitRendered(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('F01-E4 refresh keeps the draft and size', async ({ page }) => {
    await openApp(page);
    await setCode(page, 'a^2 + b^2 = c^2');
    await sizeField(page).fill('32');
    await page.waitForTimeout(600); // draft is saved 300 ms after the last change
    await page.reload();
    await expect(previewBox(page).locator('svg')).toBeVisible();
    expect(await code(page)).toBe('a^2 + b^2 = c^2');
    await expect(sizeField(page)).toHaveValue('32');
  });

  test('F01-E5 dark theme still exports dark ink', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openApp(page);
    await setCode(page, 'x');
    await waitRendered(page);
    const png = await inspectPng(page, (await downloadPng(page)).buf);
    expect(png.ink).not.toBeNull();
    expect(Math.max(...png.ink!)).toBeLessThan(80);
  });

  test('F01-E6 keyboard only: skip link, type, download', async ({ page }) => {
    await openApp(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to editor' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(editor(page)).toBeFocused();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText('y = mx + b');
    await waitRendered(page);
    const dl = page.waitForEvent('download');
    let reached = false;
    for (let i = 0; i < 60 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.getByRole('button', { name: /Download PNG/ }).evaluate((b) => b === document.activeElement);
    }
    expect(reached, 'Download PNG reachable with Tab').toBe(true);
    await page.keyboard.press('Enter');
    expect((await dl).suggestedFilename()).toBe('equation.png');
  });

  test('F01-E7 mobile width: no sideways scroll, preview above the editor', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      previewTop: document.querySelector('section[aria-label="Preview"]')!.getBoundingClientRect().top,
      editorTop: document.querySelector('#editor')!.getBoundingClientRect().top,
    }));
    expect(m.overflow).toBeLessThanOrEqual(0);
    expect(m.previewTop).toBeLessThan(m.editorTop);
    await axe(page);
  });

  test('F01-N1 invalid LaTeX shows an error and blocks export', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\frac{1}{');
    await expect(page.getByRole('alert')).toContainText('Missing close brace');
    await expect(page.getByRole('button', { name: /Download PNG/ })).toBeDisabled();
  });

  test('F01-N2 javascript: links cannot be injected', async ({ page }) => {
    await openApp(page);
    await setCode(page, '\\href{javascript:alert(1)}{x}');
    await expect(page.getByRole('alert')).toBeVisible();
    const html = await previewBox(page).innerHTML();
    expect(html).not.toContain('javascript:');
  });

  test('F01-N3 double-click Download does not break', async ({ page }) => {
    await openApp(page);
    await waitRendered(page);
    let downloads = 0;
    page.on('download', () => downloads++);
    await page.getByRole('button', { name: /Download PNG/ }).dblclick();
    await expect.poll(() => downloads).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole('button', { name: /Download PNG/ })).toBeEnabled();
  });

  test('F01-N4 font size out of range keeps the last valid size', async ({ page }) => {
    await openApp(page);
    await sizeField(page).fill('200');
    await expect(page.getByText('8 to 96')).toBeVisible();
    await expect(previewBox(page)).toHaveCSS('font-size', '20px');
  });
});
