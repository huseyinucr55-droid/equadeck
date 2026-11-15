// Word-style formatting for the editor: wrap the selected source text in LaTeX
// commands that MathJax 3 renders, and that still work after toLatex()
// (lib/typing.ts): \textbf, \textit, \textcolor, \mathbf ... keep their words,
// \underline, \bbox and {\large ...} get their words wrapped as \text{...}.

export type Size = 'small' | 'normal' | 'large' | 'Large' | 'huge';
export type FontKind = 'serif' | 'sans' | 'mono';

export type Format =
  | { kind: 'bold' }
  | { kind: 'italic' }
  | { kind: 'underline' }
  | { kind: 'size'; size: Size }
  | { kind: 'color'; color: string }
  | { kind: 'highlight'; color: string }
  | { kind: 'font'; font: FontKind }
  | { kind: 'bullet' }
  | { kind: 'clear' };

export type Edit = {
  /** Replace [from, to) of the document with `insert` ... */
  from: number;
  to: number;
  insert: string;
  /** ... and select [selFrom, selTo) afterwards (positions in the new document). */
  selFrom: number;
  selTo: number;
};

/** Size names in the menu, LaTeX size commands in MathJax. */
export const SIZES: { id: Size; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Large' },
  { id: 'Large', label: 'Very large' },
  { id: 'huge', label: 'Huge' },
];

export const TEXT_COLORS: { label: string; value: string }[] = [
  { label: 'Black', value: '#000000' },
  { label: 'Red', value: '#c92a2a' },
  { label: 'Blue', value: '#1971c2' },
  { label: 'Green', value: '#2f9e44' },
  { label: 'Orange', value: '#e8590c' },
  { label: 'Purple', value: '#9c36b5' },
  { label: 'Grey', value: '#868e96' },
  { label: 'Teal', value: '#0c8599' },
];

export const HIGHLIGHTS: { label: string; value: string }[] = [
  { label: 'Yellow', value: '#fff3bf' },
  { label: 'Light green', value: '#d3f9d8' },
  { label: 'Light blue', value: '#d0ebff' },
  { label: 'Pink', value: '#ffdeeb' },
  { label: 'Light grey', value: '#e9ecef' },
];

export const FONTS: { id: FontKind; label: string }[] = [
  { id: 'serif', label: 'Normal (serif)' },
  { id: 'sans', label: 'Sans serif' },
  { id: 'mono', label: 'Typewriter' },
];

const BULLET = '\\bullet\\; ';
const BULLET_RE = /^(\s*)\\bullet\\; ?/;

/** The commands each simple kind may use (text for words, maths otherwise). */
const SIMPLE: Record<'bold' | 'italic' | 'underline', { text: string; math: string }> = {
  bold: { text: 'textbf', math: 'mathbf' },
  italic: { text: 'textit', math: 'mathit' },
  underline: { text: 'underline', math: 'underline' },
};
const FONT_CMDS: Record<FontKind, { text: string; math: string }> = {
  serif: { text: 'textrm', math: 'mathrm' },
  sans: { text: 'textsf', math: 'mathsf' },
  mono: { text: 'texttt', math: 'mathtt' },
};

type Wrapped = { kind: 'bold' | 'italic' | 'underline' | 'font' | 'color' | 'highlight' | 'size'; inner: string };

