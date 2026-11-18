// Suggestions while typing in a formula on the page, like the list in the
// single-formula editor: type a word ("summe", "äquivalent", "geschweift"),
// a list opens with the first entry chosen, Enter or Tab takes it, the arrow
// keys pick another, Esc closes the list. A word followed by a space becomes
// normal text instead ("für alle x gilt").
//
// The word is read from the formula itself (the letters right before the
// caret), not from key presses, so it also works with the iPad keyboard,
// MathLive's own keyboard and umlauts typed without a key event.
import type { MathfieldElement } from 'mathlive';
import { suggestFor, type Suggestion } from '../lib/completions';
import { hideSuggestionBox, showSuggestionBox } from './suggest-box';

const WORD_BEFORE_CARET = /(?:^|[^\\A-Za-zÄÖÜäöüß])([A-Za-zÄÖÜäöüß]+)$/;

export function attachSuggestions(mf: MathfieldElement) {
  let items: Suggestion[] = [];
  let index = 0;
  let matched = 0; // how many letters before the caret the suggestions replace

  // Maths ignores spaces, so "x span" would read as one word "xspan". A space
  // typed after a short variable is remembered here as a word boundary.
  let boundary = -1;

  /** Letters right before the caret, as typed (not part of a \command or text). */
  const currentWord = (): string => {
    if (mf.mode !== 'math') return '';
    const pos = mf.position;
    const start = boundary >= 0 && boundary <= pos ? boundary : 0;
    const before = mf.getValue(start, pos, 'latex');
    return WORD_BEFORE_CARET.exec(before)?.[1] ?? '';
  };

  const close = () => {
    items = [];
    hideSuggestionBox(mf);
  };

  const render = () => {
    if (!items.length) return close();
    // Under the caret (MathLive draws it inside its shadow DOM), else under the field.
    const caret = mf.shadowRoot?.querySelector('.ML__caret, .ML__text-caret');
    showSuggestionBox(
      items,
      index,
      (caret ?? mf).getBoundingClientRect(),
      (i) => {
        index = i;
        accept();
      },
      mf,
    );
  };

  /** "Aäquivalent": the variable A, then the word "äquivalent" — try the longest tail that means something. */
  const update = () => {
    const word = currentWord();
    items = [];
    matched = 0;
    for (let i = 0; i <= word.length - 3; i++) {
      const found = suggestFor(word.slice(i));
      if (found.length) {
        items = found;
        matched = word.length - i;
        break;
      }
    }
    index = 0;
    render();
  };

  const replaceBeforeCaret = (count: number, latex: string, selectionMode: 'placeholder' | 'after') => {
    const end = mf.position;
    mf.selection = { ranges: [[end - count, end]] };
    mf.insert(latex, { insertionMode: 'replaceSelection', selectionMode, mode: 'math', format: 'latex', focus: true });
  };

  /** Put the chosen symbol in place of the word (its boxes to fill in come next). */
  function accept() {
    const choice = items[index];
    if (!choice) return;
    replaceBeforeCaret(matched, choice.latex, 'placeholder');
    close();
  }

  /** "für" + space: the word is text, not the variables f·ü·r. Then back to maths. */
  function wordToText(word: string) {
    replaceBeforeCaret(word.length, `\\text{${word} }`, 'after');
    // Back to maths, so "(", "x", a matrix … after the word are maths again.
    mf.mode = 'math';
    close();
  }

  mf.addEventListener(
    'keydown',
    (e) => {
      const k = e.key;
      const stop = () => {
        e.preventDefault();
        e.stopImmediatePropagation();
      };
      if (items.length) {
        if (k === 'ArrowDown' || k === 'ArrowUp') {
          stop();
          index = (index + (k === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          render();
          return;
        }
        if (k === 'Enter' || k === 'Tab') {
          stop();
          accept();
          return;
        }
        if (k === 'Escape') {
          stop();
          close();
          return;
        }
      }
      if (k === ' ' && !e.ctrlKey && !e.metaKey) {
        const word = currentWord();
        if (word.length >= 3) {
          stop();
          wordToText(word);
        } else if (mf.mode === 'math') {
          boundary = mf.position; // "x " — the next letters start a new word
        }
      }
    },
    { capture: true },
  );
  // Typing changes the word; moving the caret or leaving closes the list.
  let typing = false;
  mf.addEventListener('input', () => {
    typing = true;
    update();
    queueMicrotask(() => (typing = false));
  });
  mf.addEventListener('selection-change', () => {
    if (!typing) close();
  });
  // Moving the caret yourself (click, arrows) forgets the remembered space.
  mf.addEventListener('pointerdown', () => (boundary = -1));
  mf.addEventListener('keydown', (e) => {
    if (/^(Arrow|Home|End|Page)/.test(e.key)) boundary = -1;
  });
  mf.addEventListener('blur', close);
}
