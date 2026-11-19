// Formulas on the page (phase 2). Each formula is a TipTap node shown as a
// MathLive <math-field>: you type straight into the formula ("/" makes a
// fraction, "^" a power, boxes to fill in), with an on-screen maths keyboard
// on touch screens. The LaTeX is stored in the node, so saving, undo and
// export keep working.
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { MathfieldElement } from 'mathlive';
import 'mathlive/fonts.css';
import { attachSuggestions, typeInto } from './math-suggest';

// Fonts come bundled through fonts.css (no CDN); no keyboard click sounds.
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

/** Ready-made formulas for the Insert tab; #? is a box to fill in. */
export const TEMPLATES = {
  fraction: '\\frac{#?}{#?}',
  root: '\\sqrt{#?}',
  power: '#?^{#?}',
  index: '#?_{#?}',
  integral: '\\int_{#?}^{#?}#?\\,\\mathrm{d}x',
  sum: '\\sum_{#?}^{#?}#?',
  limit: '\\lim_{#?\\to#?}#?',
  matrix: '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}',
  cases: '\\begin{cases}#?&#?\\\\#?&#?\\end{cases}',
} as const;

export function setMathLanguage(lang: string) {
  MathfieldElement.locale = lang;
}

/** "\text{sei }\text{und}" -> "sei und"; null when the formula has any maths in it. */
export function textOnly(latex: string): string | null {
  const rest = latex.replace(/\\text\{[^{}]*\}/g, '').replace(/\\[ ,;:!]|~|\s/g, '');
  if (rest) return null;
  const words = [...latex.matchAll(/\\text\{([^{}]*)\}/g)].map((m) => m[1]).join('');
  return words.replace(/\\textbackslash /g, '\\').replace(/\s+/g, ' ').trim();
}

/** A rows × cols matrix of boxes, with ( ), [ ] or | | around it. */
export function matrixLatex(rows: number, cols: number, kind: 'pmatrix' | 'bmatrix' | 'vmatrix' = 'pmatrix'): string {
  const row = Array.from({ length: cols }, () => '#?').join('&');
  return `\\begin{${kind}}${Array.from({ length: rows }, () => row).join('\\\\')}\\end{${kind}}`;
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
      /** `stayInText`: a finished symbol (⇔) from the text suggestions; keep typing text after it. */
      insertMath: (latex?: string, display?: boolean, stayInText?: boolean) => ReturnType;
    };
  }
}

function focusFieldAt(editor: Editor, pos: number, atStart = false, tries = 6, delay = 0, cancel?: { done: boolean }) {
  // Focus right away so the next key lands in the formula; check again a few
  // times in case the editor's own focus handling (a frame later) took it back.
  // As soon as you press a key or click yourself, the retries stop (otherwise
  // a quick Esc right after "1/" was undone by a late retry).
  if (!cancel) {
    const flag = { done: false };
    const stop = () => {
      flag.done = true;
      editor.view.dom.removeEventListener('keydown', stop, true);
      editor.view.dom.removeEventListener('pointerdown', stop, true);
    };
    editor.view.dom.addEventListener('keydown', stop, true);
    editor.view.dom.addEventListener('pointerdown', stop, true);
    setTimeout(stop, 400); // never longer than all the retries take
    cancel = flag;
  }
  const attempt = () => {
    if (cancel.done) return;
    const dom = editor.view.nodeDOM(pos);
    // Not an element (e.g. a text node in a table cell while the edit is still
    // being applied): nothing to focus yet, try again shortly.
    const mf = dom instanceof HTMLElement ? (dom.querySelector('math-field') as MathfieldElement | null) : null;
    if (mf && document.activeElement !== mf) {
      mf.focus();
      if (atStart) mf.position = 0;
      // Jump to the first empty box of a template.
      else if (mf.value.includes('placeholder')) mf.executeCommand('moveToNextPlaceholder');
      else mf.position = mf.lastOffset;
    }
    // Try again only while the formula hasn't got the focus. Once it has, stop:
    // retrying later pulled you back in after Esc, or after clicking away.
    if (document.activeElement !== mf && tries > 1) focusFieldAt(editor, pos, atStart, tries - 1, 40, cancel);
  };
  if (delay) setTimeout(attempt, delay);
  // Right after the current edit is applied (a command runs before its change
  // is dispatched), still before the next key press.
  else queueMicrotask(attempt);
}

// After Enter in a formula: the keys typed before the new formula line is
// ready (one at a time, so one for the whole page).
let handoff: { keys: string[] } | null = null;
// Keys after a replayed Enter, for the line that Enter makes (if it makes one).
let carry: string[] | null = null;

