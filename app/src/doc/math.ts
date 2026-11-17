// Formulas on the page (phase 2). Each formula is a TipTap node shown as a
// MathLive <math-field>: you type straight into the formula ("/" makes a
// fraction, "^" a power, boxes to fill in), with an on-screen maths keyboard
// on touch screens. The LaTeX is stored in the node, so saving, undo and
// export keep working.
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { MathfieldElement } from 'mathlive';
import 'mathlive/fonts.css';

// Fonts come bundled through fonts.css (no CDN); no keyboard click sounds.
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

/** German (and a few English) words typed inside a formula that become symbols. */
export const WORD_SHORTCUTS: Record<string, string> = {
  summe: '\\sum',
  produkt: '\\prod',
  integral: '\\int',
  unendlich: '\\infty',
  wurzel: '\\sqrt{#?}',
  limes: '\\lim',
  elementvon: '\\in',
  keinelementvon: '\\notin',
  füralle: '\\forall',
  fueralle: '\\forall',
  esexistiert: '\\exists',
  teilmenge: '\\subseteq',
  vereinigt: '\\cup',
  geschnitten: '\\cap',
  leeremenge: '\\emptyset',
  ungleich: '\\neq',
  kleinergleich: '\\leq',
  größergleich: '\\geq',
  groessergleich: '\\geq',
  ungefähr: '\\approx',
  ungefaehr: '\\approx',
  folgt: '\\Rightarrow',
  genaudann: '\\Leftrightarrow',
  partiell: '\\partial',
  mal: '\\cdot',
};

/**
 * MathLive's own shortcuts plus the German words. Built-in ones that are the
 * start of a German word ("sum" in "summe", "int" in "integral") would fire
 * halfway through typing it, so they make way.
 */
function withGermanWords<T extends object>(builtIn: Readonly<Record<string, T | string>>): Record<string, T | string> {
  const words = Object.keys(WORD_SHORTCUTS);
  const kept = Object.fromEntries(Object.entries(builtIn).filter(([k]) => !words.some((w) => w !== k && w.startsWith(k))));
  return { ...kept, ...WORD_SHORTCUTS };
}

/** Ready-made formulas for the Insert tab; #? is a box to fill in. */
export const TEMPLATES = {
  fraction: '\\frac{#?}{#?}',
  root: '\\sqrt{#?}',
  power: '#?^{#?}',
  integral: '\\int_{#?}^{#?}#?\\,\\mathrm{d}x',
  sum: '\\sum_{#?}^{#?}#?',
  limit: '\\lim_{#?\\to#?}#?',
  matrix: '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}',
  cases: '\\begin{cases}#?&#?\\\\#?&#?\\end{cases}',
} as const;

export function setMathLanguage(lang: string) {
  MathfieldElement.locale = lang;
}

/** The formula the user is typing in right now, if any. */
export function activeMathField(): MathfieldElement | null {
  const host = document.activeElement;
  return host instanceof MathfieldElement ? host : null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      /** Insert a formula at the cursor (in the text, or on its own line) and start typing in it. */
      insertMath: (latex?: string, display?: boolean) => ReturnType;
    };
  }
}

function focusFieldAt(editor: Editor, pos: number, atStart = false, tries = 6, delay = 0) {
  // Focus right away so the next key lands in the formula; check again a few
  // times in case the editor's own focus handling (a frame later) took it back.
  const attempt = () => {
    const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
    const mf = dom?.querySelector('math-field') as MathfieldElement | null;
    if (mf && document.activeElement !== mf) {
      mf.focus();
      if (atStart) mf.position = 0;
      // Jump to the first empty box of a template.
      else if (mf.value.includes('placeholder')) mf.executeCommand('moveToNextPlaceholder');
      else mf.position = mf.lastOffset;
    }
    if (tries > 1) focusFieldAt(editor, pos, atStart, tries - 1, 40);
  };
  if (delay) setTimeout(attempt, delay);
  else attempt();
}

