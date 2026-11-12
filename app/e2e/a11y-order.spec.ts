import { test, expect, openApp } from './helpers';

// BUG-005: Tab order must follow what's on screen (WCAG 2.4.3).
test('X-6 desktop Tab order follows the visual order of the regions', async ({ page }) => {
  await openApp(page);
  const region = () =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      if (el.closest('[role="toolbar"]')) return 'toolbar';
      if (el.closest('section[aria-label="Symbols"]')) return 'palette';
      if (el.closest('.cm-editor')) return 'editor';
      if (el.closest('[aria-label="Export"]')) return 'export';
      if (el.closest('aside')) return 'saved';
      return null;
    });
  const seen: string[] = [];
  await page.locator('body').click({ position: { x: 5, y: 70 } });
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const r = await region();
    if (r && seen.at(-1) !== r) seen.push(r);
    if (r === 'saved') break;
  }
  const tops = await page.evaluate(() => ({
    toolbar: document.querySelector('[role="toolbar"]')!.getBoundingClientRect().top,
    palette: document.querySelector('section[aria-label="Symbols"]')!.getBoundingClientRect().top,
    editor: document.querySelector('.cm-editor')!.getBoundingClientRect().top,
    export: document.querySelector('[aria-label="Export"]')!.getBoundingClientRect().top,
  }));
  const visual = (Object.keys(tops) as (keyof typeof tops)[]).sort((a, b) => tops[a] - tops[b]);
  expect(seen.filter((r) => r !== 'saved')).toEqual(visual);
});
