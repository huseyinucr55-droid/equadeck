// Voice input in the document, with a stand-in for the browser's recogniser.
import { test, expect, axe } from './helpers';
import type { Page } from '@playwright/test';

const body = (page: Page) => page.getByRole('textbox', { name: 'Document text' });
const mic = (page: Page) => page.getByRole('button', { name: 'Voice input (F8)' });
const fields = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('.doc-math math-field')].map((m) => (m as HTMLElement & { value: string }).value));

type Fake = { runs: { lang: string; local: boolean; on: boolean }[]; emit: (type: string, data?: object) => void };
const fake = (page: Page, type: string, data: object = {}) =>
  page.evaluate(([t, d]) => (window as unknown as { fake: Fake }).fake.emit(t as string, d as object), [type, data] as const);
const runs = (page: Page) => page.evaluate(() => (window as unknown as { fake: Fake }).fake.runs);

/** Say a phrase, in one final result. */
async function say(page: Page, text: string) {
  await fake(page, 'result', { results: [{ isFinal: true, 0: { transcript: text } }] });
  await fake(page, 'end'); // the next phrase comes in a new run
  await page.waitForTimeout(400);
}

async function open(page: Page, opts: { agreed?: boolean; pack?: string } = {}) {
  await page.addInitScript(({ agreed, pack }) => {
    if (agreed) localStorage.setItem('lx.doc.voiceOk', 'cloud');
    const state = { runs: [] as unknown[], current: null as EventTarget | null, emit(type: string, data: object) {
      const ev = Object.assign(new Event(type), data);
      state.current?.dispatchEvent(ev);
    } };
    class Rec extends EventTarget {
      lang = '';
      processLocally = false;
      run: { on: boolean } | null = null;
      start() {
        this.run = { lang: this.lang, local: this.processLocally, on: true } as { on: boolean };
        state.runs.push(this.run);
        state.current = this;
      }
      stop() { if (this.run) this.run.on = false; }
      abort() { if (this.run) this.run.on = false; }
      static available = pack ? async () => pack : undefined;
      static install = async () => true;
    }
    Object.assign(window, { fake: state, webkitSpeechRecognition: Rec, SpeechRecognition: undefined });
  }, opts);
  await page.goto('/doc');
  await expect(body(page)).toBeVisible({ timeout: 20_000 });
  await body(page).click();
}

async function listening(page: Page) {
  await mic(page).click();
  await expect(mic(page)).toHaveAttribute('aria-pressed', 'true');
}

