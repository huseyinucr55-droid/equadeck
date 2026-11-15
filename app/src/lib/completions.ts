// Autocomplete for LaTeX commands, built from the palette data plus a few
// commands the palette doesn't have a key for.
//
// Readable commands: every command can also be written by what it means, in
// German or English: \ElementVon or \ElementOf for \in, \Unendlich for
// \infty, \Bruch{1}{2} for \frac{1}{2}. resolveAliases() turns them back
// into real LaTeX before rendering and copying.
import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { EditorView } from '@codemirror/view';
import { ALL_SYMBOLS } from '../data/symbols';
import { applyTemplate } from './insert';
import { getLang, tr, type Lang } from './i18n';

const EXTRA: [string, string, string][] = [
  ['\\begin{aligned}', '\\begin{aligned} #0 \\end{aligned}', 'aligned lines'],
  ['\\begin{cases}', '\\begin{cases} #0 \\end{cases}', 'cases'],
  ['\\begin{pmatrix}', '\\begin{pmatrix} #0 \\end{pmatrix}', 'matrix'],
  ['\\left(', '\\left( #0 \\right)', 'growing parentheses'],
  ['\\dfrac', '\\dfrac{#0}{}', 'display fraction'],
  ['\\mathrm', '\\mathrm{#0}', 'upright'],
  ['\\textcolor', '\\textcolor{}{#0}', 'colour'],
  ['\\color', '\\color{#0}', 'colour from here'],
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

type Cmd = { label: string; name: string; tpl: string; meaning: string };

/** Every command once: label "\in", name "in", template, English meaning. */
const COMMANDS: Cmd[] = (() => {
  const seen = new Set<string>();
  const out: Cmd[] = [];
  const add = (label: string, tpl: string, meaning: string) => {
    if (seen.has(label)) return;
    seen.add(label);
    out.push({ label, name: label.slice(1).match(/^[a-zA-Z]+/)?.[0] ?? '', tpl, meaning });
  };
  for (const s of ALL_SYMBOLS) {
    const m = s.insert.match(/^\\[a-zA-Z]+/);
    if (m) add(m[0], s.insert, s.name);
  }
  for (const [label, tpl, meaning] of EXTRA) add(label, tpl, meaning);
  return out;
})();

const LETTERS = 'A-Za-zÄÖÜäöüß';
/** "element of" -> "ElementOf", "größer gleich" -> "GrößerGleich". */
const camel = (text: string) =>
  text
    .split(new RegExp(`[^${LETTERS}]+`))
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');

const REAL_NAMES = new Set(COMMANDS.map((c) => c.name));

/** Readable name for a command in a language, or null when it adds nothing. */
function aliasOf(c: Cmd, lang: Lang): string | null {
  if (!c.name || c.label.includes('{') || c.label.includes('(')) return null; // \begin{…}, \left(
  const alias = camel(tr(c.meaning, lang));
  if (!alias || alias.toLowerCase() === c.name.toLowerCase()) return null; // \alpha is already readable
  return alias;
}

/** lower-case alias -> real command name, for both languages. */
const ALIASES = (() => {
  const map = new Map<string, string>();
  for (const lang of ['de', 'en'] as Lang[]) {
    for (const c of COMMANDS) {
      const alias = aliasOf(c, lang);
      if (!alias) continue;
      const key = alias.toLowerCase();
      // Never shadow a real command, and the first meaning wins.
      if (REAL_NAMES.has(alias) || map.has(key)) continue;
      map.set(key, c.name);
    }
  }
  return map;
})();

/** \ElementVon A -> \in A. Real commands and unknown words are left alone. */
export function resolveAliases(code: string): string {
  return code.replace(new RegExp(`\\\\([${LETTERS}]+)`, 'g'), (whole, word: string) => {
    if (REAL_NAMES.has(word)) return whole;
    const real = ALIASES.get(word.toLowerCase());
    return real ? `\\${real}` : whole;
  });
}

/** Real command name -> readable name in `lang`, where one exists and resolves back. */
const readableNames = new Map<Lang, Map<string, string>>();
function readableMap(lang: Lang): Map<string, string> {
  let map = readableNames.get(lang);
  if (!map) {
    map = new Map();
    for (const c of COMMANDS) {
      const alias = aliasOf(c, lang);
      if (alias && ALIASES.get(alias.toLowerCase()) === c.name && !map.has(c.name)) map.set(c.name, alias);
    }
    readableNames.set(lang, map);
  }
  return map;
}

/**
 * The same scheme everywhere: palette keys, toolbar buttons and reference
 * snippets insert \ElementVon rather than \in when readable commands are on.
 */
export function toReadable(code: string): string {
  if (!readable) return code;
  const map = readableMap(getLang());
  return code.replace(/\\([a-zA-Z]+)/g, (whole, name: string, at: number) =>
    code[at - 1] === '\\' ? whole : map.has(name) ? `\\${map.get(name)}` : whole,
  );
}

let readable = true;
/** Whether picking a command inserts its readable name (\ElementVon) or the LaTeX one (\in). */
export function setReadableCommands(on: boolean) {
  readable = on;
}

function applyTpl(tpl: string) {
  return (view: EditorView, _c: Completion, from: number, to: number) => {
    const { text, cursor } = applyTemplate(tpl, '');
    view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + cursor }, userEvent: 'input.complete' });
  };
}

