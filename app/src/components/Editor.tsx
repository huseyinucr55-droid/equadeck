import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Compartment, EditorSelection, EditorState, RangeSetBuilder, StateEffect } from '@codemirror/state';
import { useT, type TFn } from '../lib/i18n';
import { Decoration, EditorView, ViewPlugin, WidgetType, keymap, placeholder, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { useEngine } from '../lib/mathjax';
import { defaultKeymap, history, historyKeymap, redo, redoDepth, undo, undoDepth } from '@codemirror/commands';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { tags } from '@lezer/highlight';
import { autocompletion, completionKeymap, startCompletion } from '@codemirror/autocomplete';
import { applyTemplate } from '../lib/insert';
import { hashCommand, latexCompletions, spaceCommand, symbolName, toReadable } from '../lib/completions';

// --- "für alle#" -> \forall ----------------------------------------------
// Typing # after words that name a command replaces the words with it.
// Unknown words keep their #; a name that fits several commands opens the list.
// A space works too for unambiguous meanings ("integral ", "für alle ").
const hashShortcut = EditorView.inputHandler.of((view, from, to, text) => {
  if ((text !== '#' && text !== ' ') || from !== to) return false;
  const line = view.state.doc.lineAt(from);
  const before = line.text.slice(0, from - line.from);
  const hit = text === '#' ? hashCommand(before) : spaceCommand(before);
  if (!hit) return false;
  const start = line.from + hit.start;
  if ('ambiguous' in hit) {
    startCompletion(view);
    return true;
  }
  const { text: insert, cursor } = applyTemplate(toReadable(hit.tpl), '');
  view.dispatch({
    changes: { from: start, to, insert },
    selection: { anchor: start + cursor },
    scrollIntoView: true,
    userEvent: 'input.complete',
  });
  return true;
});

// --- Symbols shown as symbols --------------------------------------------
// "\forall " (or "\FürAlle ") shows as ∀ in the editor and is deleted with
// one Backspace. The text underneath stays LaTeX, so copying still works.
let drawLabel: ((tex: string) => string) | null = null;
const redrawSymbols = StateEffect.define<null>();

class SymbolWidget extends WidgetType {
  constructor(
    readonly svg: string,
    readonly source: string,
  ) {
    super();
  }
  eq(other: SymbolWidget) {
    return other.svg === this.svg;
  }
  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-symbol';
    el.title = this.source;
    el.innerHTML = this.svg;
    return el;
  }
}

function symbolDecorations(view: EditorView): DecorationSet {
  const out = new RangeSetBuilder<Decoration>();
  if (!drawLabel) return out.finish();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    // A command followed by a space: it is finished, so show what it means.
    for (const m of text.matchAll(/\\([A-Za-zÄÖÜäöüß]+) /g)) {
      const at = from + (m.index ?? 0);
      if (text[(m.index ?? 0) - 1] === '\\') continue; // "\\in" is a line break, then "in"
      const real = symbolName(m[1]);
      const svg = real && drawLabel(`\\${real}`);
      if (svg) out.add(at, at + m[0].length, Decoration.replace({ widget: new SymbolWidget(svg, m[0].trim()) }));
    }
  }
  return out.finish();
}

const symbols = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = symbolDecorations(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged || u.transactions.some((t) => t.effects.some((e) => e.is(redrawSymbols)))) {
        this.decorations = symbolDecorations(u.view);
      }
    }
  },
  {
    decorations: (p) => p.decorations,
    // Atomic: the cursor jumps over a symbol and Backspace removes all of it.
    provide: (p) => EditorView.atomicRanges.of((view) => view.plugin(p)?.decorations ?? Decoration.none),
  },
);

export type EditorHandle = {
  insertTemplate: (tpl: string) => void;
  replaceAll: (text: string, cursor?: number) => void;
  insertAtCursor: (text: string, cursor: number) => void;
  undo: () => void;
  redo: () => void;
  focus: () => void;
};

