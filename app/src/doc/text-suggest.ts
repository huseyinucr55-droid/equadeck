// Suggestions while typing on the page itself, exactly like the list in the
// single-formula editor: type "äqu" (or "summe", "genau dann", "geschweift")
// and a list of symbols opens with the first one chosen. Enter or Tab puts it
// in as a formula, the arrows pick another, Esc or simply typing on keeps the
// word as text. A symbol with boxes to fill in (a fraction) opens the formula;
// a finished one (⇔) lets you go on writing text after it.
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import type { EditorView } from '@tiptap/pm/view';
import { suggestFor, type Suggestion } from '../lib/completions';
import { hideSuggestionBox, showSuggestionBox } from './suggest-box';

const KEY = 'lx.doc.textSuggest';
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
})();
export const textSuggestionsOn = () => enabled;
export function setTextSuggestions(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  if (!on) hideSuggestionBox();
}

// Everyday words that happen to name a symbol (∧ "und", ¬ "nicht", · "mal"):
// alone they are just words in a sentence, so they don't open the list.
// As part of a phrase ("für alle", "es gibt") they still do.
const EVERYDAY = new Set(
  'und oder nicht mal mit für fuer aus auf ist sind sein seien sei wenn dann weil also gilt alle jede jeder eine einer eines dass die der das den dem des and not the for all with then'.split(' '),
);

const L = 'A-Za-zÄÖÜäöüß';
// The last one to three words before the cursor, the last with 3+ letters.
const WORDS = new RegExp(`(?:^|[^${L}])((?:[${L}]+ ){0,2}[${L}]{3,})$`);

export const TextSuggestions = Extension.create({
  name: 'textSuggestions',
  // Before the editor's own keys, so Enter with the list open picks a symbol
  // instead of starting a new paragraph.
  priority: 1000,
  addProseMirrorPlugins() {
    const editor = this.editor;
    let items: Suggestion[] = [];
    let index = 0;
    let range: { from: number; to: number } | null = null;

    const me = {}; // identifies the text's list (formulas have their own)
    const close = () => {
      items = [];
      range = null;
      hideSuggestionBox(me);
    };

    const render = (view: EditorView) => {
      if (!items.length || !range) return close();
      const c = view.coordsAtPos(range.to);
      showSuggestionBox(
        items,
        index,
        new DOMRect(c.left, c.top, 0, c.bottom - c.top),
        (i) => {
          index = i;
          accept();
        },
        me,
      );
    };

    const accept = () => {
      const choice = items[index];
      if (!choice || !range) return;
      const { from, to } = range;
      close();
      editor
        .chain()
        .focus()
        // Its own undo step: Ctrl+Z takes back the symbol, not everything typed before it.
        .command(({ tr }) => {
          closeHistory(tr);
          return true;
        })
        .setTextSelection({ from, to })
        .insertMath(choice.latex, false, !choice.latex.includes('#?'))
        .run();
    };

    const update = (view: EditorView) => {
      const { selection } = view.state;
      if (!enabled || !selection.empty || !view.hasFocus()) return close();
      const $pos = selection.$from;
      if (!$pos.parent.isTextblock) return close();
      // Text before the cursor in this paragraph; formulas count as a word break.
      const before = $pos.parent.textBetween(Math.max(0, $pos.parentOffset - 80), $pos.parentOffset, undefined, '￼');
      const words = WORDS.exec(before)?.[1];
      if (!words) return close();
      const parts = words.split(' ');
      // Longest phrase first: "genau dann" before "dann".
      for (let i = 0; i < parts.length; i++) {
        const phrase = parts.slice(i).join(' ');
        if (phrase.replace(/ /g, '').length < 3) continue;
        if (!phrase.includes(' ') && EVERYDAY.has(phrase.toLowerCase())) continue;
        const found = suggestFor(phrase, 6, true);
        if (found.length) {
          items = found;
          index = 0;
          range = { from: $pos.pos - phrase.length, to: $pos.pos };
          return render(view);
        }
      }
      close();
    };

    return [
      new Plugin({
        key: new PluginKey('textSuggestions'),
        props: {
          handleKeyDown(view, e) {
            if (!items.length) return false;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              index = (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
              render(view);
              return true;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
              accept();
              return true;
            }
            if (e.key === 'Escape') {
              close();
              return true;
            }
            return false;
          },
          handleDOMEvents: {
            blur: () => {
              close();
              return false;
            },
          },
        },
        view: () => ({
          update(view, prev) {
            // Typing changes the list; only moving the cursor closes it.
            if (view.state.doc === prev.doc) {
              if (!view.state.selection.eq(prev.selection)) close();
              return;
            }
            update(view);
          },
          destroy: close,
        }),
      }),
    ];
  },
});
