import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Every test fails on a console error, an uncaught exception or a 5xx. */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') problems.push(`console: ${m.text()} @ ${m.location().url}`);
      });
      page.on('response', (r) => {
        if (r.status() === 404) problems.push(`404 ${r.url()}`);
      });
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('response', (r) => {
        if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`);
      });
      await use();
      expect(problems, 'console errors / page errors / 5xx').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export const editor = (page: Page) => page.getByRole('textbox', { name: 'LaTeX source' });
export const previewBox = (page: Page) => page.locator('section[aria-label="Preview"] > div[role="img"]');
export const previewSvg = (page: Page) => previewBox(page).locator('svg').first();
export const sizeField = (page: Page) => page.getByLabel('Size', { exact: true });

/** Open the app and wait until the MathJax engine has drawn the seed equation. */
export async function openApp(page: Page, path = '/') {
  await page.goto(path);
  // The engine is a lazy chunk; on a cold dev server it can take a while.
  await expect(previewSvg(page)).toBeVisible({ timeout: 20_000 });
}

/** Replace the editor content (insertText avoids autocomplete hijacking keys). */
export async function setCode(page: Page, text: string) {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  if (text) await page.keyboard.insertText(text);
  else await page.keyboard.press('Delete');
  await page.keyboard.press('Escape');
}

export async function code(page: Page) {
  return page.evaluate(() => {
    const lines = [...document.querySelectorAll('.cm-content .cm-line')].map((l) => l.textContent ?? '');
    return lines.join('\n');
  });
}

/** Wait until the preview matches the code (export buttons enable). */
export async function waitRendered(page: Page) {
  await expect(page.getByRole('button', { name: /Download PNG/ })).toBeEnabled();
}

export async function axe(page: Page, include?: string) {
  const builder = new AxeBuilder({ page });
  if (include) builder.include(include);
  const r = await builder.analyze();
  const summary = r.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`,
  );
  expect(summary, 'axe violations').toEqual([]);
}
