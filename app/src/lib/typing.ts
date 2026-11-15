// Typing helpers: turn what people naturally type into the LaTeX they meant.
// Applied before rendering and before copying, so the copied LaTeX matches
// the preview. Text, chemistry and environment names are left alone.

import { resolveAliases } from './completions';

export type InputOptions = {
  /** "=>" becomes ⇒, "!=" becomes ≠ and so on. */
  shortcuts: boolean;
  /** A space typed between two things shows as a space ("a b", "\alpha x"). */
  spaces: boolean;
  /** Autocomplete inserts readable names (\ElementVon) instead of LaTeX ones (\in). */
  readable: boolean;
  /** One word plus space ("integral ") becomes its symbol; "#" always works. */
  words: boolean;
};

export const DEFAULT_INPUT: InputOptions = { shortcuts: true, spaces: false, readable: true, words: true };

/** Longest first, so "<=>" wins over "<=" and "=>". */
export const SHORTCUTS: [string, string][] = [
  ['<=>', '\\Leftrightarrow'],
  ['<->', '\\leftrightarrow'],
  ['=>', '\\Rightarrow'],
  ['->', '\\to'],
  ['<=', '\\le'],
  ['>=', '\\ge'],
  ['!=', '\\ne'],
  ['+-', '\\pm'],
];

// Commands whose braces hold text, chemistry or names, not maths.
const VERBATIM = /\\(?:text(?:bf|it|rm|sf|tt|normal)?|mbox|ce|pu|operatorname\*?|begin|end|label|tag|ref|eqref|href|url|color|textcolor|colorbox|fcolorbox|definecolor)\s*\{/g;

/** [start, end) ranges inside the braces of the commands above. */
function protectedRanges(code: string): [number, number][] {
  const out: [number, number][] = [];
  for (const m of code.matchAll(VERBATIM)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    let depth = 0;
    let i = open;
    for (; i < code.length; i++) {
      if (code[i] === '\\') i++;
      else if (code[i] === '{') depth++;
      else if (code[i] === '}' && --depth === 0) break;
    }
    out.push([open, i + 1]);
  }
  return out;
}

const inside = (ranges: [number, number][], at: number) => ranges.some(([a, b]) => at > a && at < b);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SHORTCUT_RE = new RegExp(SHORTCUTS.map(([k]) => escape(k)).join('|'), 'g');
const SHORTCUT_MAP = new Map(SHORTCUTS);

function applyShortcuts(code: string): string {
  const ranges = protectedRanges(code);
  return code.replace(SHORTCUT_RE, (hit, at: number) => {
    // "\!=" is a negative space before "=", not "≠"; "5!=120" is a factorial.
    if (inside(ranges, at) || code[at - 1] === '\\') return hit;
    if (hit === '!=' && /[0-9)]/.test(code[at - 1] ?? '')) return hit;
    const cmd = SHORTCUT_MAP.get(hit)!;
    // A letter right after would glue onto the command name (\tox).
    return /[A-Za-z]/.test(code[at + hit.length] ?? '') ? `${cmd} ` : cmd;
  });
}

// Symbols that sit like letters. Other commands either space themselves
// (\cdot, \in, \to, \sin) or take what follows as their argument (\frac 12,
// \hat a), so a forced space next to them would be wrong.
const LETTERLIKE = 'alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|partial|nabla|ell|hbar|emptyset|varnothing';
const SPACE_AFTER = new RegExp(`\\\\(?:${LETTERLIKE})$`);
const SPACE_BEFORE = new RegExp(`^\\\\(?:${LETTERLIKE}|text|mathrm|mathbf|frac|sqrt)(?![A-Za-z])`);

function applySpaces(code: string): string {
  const ranges = protectedRanges(code);
  return code.replace(/ +/g, (run, at: number) => {
    if (inside(ranges, at)) return run;
    const before = code.slice(0, at);
    const after = code.slice(at + run.length);
    // Right: a letter, digit, bracket or a symbol-like command.
    if (!/^[A-Za-z0-9(]/.test(after) && !SPACE_BEFORE.test(after)) return run;
    // Left: a letter, digit, closing bracket or letter-like symbol.
    if (/\\[A-Za-z]+$/.test(before)) return SPACE_AFTER.test(before) ? '\\ ' : run;
    if (!/[A-Za-z0-9)\]}|']$/.test(before)) return run;
    // A brace that closes \begin{…} (or its {cc} column spec) starts a cell.
    if (/\\begin\s*\{[^{}]*\}(?:\{[^{}]*\})?$/.test(before)) return run;
    return '\\ ';
  });
}

/** The LaTeX that gets rendered and copied. */
export function toLatex(code: string, opts: InputOptions): string {
  // Readable commands (\ElementVon, \Bruch) always work, whatever the options.
  let out = resolveAliases(code);
  if (opts.shortcuts) out = applyShortcuts(out);
  if (opts.spaces) out = applySpaces(out);
  return out;
}
