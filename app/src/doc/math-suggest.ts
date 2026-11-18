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
  // A space typed in maths, waiting to see what comes next.
  let pendingSpace = false;

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
    // A space right before the word goes too: "x ⇔ y" not "x  ⇔ y" (signs
    // bring their own spacing).
    const start = mf.position - matched;
    const spaceBefore = start > 0 && /^\\\s*$/.test(mf.getValue(start - 1, start, 'latex'));
    replaceBeforeCaret(matched + (spaceBefore ? 1 : 0), choice.latex, 'placeholder');
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
          // Maths ignores the space bar. Remember it and put in a visible space
          // only if a number, letter or bracket follows ("1 2", "x y"); before
          // = + ⇔ … the sign brings its own spacing (no double gaps).
          stop();
          pendingSpace = true;
          boundary = mf.position; // the next letters start a new word: "x span"
        }
        return;
      }
      if (pendingSpace) {
        pendingSpace = false;
        // Right after = + − < ⇔ ≤ … the sign already has its spacing.
        const prev = mf.getValue(Math.max(0, mf.position - 1), mf.position, 'latex').trim();
        const afterSign = /^[=+\-<>*/]$|^\\(Leftrightarrow|Rightarrow|Leftarrow|leftrightarrow|rightarrow|leftarrow|to|le|leq|ge|geq|ne|neq|approx|equiv|in|notin|subseteq|subset|supseteq|cup|cap|cdot|times|pm|mp|div|land|lor|mid|sim|cong|coloneq)\b/.test(prev);
        if (!afterSign && k.length === 1 && /[\p{L}\p{N}(\[|]/u.test(k) && !e.ctrlKey && !e.metaKey && mf.mode === 'math') {
          mf.insert('\\ ', { mode: 'math', format: 'latex', focus: true });
          boundary = mf.position;
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