/** Nothing but spaces (or nothing at all): `\ `, `\,`, `~` … */
export function isBlank(latex: string): boolean {
  // `\ ` trimmed at the end leaves a lone `\`.
  return !latex.replace(/\\(?:[ ,;:!>]|$)|\\q?quad\b|~|\s/g, '');
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
            // Words are handled by the suggestion list (math-suggest.ts). MathLive's
            // own letter shortcuts would fire halfway through a word ("pi" in
            // "spitze", "sum" in "summe"), so only symbol ones like "<=" stay.
            mf.inlineShortcuts = Object.fromEntries(Object.entries(mf.inlineShortcuts).filter(([k]) => !/[a-zA-Z]/.test(k)));
            // No MathLive context menu (right-click / long-press): it laid an
            // invisible layer over the whole page, and if it got stuck no click
            // reached anything any more. The ribbon offers all of it.
            mf.menuItems = [];
          },
          { once: true },
        );
        dom.append(mf);
        // Keys typed right after Enter, before the new line is ready: kept for
        // the new line instead of landing in this one. First of all key
        // handlers, so the suggestions and the space bar don't act on them here.
        mf.addEventListener(
          'keydown',
          (e) => {
            if (!handoff || e.isComposing) return;
            // AltGr (@ { } [ ] \ | on a German keyboard) counts as plain typing.
            const plain = !e.metaKey && (e.getModifierState('AltGraph') || (!e.ctrlKey && !e.altKey));
            if (plain && e.key.length === 1) handoff.keys.push(e.key);
            else if (plain && e.key === 'Enter' && !e.shiftKey) handoff.keys.push('\n');
            else if (e.key === 'Backspace') handoff.keys.pop();
            else return;
            e.preventDefault();
            e.stopImmediatePropagation();
          },
          { capture: true },
        );
        // The same for text that comes without key presses (iPad keyboard).
        mf.addEventListener(
          'beforeinput',
          (e) => {
            const data = (e as InputEvent).data;
            if (!handoff || !e.isTrusted || (e as InputEvent).inputType !== 'insertText' || !data) return;
            handoff.keys.push(...data.replace(/ /g, ' '));
            e.preventDefault();
            e.stopImmediatePropagation();
          },
          { capture: true },
        );
        attachSuggestions(mf);

        let current = node;
        const pos = () => (typeof getPos === 'function' ? getPos() : undefined);

        // An empty formula left by clicking elsewhere (or opening a dialog) goes
        // away too, a moment later, unless you came back to it (a ribbon button
        // briefly takes the focus and then fills the formula).
        mf.addEventListener('blur', () => {
          setTimeout(() => {
            if (document.activeElement === mf || !isBlank(mf.getValue('latex'))) return;
            const at = pos();
            if (at === undefined || editor.isDestroyed) return;
            const here = editor.state.doc.nodeAt(at);
            if (here?.type.name !== current.type.name) return;
            editor.view.dispatch(editor.state.tr.delete(at, at + here.nodeSize).setMeta('addToHistory', false));
          }, 400);
        });

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
          const latex = mf.getValue('latex').trim();
          // An empty formula (or only spaces) disappears when you leave it.
          if (isBlank(latex)) {
            view.dispatch(state.tr.delete(at, at + current.nodeSize));
            view.focus();
            return;
          }
          // Only words ("sei und")? Then it was meant as text: put plain text there.
          const words = textOnly(latex);
          if (words !== null) {
            const content = words ? state.schema.text(words) : null;
            const replacement = display ? state.schema.nodes.paragraph.create(null, content) : content;
            const tr = replacement ? state.tr.replaceWith(at, at + current.nodeSize, replacement) : state.tr.delete(at, at + current.nodeSize);
            const end = at + (replacement ? (display ? replacement.nodeSize - 1 : replacement.nodeSize) : 0);
            view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(end, tr.doc.content.size)))));
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
        // Enter made a new formula line at `at`: focus it as soon as MathLive has
        // it ready (a moment later), then give it what you typed meanwhile.
        const moveToNewLine = (at: number) => {
          // Keys left over from a quick Enter-Enter go on into this new line.
          const mine = { keys: carry ?? [] };
          carry = null;
          handoff = mine;
          const started = Date.now();
          const tryFocus = () => {
            if (handoff !== mine) return;
            const dom = editor.view.nodeDOM(at);
            const next = dom instanceof HTMLElement ? (dom.querySelector('math-field') as MathfieldElement | null) : null;
            // Focused for real only when MathLive's own key input inside it has
            // the focus (the element can look focused a moment before that).
            const ready = () => document.activeElement === next && !!next?.shadowRoot?.activeElement;
            if (next && !ready()) next.focus();
            // Ready, or waited long enough: either way nothing typed gets lost.
            const late = Date.now() - started > 1000;
            if (next && (ready() || late)) {
              handoff = null;
              replay(next, mine.keys);
            } else if (late) handoff = null;
            else setTimeout(tryFocus, 20);
          };
          tryFocus();
        };
        // Type the kept keys into the new line; an Enter among them does what
        // Enter does there, and the rest follows (next line, or the text).
        const replay = (next: MathfieldElement, keys: string[]) => {
          const cut = keys.indexOf('\n');
          const line = (cut < 0 ? keys : keys.slice(0, cut)).join('');
          if (line) typeInto(next, line); // spaces stay gaps
          if (cut < 0) return;
          const rest = keys.slice(cut + 1);
          carry = rest;
          next.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, composed: true }));
          if (carry === null) return; // a new line took them
          carry = null;
          // Enter took a suggestion: still in this line.
          if (document.activeElement === next) return replay(next, rest);
          const text = rest.filter((k) => k !== '\n').join('');
          if (text) editor.commands.insertContent(text);
        };
        // Before MathLive sees the key (capture): with empty boxes left in a matrix
        // it swallowed the first Esc, so you kept typing inside the matrix.
        // The suggestion list (registered earlier) still gets Esc/Enter first.
        mf.addEventListener(
          'keydown',
          (e) => {
            if (handoff || e.isComposing) return;
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopImmediatePropagation();
              leave(true);
            } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
              e.stopImmediatePropagation();
              // Enter: the next line of the calculation, a new formula below.
              // Enter on an empty formula (or only words) goes back to the text.
              const latex = mf.getValue('latex').trim();
              const at = pos();
              if (at === undefined) return;
              // An empty formula line: the text goes on right here, below the
              // formulas above (not back up where the formulas started).
              if (isBlank(latex) && display) {
                const { state, view } = editor;
                const tr = state.tr.replaceWith(at, at + current.nodeSize, state.schema.nodes.paragraph.create());
                view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(at + 1))));
                view.focus();
                return;
              }
              if (isBlank(latex) || textOnly(latex) !== null) return leave(true);
              const $at = editor.state.doc.resolve(at);
              const below = display ? at + current.nodeSize : $at.after($at.depth);
              editor.view.dispatch(editor.state.tr.insert(below, editor.state.schema.nodes.mathBlock.create({ latex: '' })));
              moveToNewLine(below);
            }
          },
          { capture: true },
        );
        // Backspace at the very start of a formula (Delete at its end): an empty
        // formula goes away; otherwise you are back in the text and the letter
        // before (after) the formula is deleted, as you'd expect.
        mf.addEventListener(
          'keydown',
          (e) => {
            const back = e.key === 'Backspace';
            if ((!back && e.key !== 'Delete') || !mf.selectionIsCollapsed) return;
            const atEdge = back ? mf.position === 0 : mf.position === mf.lastOffset;
            if (!atEdge) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            const empty = !mf.getValue('latex').trim();
            leave(!back);
            if (empty || display) return;
            editor.commands.command(({ tr, state }) => {
              const $p = state.selection.$from;
              const neighbour = back ? $p.nodeBefore : $p.nodeAfter;
              if (!neighbour?.isText) return false;
              tr.delete(back ? $p.pos - 1 : $p.pos, back ? $p.pos : $p.pos + 1);
              return true;
            });
          },
          { capture: true },
        );

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
          (latex = '', asBlock = false, stayInText = false) =>
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
            if (at >= 0 && !stayInText) focusFieldAt(editor, at);
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
        // One key press removes a formula, page break or line next to the cursor
        // (the editor's default first selects it and needs a second press).
        Backspace: () => deleteAdjacentAtom(this.editor, false),
        Delete: () => deleteAdjacentAtom(this.editor, true),
      };
    },
  });
}

