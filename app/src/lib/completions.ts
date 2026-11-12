// Autocomplete for LaTeX commands, built from the palette data plus a few
// commands the palette doesn't have a key for.
import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { EditorView } from '@codemirror/view';
import { ALL_SYMBOLS } from '../data/symbols';
import { applyTemplate } from './insert';

const EXTRA: [string, string, string][] = [
  ['\\begin{aligned}', '\\begin{aligned} #0 \\end{aligned}', 'aligned lines'],
  ['\\begin{cases}', '\\begin{cases} #0 \\end{cases}', 'cases'],
  ['\\begin{pmatrix}', '\\begin{pmatrix} #0 \\end{pmatrix}', 'matrix'],
  ['\\left(', '\\left( #0 \\right)', 'growing parentheses'],
  ['\\dfrac', '\\dfrac{#0}{}', 'display fraction'],
  ['\\mathrm', '\\mathrm{#0}', 'upright'],
  ['\\textcolor', '\\textcolor{}{#0}', 'colour'],
  ['\\color', '\\color{#0}', 'colour'],
  ['\\ce', '\\ce{#0}', 'chemistry'],
  ['\\pu', '\\pu{#0}', 'units'],
  ['\\dv', '\\dv{#0}{}', 'derivative'],
  ['\\pdv', '\\pdv{#0}{}', 'partial derivative'],
  ['\\vb', '\\vb{#0}', 'bold vector'],
  ['\\abs', '\\abs{#0}', 'absolute value'],
  ['\\norm', '\\norm{#0}', 'norm'],
  ['\\ket', '\\ket{#0}', 'ket'],
  ['\\bra', '\\bra{#0}', 'bra'],
  ['\\bbox', '\\bbox[yellow]{#0}', 'highlight'],
];

function applyTpl(tpl: string) {
  return (view: EditorView, _c: Completion, from: number, to: number) => {
    const { text, cursor } = applyTemplate(tpl, '');
    view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + cursor }, userEvent: 'input.complete' });
  };
}

const OPTIONS: Completion[] = (() => {
  const seen = new Set<string>();
  const out: Completion[] = [];
  const add = (label: string, tpl: string, detail: string) => {
    if (seen.has(label)) return;
    seen.add(label);
    out.push({ label, detail, apply: applyTpl(tpl), type: 'keyword' });
  };
  for (const s of ALL_SYMBOLS) {
    const m = s.insert.match(/^\\[a-zA-Z]+/);
    if (m) add(m[0], s.insert, s.name);
  }
  for (const [label, tpl, detail] of EXTRA) add(label, tpl, detail);
  return out;
})();

export function latexCompletions(ctx: CompletionContext): CompletionResult | null {
  const word = ctx.matchBefore(/\\[a-zA-Z]*/);
  if (!word || (word.from === word.to && !ctx.explicit)) return null;
  return { from: word.from, options: OPTIONS, validFor: /^\\[a-zA-Z{(]*$/ };
}