function makeNode(name: 'mathInline' | 'mathBlock', display: boolean) {
  return Node.create({
    name,
    group: display ? 'block' : 'inline',
    inline: !display,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
      return { latex: { default: '' } };
    },

    parseHTML() {
      return [
        {
          tag: display ? 'div[data-math="block"]' : 'span[data-math="inline"]',
          getAttrs: (el) => ({ latex: (el as HTMLElement).getAttribute('data-latex') ?? '' }),
        },
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      const latex = node.attrs.latex as string;
      return [
        display ? 'div' : 'span',
        mergeAttributes(HTMLAttributes, { 'data-math': display ? 'block' : 'inline', 'data-latex': latex }),
        display ? `\\[${latex}\\]` : `\\(${latex}\\)`,
      ];
    },

    addNodeView() {
      return ({ node, getPos, editor }) => {
        const dom = document.createElement(display ? 'div' : 'span');
        dom.className = display ? 'doc-math doc-math-block' : 'doc-math doc-math-inline';
        const mf = new MathfieldElement();
        // Before the field is on the page only its text and attributes can be set;
        // the rest waits for MathLive's "mount" event.
        mf.textContent = node.attrs.latex as string;
        mf.setAttribute('math-virtual-keyboard-policy', 'auto');
        mf.setAttribute('aria-label', document.documentElement.lang === 'de' ? 'Formel' : 'Formula');
        mf.addEventListener(
          'mount',
          () => {
            mf.smartFence = true;
            mf.inlineShortcuts = withGermanWords(mf.inlineShortcuts);
          },
          { once: true },
        );
        dom.append(mf);

        let current = node;
        const pos = () => (typeof getPos === 'function' ? getPos() : undefined);

        // Typing in the formula updates the stored LaTeX (one undo step per change).
        mf.addEventListener('input', () => {
          const at = pos();
          if (at === undefined) return;
          const latex = mf.getValue('latex');
          if (latex === current.attrs.latex) return;
          editor.view.dispatch(editor.state.tr.setNodeMarkup(at, undefined, { ...current.attrs, latex }));
        });

        // Arrow keys at the edge of the formula move back into the text.
        const leave = (forward: boolean) => {
          const at = pos();
          if (at === undefined) return;
          const { state, view } = editor;
          // An empty formula disappears when you leave it.
          if (!mf.getValue('latex').trim()) {
            view.dispatch(state.tr.delete(at, at + current.nodeSize));
            view.focus();
            return;
          }
          const target = forward ? at + current.nodeSize : at;
          view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(target), forward ? 1 : -1)));
          view.focus();
        };
        mf.addEventListener('move-out', (e) => {
          e.preventDefault();
          leave((e as CustomEvent<{ direction: string }>).detail.direction !== 'backward');
        });
        mf.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            leave(true);
          }
        });

        return {
          dom,
          update(updated) {
            if (updated.type !== current.type) return false;
            current = updated;
            const latex = updated.attrs.latex as string;
            // While you type in the formula it is the source of truth (resetting it
            // would break a half-typed word like "summ…"); otherwise, e.g. after
            // undo, show what the document says.
            if (document.activeElement !== mf && mf.getValue('latex') !== latex) mf.setValue(latex, { silenceNotifications: true });
            return true;
          },
          selectNode() {
            dom.classList.add('is-selected');
          },
          deselectNode() {
            dom.classList.remove('is-selected');
          },
          // Keys and clicks inside the formula belong to MathLive, not to the page.
          stopEvent: (event) => mf.contains(event.target as globalThis.Node) || event.target === mf,
          ignoreMutation: () => true,
          destroy() {
            mf.remove();
          },
        };
      };
    },

    addCommands() {
      if (display) return {};
      return {
        insertMath:
          (latex = '', asBlock = false) =>
          ({ editor, tr, dispatch }) => {
            const type = editor.schema.nodes[asBlock ? 'mathBlock' : 'mathInline'];
            // "#?" marks a box to fill in.
            const node = type.create({ latex: latex.replace(/#\?/g, '\\placeholder{}') });
            if (!dispatch) return true;
            tr.replaceSelectionWith(node);
            // The new formula is the last one of its kind before the cursor.
            let at = -1;
            tr.doc.descendants((n, p) => {
              if (n === node) at = p;
              return at < 0;
            });
            dispatch(tr);
            if (at >= 0) focusFieldAt(editor, at);
            return true;
          },
      };
    },

    addKeyboardShortcuts(): Record<string, () => boolean> {
      if (display) return {};
      return {
        // Alt+= like in Word, and Ctrl+M: start a formula here.
        'Alt-=': () => this.editor.commands.insertMath(),
        'Mod-m': () => this.editor.commands.insertMath(),
        // Arrow into a formula from the text.
        ArrowRight: () => enterAdjacent(this.editor, true),
        ArrowLeft: () => enterAdjacent(this.editor, false),
      };
    },
  });
}

/** With the cursor right next to a formula, an arrow key steps into it. */
function enterAdjacent(editor: Editor, forward: boolean): boolean {
  const { selection } = editor.state;
  if (!selection.empty) return false;
  const $pos = selection.$from;
  const node = forward ? $pos.nodeAfter : $pos.nodeBefore;
  if (!node || (node.type.name !== 'mathInline' && node.type.name !== 'mathBlock')) return false;
  const at = forward ? $pos.pos : $pos.pos - node.nodeSize;
  focusFieldAt(editor, at, forward);
  return true;
}

export const MathInline = makeNode('mathInline', false);
export const MathBlock = makeNode('mathBlock', true);