const ATOMS = new Set(['mathInline', 'mathBlock', 'pageBreak', 'horizontalRule']);

/**
 * Backspace (or Delete) right next to a formula, page break or line removes it
 * at once. Inline formulas sit in the text; block ones (own-line formula, page
 * break, line) are the block before (after) the paragraph the cursor starts
 * (ends).
 */
function deleteAdjacentAtom(editor: Editor, forward: boolean): boolean {
  const { state, view } = editor;
  const { selection } = state;
  if (!selection.empty) return false;
  const $pos = selection.$from;
  // In the text: the inline node just before / after the cursor.
  const inline = forward ? $pos.nodeAfter : $pos.nodeBefore;
  if (inline && ATOMS.has(inline.type.name)) {
    const from = forward ? $pos.pos : $pos.pos - inline.nodeSize;
    view.dispatch(state.tr.delete(from, from + inline.nodeSize).scrollIntoView());
    return true;
  }
  // At the start (end) of a paragraph: the block before (after) it.
  const atEdge = forward ? $pos.parentOffset === $pos.parent.content.size : $pos.parentOffset === 0;
  if (!atEdge || $pos.depth < 1) return false;
  const blockPos = forward ? $pos.after() : $pos.before();
  const $block = state.doc.resolve(blockPos);
  const neighbour = forward ? $block.nodeAfter : $block.nodeBefore;
  if (!neighbour || !ATOMS.has(neighbour.type.name)) return false;
  const from = forward ? blockPos : blockPos - neighbour.nodeSize;
  view.dispatch(state.tr.delete(from, from + neighbour.nodeSize).scrollIntoView());
  return true;
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
