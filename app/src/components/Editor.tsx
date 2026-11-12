import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorSelection, EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, redo, redoDepth, undo, undoDepth } from '@codemirror/commands';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { tags } from '@lezer/highlight';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { applyTemplate } from '../lib/insert';
import { latexCompletions } from '../lib/completions';

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

export const Editor = forwardRef<EditorHandle, Props>(function Editor({ initialValue, onChange, onHistory, describedBy }, ref) {
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
          keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap]),
          StreamLanguage.define(stex),
          syntaxHighlighting(highlight),
          EditorView.lineWrapping,
          placeholder('Type LaTeX here, like \\frac{a}{b}'),
          EditorView.contentAttributes.of({ 'aria-label': 'LaTeX source', spellcheck: 'false', autocapitalize: 'off' }),
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
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor owns its document after mount; initialValue is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