// Matching ignores case, spaces and umlaut dots: "elementvon", "Größer" = "groesser".
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');

type Entry = { option: Completion; names: string[]; meanings: string[] };
const cache = new Map<string, Entry[]>();
function entries(): Entry[] {
  const lang = getLang();
  const key = `${lang}:${readable}`;
  let list = cache.get(key);
  if (!list) {
    list = COMMANDS.map((c) => {
      const shown = tr(c.meaning, lang);
      const alias = aliasOf(c, lang);
      const useAlias = readable && alias && ALIASES.get(alias.toLowerCase()) === c.name;
      const option: Completion = useAlias
        ? { label: `\\${alias}`, detail: `${c.label} · ${shown}`, apply: applyTpl(c.tpl.replace(c.label, `\\${alias}`)), type: 'keyword' }
        : { label: c.label, detail: shown, apply: applyTpl(c.tpl), type: 'keyword' };
      return {
        option,
        names: [norm(c.name), ...(alias ? [norm(alias)] : [])],
        meanings: [...new Set([norm(shown), norm(c.meaning)])].filter(Boolean),
      };
    });
    cache.set(key, list);
  }
  return list;
}

/** Rank by how well `q` matches: the command's name first, then its meaning. */
function rank(e: Entry, q: string, nameToo: boolean): number {
  if (nameToo && e.names.includes(q)) return 3.3; // exactly what was typed: \in before \int
  if (nameToo && e.names.some((n) => n.startsWith(q))) return 3;
  if (e.meanings.some((m) => m.startsWith(q))) return 2;
  if (nameToo && e.names.some((n) => n.includes(q))) return 1;
  if (q.length >= 3 && e.meanings.some((m) => m.includes(q))) return 0;
  return -1;
}

function matches(q: string, nameToo: boolean): Completion[] {
  return entries()
    .map((e) => ({ e, r: rank(e, q, nameToo) }))
    .filter((h) => h.r >= 0)
    .sort((a, b) => b.r - a.r || a.e.option.label.length - b.e.option.label.length)
    .map(({ e, r }) => ({ ...e.option, boost: Math.round(r * 30) }));
}

// Inside \text{…} or \ce{…} words are words, not commands.
const IN_TEXT = /\\(?:text\w*|mbox|ce|pu|operatorname)\s*\{[^{}]*$/;

/** Real names of plain symbols: the ones inserted as "\forall " with no arguments. */
const SYMBOLS = new Set(COMMANDS.filter((c) => /^\\[a-zA-Z]+ $/.test(c.tpl)).map((c) => c.name));

/** "forall" or "FürAlle" -> "forall" when it is a plain symbol, else null. */
export function symbolName(word: string): string | null {
  const real = REAL_NAMES.has(word) ? word : ALIASES.get(word.toLowerCase());
  return real && SYMBOLS.has(real) ? real : null;
}

export function latexCompletions(ctx: CompletionContext): CompletionResult | null {
  // "\in", "\Element", "\unendlich": a backslash and letters.
  const cmd = ctx.matchBefore(new RegExp(`\\\\[${LETTERS}]*`));
  if (cmd) {
    if (cmd.from === cmd.to && !ctx.explicit) return null;
    const q = norm(cmd.text.slice(1));
    const options = q ? matches(q, true) : entries().map((e) => e.option);
    return options.length ? { from: cmd.from, options, filter: false } : null;
  }
  // Plain words that describe a symbol: "Element von", "unendlich", "Integral".
  const line = ctx.state.doc.lineAt(ctx.pos);
  const before = line.text.slice(0, ctx.pos - line.from);
  if (IN_TEXT.test(before)) return null;
  const words = new RegExp(`(?:^|[^\\\\${LETTERS}])((?:[${LETTERS}]+ ){0,2}[${LETTERS}]{3,})$`).exec(before);
  if (!words) return null;
  // Try the longest phrase first ("Element von"), then shorter ones.
  const parts = words[1].split(' ');
  for (let i = 0; i < parts.length; i++) {
    const phrase = parts.slice(i).join(' ');
    if (norm(phrase).length < 3) continue; // "in", "ab": too short to mean a symbol
    const options = matches(norm(phrase), false).filter((o) => (o.boost ?? 0) >= 60);
    if (options.length) return { from: ctx.pos - phrase.length, options, filter: false };
  }
  return null;
}