/** Index of the "}" closing the "{" at `open`, or -1. */
function matchBrace(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === '{') depth++;
    else if (s[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

const KIND_OF_CMD: Record<string, Wrapped['kind']> = {
  textbf: 'bold',
  mathbf: 'bold',
  textit: 'italic',
  mathit: 'italic',
  underline: 'underline',
  textrm: 'font',
  mathrm: 'font',
  textsf: 'font',
  mathsf: 'font',
  texttt: 'font',
  mathtt: 'font',
};

/** If `s` is exactly one wrapper of the menu's own commands, what is inside. */
export function unwrapOnce(s: string): Wrapped | null {
  const simple = /^\\(textbf|mathbf|textit|mathit|underline|textrm|mathrm|textsf|mathsf|texttt|mathtt)\{/.exec(s);
  const color = /^\\textcolor\{[^{}]*\}\{/.exec(s);
  const box = /^\\bbox\[[^\]]*\]\{/.exec(s);
  const size = /^\{\\(?:small|large|Large|LARGE|huge|Huge|normalsize) /.exec(s);
  let m: RegExpExecArray | null;
  let kind: Wrapped['kind'];
  let open: number;
  if (simple) {
    m = simple;
    kind = KIND_OF_CMD[simple[1]];
    open = m[0].length - 1;
  } else if (color) {
    m = color;
    kind = 'color';
    open = m[0].length - 1;
  } else if (box) {
    m = box;
    kind = 'highlight';
    open = m[0].length - 1;
  } else if (size) {
    m = size;
    kind = 'size';
    open = 0;
  } else return null;
  if (matchBrace(s, open) !== s.length - 1) return null;
  return { kind, inner: s.slice(m[0].length, s.length - 1) };
}

/** Only words (and numbers, punctuation): they are text, so use the \text… commands. */
export function isWordsOnly(s: string): boolean {
  return /^[\p{L}\p{N}\s,.;:!?'’-]+$/u.test(s) && /\p{L}{2,}/u.test(s);
}

/** Words, or words already inside \textbf{…} and friends: the text commands fit. */
function isTextual(s: string): boolean {
  if (isWordsOnly(s)) return true;
  const u = /^\\text(?:bf|it|rm|sf|tt)\{/.test(s) ? unwrapOnce(s) : null;
  return !!u && isTextual(u.inner);
}

function wrapWith(core: string, cmd: { text: string; math: string }): string {
  return `\\${isTextual(core) ? cmd.text : cmd.math}{${core}}`;
}

/** Lines of a selection: leading space, the content, trailing space. */
function splitLines(s: string): { lead: string; core: string; trail: string }[] {
  return s.split('\n').map((line) => {
    const lead = /^\s*/.exec(line)![0];
    const trail = line.length > lead.length ? /\s*$/.exec(line)![0] : '';
    return { lead, core: line.slice(lead.length, line.length - trail.length), trail };
  });
}

/** One line's content with the format applied (a toggle when `off`). */
function formatCore(core: string, f: Format, off: boolean): string {
  const u = unwrapOnce(core);
  switch (f.kind) {
    case 'bold':
    case 'italic':
    case 'underline':
      return off && u ? u.inner : wrapWith(core, SIMPLE[f.kind]);
    case 'font': {
      const inner = u?.kind === 'font' ? u.inner : core;
      return f.font === 'serif' ? inner : wrapWith(inner, FONT_CMDS[f.font]);
    }
    case 'size': {
      const inner = u?.kind === 'size' ? u.inner : core;
      return f.size === 'normal' ? inner : `{\\${f.size} ${inner}}`;
    }
    case 'color': {
      const inner = u?.kind === 'color' ? u.inner : core;
      return `\\textcolor{${f.color}}{${inner}}`;
    }
    case 'highlight': {
      const inner = u?.kind === 'highlight' ? u.inner : core;
      return `\\bbox[${f.color},2px]{${inner}}`;
    }
    default:
      return core;
  }
}

function clearCore(core: string): string {
  let out = core;
  for (let u = unwrapOnce(out); u; u = unwrapOnce(out)) out = u.inner;
  return out;
}

/**
 * The edit that formats [from, to) of `doc`, or null when there is nothing to do.
 * Each selected line is wrapped on its own (a line break inside \textbf{…}
 * would not survive toLatex). Bold, italic and underline toggle; colour, size
 * and font replace the one already there.
 */
export function applyFormat(doc: string, from: number, to: number, f: Format): Edit | null {
  if (from > to) [from, to] = [to, from];
  if (f.kind === 'bullet') return bullets(doc, from, to);
  if (f.kind === 'clear') return clearFormat(doc, from, to);
  return inlineEdit(doc, from, to, f);
}

function inlineEdit(doc: string, from: number, to: number, f: Format): Edit | null {
  const text = doc.slice(from, to);
  if (!text.trim()) return null;
  const lines = splitLines(text);
  const filled = lines.filter((l) => l.core);
  const off = filled.length > 0 && filled.every((l) => unwrapOnce(l.core)?.kind === f.kind);
  const insert = lines
    .map((l) => {
      if (!l.core) return l.lead + l.trail;
      return l.lead + (f.kind === 'clear' ? clearCore(l.core) : formatCore(l.core, f, off)) + l.trail;
    })
    .join('\n');
  if (insert === text) return null;
  return { from, to, insert, selFrom: from, selTo: from + insert.length };
}

/** "• " at the start of every selected line; the same again takes them away. */
function bullets(doc: string, from: number, to: number, mode: 'toggle' | 'remove' = 'toggle'): Edit | null {
  const start = doc.lastIndexOf('\n', from - 1) + 1;
  // A selection that ends at the very start of a line does not include that line.
  const stop = to > from && doc[to - 1] === '\n' ? to - 1 : to;
  const nl = doc.indexOf('\n', stop);
  const end = nl === -1 ? doc.length : nl;
  const before = doc.slice(start, end);
  const lines = before.split('\n');
  const filled = lines.filter((l) => l.trim());
  if (!filled.length) return null;
  const off = mode === 'remove' || filled.every((l) => BULLET_RE.test(l));
  const insert = lines
    .map((l) => {
      if (!l.trim()) return l;
      if (off) return l.replace(BULLET_RE, '$1');
      return BULLET_RE.test(l) ? l : l.replace(/^(\s*)/, `$1${BULLET}`);
    })
    .join('\n');
  if (insert === before) return null;
  return { from: start, to: end, insert, selFrom: start, selTo: start + insert.length };
}

/** Clearing takes the bullets away too, then every wrapper of the menu's own commands. */
function clearFormat(doc: string, from: number, to: number): Edit | null {
  const b = bullets(doc, from, to, 'remove');
  const mid = b ? doc.slice(0, b.from) + b.insert + doc.slice(b.to) : doc;
  const a = inlineEdit(mid, b ? b.selFrom : from, b ? b.selTo : to, { kind: 'clear' });
  if (!b) return a;
  if (!a) return b;
  return { from: b.from, to: b.to, insert: a.insert, selFrom: b.from, selTo: b.from + a.insert.length };
}