test.describe('Voice input', () => {
  test('V-1 asks before the first use, says where the sound goes, and nothing runs before that', async ({ page }) => {
    await open(page);
    await mic(page).click();
    const dialog = page.getByRole('dialog', { name: 'Voice input' });
    await expect(dialog).toContainText('Google');
    expect(await runs(page)).toHaveLength(0);
    await axe(page);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    expect(await runs(page)).toHaveLength(0);
    await mic(page).click();
    await dialog.getByRole('button', { name: 'Allow and start' }).click();
    await expect(mic(page)).toHaveAttribute('aria-pressed', 'true');
    expect((await runs(page))[0]).toMatchObject({ lang: 'en-US', local: false });
    await expect(page.getByText('via your browser')).toBeVisible();
    await axe(page);
    await page.getByRole('button', { name: 'Stop', exact: true }).click();
    expect((await runs(page))[0].on).toBe(false);
  });

  test('V-2 text: spaces, capitals, paragraphs, undo; never read as HTML', async ({ page }) => {
    await open(page, { agreed: true });
    await listening(page);
    await fake(page, 'result', { results: [{ isFinal: false, 0: { transcript: 'this is' } }] });
    await expect(page.locator('.doc-voice')).toContainText('this is');
    await say(page, 'this is <b>text</b>');
    await say(page, 'and more');
    await say(page, 'New line.');
    await say(page, 'second');
    await expect(page.locator('.doc-content p')).toHaveText(['This is <b>text</b> and more', 'Second']);
    await say(page, 'undo');
    await expect(page.locator('.doc-content p').first()).toHaveText('This is <b>text</b> and more');
    await expect(body(page)).not.toContainText('Second');
    expect((await runs(page)).length).toBeGreaterThan(1); // it went on after each pause
  });

  test('V-3 "formula …" in the text, and dictating inside a formula with lines', async ({ page }) => {
    await open(page, { agreed: true });
    await listening(page);
    await say(page, 'let');
    await say(page, 'formula x squared plus one');
    await say(page, 'be given');
    expect(await fields(page)).toEqual(['x^2+1']);
    await expect(page.locator('.doc-content p').first()).toContainText('Let');
    await expect(page.locator('.doc-content p').first()).toContainText('be given');
    await say(page, 'formula');
    await expect(page.locator('.doc-math math-field').last()).toBeFocused();
    await say(page, 'fraction a plus b over c');
    await say(page, 'equals 2');
    await say(page, 'new line');
    await expect(page.locator('.doc-math math-field').last()).toBeFocused();
    await say(page, 'alpha');
    await say(page, 'end formula');
    await say(page, 'done');
    const f = await fields(page);
    expect(f[1]).toBe('\\frac{a+b}{c}=2');
    expect(f[2]).toBe('\\alpha');
    expect(f).toHaveLength(3);
    await expect(body(page)).toContainText(/done/i);
  });

  test('V-4 errors are explained and switch it off; it does not loop', async ({ page }) => {
    await open(page, { agreed: true });
    await listening(page);
    await fake(page, 'error', { error: 'no-speech' });
    await expect(mic(page)).toHaveAttribute('aria-pressed', 'true');
    await fake(page, 'error', { error: 'not-allowed' });
    await expect(page.getByText('The microphone is blocked.')).toBeVisible();
    await expect(mic(page)).toHaveAttribute('aria-pressed', 'false');
    await listening(page);
    for (let i = 0; i < 6; i++) {
      await fake(page, 'end');
      await page.waitForTimeout(150 * (i + 2));
    }
    await expect(mic(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('V-5 F8, "stop dictation", another document and another language switch it off', async ({ page }) => {
    await open(page, { agreed: true });
    await page.keyboard.press('F8');
    await expect(mic(page)).toHaveAttribute('aria-pressed', 'true');
    await say(page, 'stop dictation');
    await expect(mic(page)).toHaveAttribute('aria-pressed', 'false');
    await listening(page);
    await page.getByRole('tab', { name: 'File' }).click();
    await page.getByRole('button', { name: 'New', exact: true }).click();
    await expect(mic(page)).toHaveAttribute('aria-pressed', 'false');
    await say(page, 'too late');
    await expect(body(page)).not.toContainText(/too late/i);
    await listening(page);
    await page.getByRole('button', { name: /Deutsch|DE/ }).first().click();
    const mikro = page.getByRole('button', { name: 'Spracheingabe (F8)' });
    await expect(mikro).toHaveAttribute('aria-pressed', 'false');
    await mikro.click();
    expect((await runs(page)).at(-1)).toMatchObject({ lang: 'de-DE' });
  });

  test('V-6 with a language pack it stays on the device, without asking', async ({ page }) => {
    await open(page, { pack: 'available' });
    await listening(page);
    expect((await runs(page))[0]).toMatchObject({ local: true });
    await expect(page.getByText('on this device')).toBeVisible();
  });

  test('V-7 no button where the browser has no speech recognition', async ({ page }) => {
    await page.addInitScript(() => Object.assign(window, { webkitSpeechRecognition: undefined, SpeechRecognition: undefined }));
    await page.goto('/doc');
    await expect(body(page)).toBeVisible({ timeout: 20_000 });
    await expect(mic(page)).toHaveCount(0);
  });
});
