// Document view (/doc): a Word-style page with ribbon and status bar.
import type { Page } from '@playwright/test';
import { test, expect, axe } from './helpers';

const sheet = (page: Page) => page.locator('.doc-sheet');
const body = (page: Page) => page.getByRole('textbox', { name: 'Document text' });
const tab = (page: Page, name: string) => page.getByRole('tab', { name });

async function openDoc(page: Page) {
  await page.goto('/doc');
  await expect(body(page)).toBeVisible({ timeout: 20_000 });
}

async function typeLine(page: Page, text: string) {
  await body(page).click();
  await page.keyboard.insertText(text);
}

test.describe('Document view', () => {
  test('DOC-1 opens a white A4 page with ribbon and status bar', async ({ page }) => {
    await openDoc(page);
    await expect(page.locator('.doc-page').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    const w = await sheet(page).evaluate((s) => s.getBoundingClientRect().width / Number(getComputedStyle(s).zoom || 1));
    expect(Math.round(w)).toBe(794); // 210 mm
    await expect(page.getByRole('tablist', { name: 'Ribbon' })).toBeVisible();
    await expect(page.getByText('Page 1 of 1')).toBeVisible();
    await axe(page);
  });

  test('DOC-2 bold from the ribbon, italic with Ctrl+I, colour, highlight, list', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Hallo Welt');
    await page.keyboard.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold (Ctrl+B)' }).click();
    await expect(body(page).locator('strong')).toHaveText('Hallo Welt');
    await expect(page.getByRole('button', { name: 'Bold (Ctrl+B)' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ControlOrMeta+i');
    await expect(body(page).locator('em')).toHaveText('Hallo Welt');
    await page.getByRole('button', { name: 'Text colour #c92a2a' }).click();
    await expect(body(page).locator('[style*="color"]').first()).toHaveAttribute('style', /201, 42, 42|#c92a2a/);
    await page.getByRole('button', { name: 'Highlight #fff3bf' }).click();
    await expect(body(page).locator('mark')).toHaveCount(1);
    await page.getByRole('button', { name: 'Bullet list' }).click();
    await expect(body(page).locator('ul li')).toHaveCount(1);
  });

  test('DOC-3 paper: squared, lined and blank', async ({ page }) => {
    await openDoc(page);
    await tab(page, 'Layout').click();
    const bg = () => page.locator('.doc-page-paper').first().evaluate((c) => getComputedStyle(c).backgroundImage);
    await page.getByRole('button', { name: 'Squared' }).click();
    expect(await bg()).toContain('linear-gradient');
    await page.getByRole('button', { name: 'Lined' }).click();
    expect(await bg()).toContain('linear-gradient');
    await page.getByRole('button', { name: 'Blank' }).click();
    expect(await bg()).toBe('none');
  });

  test('DOC-4 zoom with the slider and the buttons', async ({ page }) => {
    await openDoc(page);
    const zoom = () => sheet(page).evaluate((s) => Number(getComputedStyle(s).zoom));
    const start = await zoom();
    await page.getByRole('contentinfo').getByRole('button', { name: 'Zoom in' }).click();
    expect(await zoom()).toBeCloseTo(start + 0.1, 2);
    await page.getByRole('slider', { name: 'Zoom' }).fill('150');
    expect(await zoom()).toBeCloseTo(1.5, 2);
    await expect(page.getByLabel('Zoom level')).toHaveText('150%');
  });

  test('DOC-5 autosave keeps text, title and paper after a reload', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Bleibt erhalten');
    await page.getByLabel('Document title').fill('Mathe Heft');
    await tab(page, 'Layout').click();
    await page.getByRole('button', { name: 'Lined' }).click();
    await expect(page.getByText('Saved in this browser')).toBeVisible();
    await page.waitForTimeout(700);
    await page.reload();
    await expect(body(page)).toContainText('Bleibt erhalten');
    await expect(page.getByLabel('Document title')).toHaveValue('Mathe Heft');
    await expect(sheet(page)).toHaveAttribute('data-paper', 'lined');
  });

  test('DOC-6 new, open and delete documents', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Erstes Dokument');
    await page.getByLabel('Document title').fill('Eins');
    await tab(page, 'File').click();
    await page.getByRole('button', { name: 'New' }).click();
    await expect(body(page)).not.toContainText('Erstes Dokument');
    await page.getByLabel('Document title').fill('Zwei');
    await page.getByRole('button', { name: 'Open' }).click();
    const list = page.getByRole('region', { name: 'Your documents' });
    await expect(list.getByRole('button', { name: /^Eins/ })).toBeVisible();
    await list.getByRole('button', { name: /^Eins/ }).click();
    await expect(body(page)).toContainText('Erstes Dokument');
    await page.getByRole('button', { name: 'Open' }).click();
    page.once('dialog', (d) => d.accept());
    await list.getByRole('button', { name: 'Delete Zwei' }).click();
    await expect(list.getByRole('button', { name: /^Zwei/ })).toHaveCount(0);
  });

  test('DOC-7 German labels and links between the two views', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Document' }).click();
    await expect(body(page)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Language: English/ }).click();
    await expect(tab(page, 'Einfügen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fett (Strg+B)' })).toBeVisible();
    await expect(page.getByText('Seite 1 von 1')).toBeVisible();
    await axe(page);
    await page.getByRole('link', { name: 'Einzelne Formel' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  // Phase 2: formulas typed straight onto the page.
  const fields = (page: Page) =>
    page.evaluate(() => [...document.querySelectorAll('.doc-math math-field')].map((m) => (m as HTMLElement & { value: string }).value));

  test('DOC-8 Alt+= starts a formula in the text; it is kept after a reload', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Es gilt ');
    await page.keyboard.press('Alt+Equal');
    await expect(page.locator('.doc-math-inline math-field')).toBeFocused();
    // After "a^2" the cursor drops back from the exponent by itself.
    await page.keyboard.type('a^2+b^2');
    await page.keyboard.press('Escape');
    await page.keyboard.insertText(' fertig');
    await expect(body(page)).toContainText('fertig');
    expect(await fields(page)).toEqual(['a^2+b^2']);
    await axe(page);
    await page.waitForTimeout(700);
    await page.reload();
    await expect(page.locator('.doc-math-inline math-field')).toHaveCount(1);
    expect(await fields(page)).toEqual(['a^2+b^2']);
  });

  test('DOC-9 Insert tab: fraction with boxes, symbols, index', async ({ page }) => {
    await openDoc(page);
    await body(page).click();
    await tab(page, 'Insert').click();
    await page.getByRole('group', { name: 'Structures' }).getByRole('button', { name: 'Fraction' }).click();
    await expect(page.locator('.doc-math-inline math-field')).toBeFocused();
    await page.keyboard.type('1');
    await page.keyboard.press('Tab');
    await page.keyboard.type('2');
    expect(await fields(page)).toEqual(['\\frac12']);
    // A symbol goes into the formula you are typing in.
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'element of', exact: true }).click();
    expect(await fields(page)).toEqual(['\\frac12\\in']);
    await page.keyboard.press('Escape');
    // Index (subscript) next to Power: a new formula x_n with boxes.
    await expect(page.getByRole('button', { name: 'Formula', exact: true })).toHaveCount(0);
    await page.getByRole('group', { name: 'Structures' }).getByRole('button', { name: 'Index' }).click();
    await page.keyboard.type('a');
    await page.keyboard.press('Tab');
    await page.keyboard.type('n');
    expect((await fields(page))[1]).toBe('a_{n}');
  });

  test('DOC-10 German words inside a formula become symbols', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'x');
    // A word opens the list; Enter takes the first suggestion.
    const formula = async (before: string, word: string, after = '') => {
      await page.keyboard.press('Alt+Equal');
      await expect(page.locator('.doc-math math-field').last()).toBeFocused();
      await page.waitForTimeout(150); // the field finishes setting up (a person never types this fast)
      await page.keyboard.type(before + word);
      await expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeVisible();
      await page.keyboard.press('Enter');
      await page.keyboard.type(after);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.keyboard.insertText(' ');
    };
    await formula('', 'summe');
    await formula('x', 'elementvon', 'A');
    await formula('', 'unendlich');
    const v = await fields(page);
    expect(v[0]).toMatch(/^\\sum/);
    expect(v[1]).toBe('x\\in A');
    expect(v[2]).toBe('\\infty');
  });

  // Phase 3: real pages and export.
  test('DOC-11 long text flows onto real A4 pages; nothing sits in the gap', async ({ page }) => {
    await openDoc(page);
    await body(page).click();
    for (let i = 1; i <= 40; i++) {
      await page.keyboard.insertText(`Absatz ${i}: Seien A und B zwei Mengen. Die Vereinigung enthält alle Elemente, die in A oder in B liegen.`);
      await page.keyboard.press('Enter');
    }
    await expect(page.getByText(/Page \d of [2-9]/)).toBeVisible();
    const misplaced = await page.evaluate(() => {
      const sheet = document.querySelector('.doc-sheet')!.getBoundingClientRect();
      const pages = [...document.querySelectorAll('.doc-page')].map((p) => {
        const r = p.getBoundingClientRect();
        return [r.top - sheet.top, r.bottom - sheet.top];
      });
      return [...document.querySelectorAll('.doc-content > p')].filter((p) => {
        const r = p.getBoundingClientRect();
        const top = r.top - sheet.top;
        const bottom = r.bottom - sheet.top;
        return !pages.some(([a, b]) => top >= a && bottom <= b - 80); // inside a page, above its bottom margin
      }).length;
    });
    expect(misplaced).toBe(0);
  });

  test('DOC-12 a page break starts a new page; Word export downloads a .docx', async ({ page }) => {
    await page.addInitScript(() => {
      const content = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Es gilt ' }, { type: 'mathInline', attrs: { latex: 'a^2+b^2=c^2' } }] },
          { type: 'mathBlock', attrs: { latex: '\\sum_{k=1}^{n}\\frac{1}{k^2}' } },
          { type: 'pageBreak' },
          { type: 'paragraph', content: [{ type: 'text', text: 'Seite zwei' }] },
        ],
      };
      localStorage.setItem('lx.docs.v1', JSON.stringify([{ id: 'w', title: 'Export Test', updatedAt: 1, content, paper: 'blank', margins: 'normal', orientation: 'portrait' }]));
      localStorage.setItem('lx.docs.current', 'w');
    });
    await page.goto('/doc');
    await expect(page.locator('.doc-math math-field')).toHaveCount(2);
    await expect(page.getByText('of 2')).toBeVisible();
    await expect(page.locator('.doc-page')).toHaveCount(2);
    await tab(page, 'File').click();
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download for Word' }).click();
    const file = await dl;
    expect(file.suggestedFilename()).toBe('Export Test.docx');
    const { readFileSync } = await import('node:fs');
    const bytes = readFileSync((await file.path())!);
    expect(bytes.subarray(0, 2).toString()).toBe('PK'); // a zip, as .docx files are
    await expect(page.getByText('Saved for Word')).toBeVisible();
  });

  // Formulas work like the single-formula editor: words open a list of symbols.
  const startFormula = async (page: Page) => {
    await body(page).click();
    await page.keyboard.press('Alt+Equal');
    await expect(page.locator('.doc-math math-field').last()).toBeFocused();
    await page.waitForTimeout(150);
  };

  test('DOC-13 typing a word in a formula opens suggestions; Enter takes the first, arrows pick another', async ({ page }) => {
    await openDoc(page);
    await startFormula(page);
    await page.keyboard.type('Aäquivalent');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list).toBeVisible();
    await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(list).toHaveCount(0);
    await page.keyboard.type('B');
    expect(await fields(page)).toEqual(['A\\Leftrightarrow B']);
    // "genau dann" as one word, then the curly braces by name.
    await page.keyboard.type('genaudann');
    await page.keyboard.press('Enter');
    await page.keyboard.type('geschweift');
    await page.keyboard.press('Enter');
    await page.keyboard.type('1');
    expect(await fields(page)).toEqual(['A\\Leftrightarrow B\\Leftrightarrow\\left\\{1\\right\\}']);
  });

  test('DOC-14 a word followed by a space is text in the formula; brackets from the ribbon', async ({ page }) => {
    await openDoc(page);
    await startFormula(page);
    await page.keyboard.type('gilt x');
    expect(await fields(page)).toEqual(['\\text{gilt }x']);
    await expect(page.getByText(/Esc back to text/)).toBeVisible();
    await tab(page, 'Insert').click();
    await page.getByRole('group', { name: 'Brackets' }).getByRole('button', { name: 'absolute value' }).click();
    await page.keyboard.type('y');
    expect((await fields(page))[0]).toContain('\\left|y\\right|');
  });

  test('DOC-18 a formula with only words becomes normal text when you leave it', async ({ page }) => {
    await openDoc(page);
    await startFormula(page);
    await page.keyboard.type('sei und ');
    await page.keyboard.press('Escape');
    await expect(page.locator('.doc-math')).toHaveCount(0);
    await expect(body(page)).toContainText('sei und');
  });

  test('DOC-19 typing on the page offers symbols like the formula editor', async ({ page }) => {
    await openDoc(page);
    await page.getByRole('button', { name: /Language: English/ }).click();
    const text = page.getByRole('textbox', { name: 'Dokumenttext' });
    await text.click();
    await page.keyboard.type('A äqu');
    const list = page.getByRole('listbox', { name: 'Vorschläge' });
    await expect(list).toBeVisible();
    await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await expect(list.getByRole('option').first()).toContainText('äquivalent');
    // Enter puts in the symbol as a formula; you keep writing text after it.
    await page.keyboard.press('Enter');
    await expect(list).toHaveCount(0);
    await page.keyboard.type(' B ist wahr');
    expect(await fields(page)).toEqual(['\\equiv']);
    await expect(text).toContainText('B ist wahr');
    // Two words: "genau dann" offers ⇔.
    await page.keyboard.type(' genau dann');
    await expect(list.getByRole('option').first()).toContainText('genau dann');
    // Esc keeps the words as text.
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(text).toContainText('genau dann');
    // A fraction opens its formula with the boxes to fill in.
    await page.keyboard.type(' bruch');
    await page.keyboard.press('Enter');
    await expect(page.locator('.doc-math math-field').last()).toBeFocused();
    // The switch in View turns it off.
    await page.keyboard.press('Escape');
    await tab(page, 'Ansicht').click();
    await page.getByRole('button', { name: 'Vorschläge im Text' }).click();
    await text.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' summe');
    await expect(list).toHaveCount(0);
  });

  test('DOC-20 deleting: one Backspace removes a formula; Backspace at a formula start deletes the letter before', async ({ page }) => {
    await page.addInitScript(() => {
      const content = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'ab' }, { type: 'mathInline', attrs: { latex: 'x^2' } }, { type: 'text', text: 'cd' }] },
          { type: 'mathBlock', attrs: { latex: '\\frac12' } },
          { type: 'paragraph', content: [{ type: 'text', text: 'Ende' }] },
        ],
      };
      localStorage.setItem('lx.docs.v1', JSON.stringify([{ id: 'd', title: 'Del', updatedAt: 1, content, paper: 'blank', margins: 'normal', orientation: 'portrait' }]));
      localStorage.setItem('lx.docs.current', 'd');
    });
    await page.goto('/doc');
    await expect(page.locator('.doc-math math-field')).toHaveCount(2);
    // Cursor right after the inline formula ("|cd"): one Backspace removes it.
    await page.locator('.doc-content p').first().click({ position: { x: 2, y: 5 } });
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight'); // after "ab", next to the formula
    await page.keyboard.press('Delete'); // one Delete removes the formula after the cursor
    await expect(page.locator('.doc-math-inline')).toHaveCount(0);
    await expect(page.locator('.doc-content p').first()).toHaveText('abcd');
    // At the start of "Ende": one Backspace removes the own-line formula before it.
    await page.locator('.doc-content p').last().click();
    await page.keyboard.press('Home');
    await page.keyboard.press('Backspace');
    await expect(page.locator('.doc-math-block')).toHaveCount(0);
    // Backspace at the very start of a formula deletes the letter before it.
    await page.keyboard.press('End');
    await page.keyboard.insertText(' x');
    await page.keyboard.press('Alt+Equal');
    await expect(page.locator('.doc-math-inline math-field')).toBeFocused();
    await page.waitForTimeout(150);
    await page.keyboard.type('y');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Backspace');
    await expect(page.locator('.doc-content p').last()).toContainText('Ende ');
    await expect(page.locator('.doc-content p').last()).not.toContainText('Ende x');
    expect(await fields(page)).toEqual(['y']);
  });

  test('DOC-21 matrix: pick the size, add a row; the ribbon wraps instead of cutting off', async ({ page }) => {
    await openDoc(page);
    await body(page).click();
    await tab(page, 'Insert').click();
    await page.getByRole('group', { name: 'Matrix' }).getByRole('button', { name: 'Matrix' }).click();
    await page.getByRole('dialog', { name: 'Matrix size' }).getByRole('button', { name: '[ ]' }).click();
    await page.getByRole('button', { name: '3 × 4' }).click();
    await expect(page.locator('.doc-math math-field').last()).toBeFocused();
    const v = (await fields(page))[0];
    expect(v.startsWith('\\begin{bmatrix}')).toBe(true);
    expect(v.split('\\\\').length).toBe(3); // 3 rows
    await page.getByRole('group', { name: 'Matrix' }).getByRole('button', { name: 'Row below' }).click();
    expect((await fields(page))[0].split('\\\\').length).toBe(4);
    // Nothing in the ribbon is cut off: every group is fully inside the window.
    await page.setViewportSize({ width: 820, height: 900 });
    const cut = await page.evaluate(() =>
      [...document.querySelectorAll('.ribbon-group')].filter((g) => g.getBoundingClientRect().right > window.innerWidth + 1).length,
    );
    expect(cut).toBe(0);
  });

  test('DOC-22 select text across a formula with the mouse and delete it', async ({ page }) => {
    await page.addInitScript(() => {
      const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Anfang ' }, { type: 'mathInline', attrs: { latex: 'a+b' } }, { type: 'text', text: ' Schluss' }] }] };
      localStorage.setItem('lx.docs.v1', JSON.stringify([{ id: 's', title: 'Sel', updatedAt: 1, content, paper: 'blank', margins: 'normal', orientation: 'portrait' }]));
      localStorage.setItem('lx.docs.current', 's');
    });
    await page.goto('/doc');
    const p = page.locator('.doc-content p').first();
    await expect(page.locator('.doc-math math-field')).toHaveCount(1);
    const box = (await p.boundingBox())!;
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();
    await page.keyboard.press('Backspace');
    await expect(page.locator('.doc-math')).toHaveCount(0);
    await expect(p).not.toContainText('Anfang');
  });

  test('DOC-23 after a word in a formula, brackets and a matrix still go in as maths', async ({ page }) => {
    await openDoc(page);
    await startFormula(page);
    await page.keyboard.type('x span ');
    await page.keyboard.type('(');
    await tab(page, 'Insert').click();
    await page.getByRole('group', { name: 'Matrix' }).getByRole('button', { name: 'Matrix' }).click();
    await page.getByRole('button', { name: '3 × 1' }).click();
    const v = (await fields(page))[0];
    expect(v.startsWith('x\\text{span }\\left(')).toBe(true);
    expect(v).toContain('\\begin{pmatrix}');
    expect(v).not.toContain('\\textbackslash');
  });

  test('DOC-15 tables: insert, add a row, delete', async ({ page }) => {
    await openDoc(page);
    await body(page).click();
    await tab(page, 'Insert').click();
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    await expect(body(page).locator('table tr')).toHaveCount(3);
    await page.keyboard.insertText('x');
    await page.getByRole('group', { name: 'Table' }).getByRole('button', { name: 'Row below' }).click();
    await expect(body(page).locator('table tr')).toHaveCount(4);
    await page.getByRole('button', { name: 'Delete table' }).click();
    await expect(body(page).locator('table')).toHaveCount(0);
  });

  test('DOC-16 a template fills a new document', async ({ page }) => {
    await openDoc(page);
    await tab(page, 'File').click();
    await page.getByRole('button', { name: 'Worksheet' }).click();
    await expect(page.getByLabel('Document title')).toHaveValue('Worksheet');
    await expect(body(page).locator('h2')).toHaveCount(3);
    await expect(page.locator('.doc-math-block')).toHaveCount(2);
    await expect(sheet(page)).toHaveAttribute('data-paper', 'squared');
  });

  test('DOC-17 backup: save all documents to a file and load them back', async ({ page }) => {
    await openDoc(page);
    await typeLine(page, 'Gesichert');
    await page.getByLabel('Document title').fill('Gesichert');
    await tab(page, 'File').click();
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save backup' }).click();
    const file = await dl;
    expect(file.suggestedFilename()).toMatch(/^equadeck-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const { readFileSync } = await import('node:fs');
    const saved = JSON.parse(readFileSync((await file.path())!, 'utf8'));
    expect(saved.app).toBe('equadeck');
    expect(saved.docs[0].title).toBe('Gesichert');
    // Load a backup with one more document.
    const extra = { ...saved, docs: [{ ...saved.docs[0], id: 'other', title: 'Aus der Sicherung', updatedAt: Date.now() }] };
    await page.locator('input[type=file]').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(extra)) });
    await expect(page.getByText('Backup loaded: 1 new, 0 updated.')).toBeVisible();
    await page.getByRole('button', { name: 'Open' }).click();
    await expect(page.getByRole('region', { name: 'Your documents' }).getByRole('button', { name: /^Aus der Sicherung/ })).toBeVisible();
  });
});