type Props = {
  initialValue: string;
  onChange: (value: string) => void;
  onHistory: (h: { canUndo: boolean; canRedo: boolean }) => void;
  describedBy?: string;
};

const highlight = HighlightStyle.define([
  { tag: [tags.tagName, tags.keyword], color: 'var(--lx-color-accent)' },
  { tag: [tags.bracket, tags.squareBracket, tags.brace], color: 'var(--lx-color-text-muted)' },
  { tag: tags.comment, color: 'var(--lx-color-text-muted)', fontStyle: 'italic' },
  { tag: [tags.number, tags.atom], color: 'var(--lx-color-success)' },
]);

/** The only language-dependent parts of the editor: its placeholder and accessible name. */
const texts = (t: TFn) => [
  placeholder(t('Type LaTeX here, like \\frac{a}{b}')),
  EditorView.contentAttributes.of({ 'aria-label': t('LaTeX source'), spellcheck: 'false', autocapitalize: 'off' }),
];

export const Editor = forwardRef<EditorHandle, Props>(function Editor({ initialValue, onChange, onHistory, describedBy }, ref) {
  const t = useT();
  const textsBox = useRef(new Compartment());
  const tRef = useRef(t);
  tRef.current = t;
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cbs = useRef({ onChange, onHistory });
  cbs.current = { onChange, onHistory };

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          history(),
          autocompletion({ override: [latexCompletions], icons: false }),
          hashShortcut,
          symbols,
          keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap]),
          StreamLanguage.define(stex),
          syntaxHighlighting(highlight),
          EditorView.lineWrapping,
          textsBox.current.of(texts(tRef.current)),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cbs.current.onChange(u.state.doc.toString());
            if (u.transactions.length) {
              cbs.current.onHistory({ canUndo: undoDepth(u.state) > 0, canRedo: redoDepth(u.state) > 0 });
            }
          }),
        ],
      }),
    });
    view.current = v;
    // Tests read the real text through this (the screen shows symbols instead).
    (host.current as HTMLDivElement & { lxDoc?: () => string }).lxDoc = () => v.state.doc.toString();
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor owns its document after mount; initialValue is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    view.current?.dispatch({ effects: textsBox.current.reconfigure(texts(t)) });
  }, [t]);

  // Symbols are drawn by MathJax, which loads after the editor.
  const engine = useEngine();
  useEffect(() => {
    drawLabel = engine ? engine.renderLabel : null;
    view.current?.dispatch({ effects: redrawSymbols.of(null) });
  }, [engine]);

  useEffect(() => {
    if (describedBy) view.current?.contentDOM.setAttribute('aria-describedby', describedBy);
    else view.current?.contentDOM.removeAttribute('aria-describedby');
  }, [describedBy]);

  useImperativeHandle(ref, () => ({
    insertTemplate(tpl) {
      const v = view.current;
      if (!v) return;
      v.dispatch(
        v.state.changeByRange((range) => {
          const selected = v.state.sliceDoc(range.from, range.to);
          const { text, cursor } = applyTemplate(tpl, selected);
          return {
            changes: { from: range.from, to: range.to, insert: text },
            range: EditorSelection.cursor(range.from + cursor),
          };
        }),
        { scrollIntoView: true, userEvent: 'input' },
      );
      v.focus();
    },
    insertAtCursor(text, cursor) {
      const v = view.current;
      if (!v) return;
      const { from, to } = v.state.selection.main;
      v.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + cursor }, scrollIntoView: true, userEvent: 'input' });
      v.focus();
    },
    replaceAll(text, cursor) {
      const v = view.current;
      if (!v) return;
      v.dispatch({
        changes: { from: 0, to: v.state.doc.length, insert: text },
        selection: { anchor: cursor ?? text.length },
        userEvent: 'input',
      });
      v.focus();
    },
    undo() {
      if (view.current) undo(view.current);
      view.current?.focus();
    },
    redo() {
      if (view.current) redo(view.current);
      view.current?.focus();
    },
    focus() {
      view.current?.focus();
    },
  }));

  return <div ref={host} id="editor" />;
});
