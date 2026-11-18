// Maths typed straight into the text becomes a formula by itself:
//   x^  -> x with a box up high       a_  -> a with a box below
//   1/  -> a fraction 1 over a box    x/  -> x over a box
//   =>  -> ⇒   <=> -> ⇔   ->  -> →   !=  -> ≠   <=  -> ≤   >=  -> ≥
// Only short maths-like pieces count (a letter, a number, a letter with a
// digit), so words like "und/oder" or "km/h" stay text. A switch in the View
// tab turns it off.
import { Extension, type Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';

const KEY = 'lx.doc.autoMath';
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
})();
export const autoMathOn = () => enabled;
export function setAutoMath(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

// A letter, a number, or a letter with a digit (x, 12, a1), not the end of a word.
const TOKEN = /(?:^|[^A-Za-zÄÖÜäöüß0-9\\])([A-Za-z]|[0-9]+(?:[.,][0-9]+)?|[A-Za-z][0-9])$/;

/** Two-character signs: what was typed before, and the key that completes it. */
const SIGNS: { before: string; key: string; latex: string }[] = [
  { before: '=', key: '>', latex: '\\Rightarrow' },
  { before: '-', key: '>', latex: '\\to' },
  { before: '!', key: '=', latex: '\\neq' },
  { before: '<', key: '=', latex: '\\leq' },
  { before: '>', key: '=', latex: '\\geq' },
];

function insert(editor: Editor, from: number, to: number, latex: string, stayInText: boolean) {
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      closeHistory(tr); // its own undo step
      return true;
    })
    .setTextSelection({ from, to })
    .insertMath(latex, false, stayInText)
    .run();
  // What you type next is a new undo step too (not merged with the sign).
  editor.view.dispatch(closeHistory(editor.state.tr));
}

export const AutoMath = Extension.create({
  name: 'autoMath',
  priority: 900,
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey('autoMath'),
        props: {
          handleTextInput(view, from, to, text) {
            if (!enabled || from !== to || text.length !== 1) return false;
            const $pos = view.state.doc.resolve(from);
            if (!$pos.parent.isTextblock || $pos.parent.type.spec.code) return false;
            const before = $pos.parent.textBetween(Math.max(0, $pos.parentOffset - 20), $pos.parentOffset, undefined, '￼');

            // "<=" then ">": the ≤ formula just made becomes ⇔.
            if (text === '>' && $pos.nodeBefore?.type.name === 'mathInline' && $pos.nodeBefore.attrs.latex === '\\leq') {
              insert(editor, from - $pos.nodeBefore.nodeSize, from, '\\Leftrightarrow', true);
              return true;
            }
            for (const s of SIGNS) {
              if (text === s.key && before.endsWith(s.before)) {
                insert(editor, from - s.before.length, from, s.latex, true);
                return true;
              }
            }

            if (text !== '^' && text !== '_' && text !== '/') return false;
            const token = TOKEN.exec(before)?.[1];
            if (!token) return false;
            // A fraction only after a number or a single letter ("1/", "x/").
            if (text === '/' && !/^([0-9]+|[A-Za-z])$/.test(token)) return false;
            const latex =
              text === '^' ? `${token}^{#?}` : text === '_' ? `${token}_{#?}` : `\\frac{${token}}{#?}`;
            insert(editor, from - token.length, from, latex, false);
            return true;
          },
        },
      }),
    ];
  },
});
