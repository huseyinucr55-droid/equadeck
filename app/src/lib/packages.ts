// F2: which LaTeX packages an equation needs outside this editor, and what
// won't work in real LaTeX at all. A static map from commands and
// environments to packages; good enough to get a document compiling.

export type PackageNeed = { name: string; option?: string; because: string[] };
export type Analysis = { packages: PackageNeed[]; warnings: string[]; multiline: boolean };

const BY_COMMAND: Record<string, string> = {};
const add = (pkg: string, cmds: string) => cmds.split(/\s+/).forEach((c) => (BY_COMMAND[c] = pkg));

add('amsmath', 'text dfrac tfrac cfrac binom dbinom tbinom xrightarrow xleftarrow boxed overset underset operatorname iint iiint iiiint idotsint tag eqref substack boldsymbol pmb intertext notag DeclareMathOperator dotsb dotsc dotsi dotsm');
add('amssymb', 'mathbb mathfrak therefore because nexists varnothing leqslant geqslant blacksquare square lesssim gtrsim nmid nleq ngeq nless ngtr subsetneq supsetneq complement Box lozenge checkmark measuredangle triangleq circledast circledcirc boxplus boxtimes lll ggg vartriangle blacktriangle beth gimel daleth backsim eqsim curlyvee curlywedge');
add('xcolor', 'color textcolor colorbox fcolorbox definecolor');
add('cancel', 'cancel bcancel xcancel cancelto');
add('mhchem', 'ce pu');
add('physics', 'dv pdv grad curl laplacian bra ket braket expval ev comm acomm qty abs norm vb vu eval order mel ip op tr Tr rank');

const BY_ENV: Record<string, string> = {};
'align align* aligned gather gather* gathered multline multline* split cases matrix pmatrix bmatrix vmatrix Vmatrix Bmatrix smallmatrix alignat alignat* subarray'
  .split(' ')
  .forEach((e) => (BY_ENV[e] = 'amsmath'));
BY_ENV['CD'] = 'amscd';

// Lowercase base names that xcolor knows without options.
const BASE_COLOURS = new Set(
  'black blue brown cyan darkgray gray green lightgray lime magenta olive orange pink purple red teal violet white yellow'.split(' '),
);

const MATHJAX_ONLY: Record<string, string> = {
  bbox: '\\bbox is MathJax-only; in LaTeX use \\colorbox or \\fcolorbox (xcolor).',
  style: '\\style is MathJax-only and has no LaTeX equivalent.',
  class: '\\class is MathJax-only and has no LaTeX equivalent.',
  cssId: '\\cssId is MathJax-only and has no LaTeX equivalent.',
  unicode: '\\unicode is MathJax-only; type the character and compile with XeLaTeX or LuaLaTeX.',
  require: '\\require is MathJax-only; use \\usepackage in the preamble instead.',
};

const SIZE_COMMANDS = new Set('tiny scriptsize footnotesize small normalsize large Large LARGE huge Huge'.split(' '));

/** Top-level \\ without an environment: this editor wraps it in \displaylines. */
export function isMultiline(code: string) {
  return /\\\\/.test(code) && !/\\begin\s*\{/.test(code);
}

export function analyze(code: string): Analysis {
  const needs = new Map<string, PackageNeed>();
  const need = (name: string, because: string, option?: string) => {
    const n = needs.get(name) ?? { name, because: [] };
    if (!n.because.includes(because)) n.because.push(because);
    if (option) n.option = option;
    needs.set(name, n);
  };
  const warnings: string[] = [];
  const warn = (w: string) => {
    if (!warnings.includes(w)) warnings.push(w);
  };

  for (const m of code.matchAll(/\\([a-zA-Z]+)/g)) {
    const cmd = m[1];
    if (cmd === 'begin' || cmd === 'end') continue;
    // \div{…} is physics' divergence; bare \div is the kernel's ÷.
    if (cmd === 'div' && code.slice((m.index ?? 0) + 4).trimStart().startsWith('{')) need('physics', '\\div{…}');
    const pkg = BY_COMMAND[cmd];
    if (pkg) need(pkg, `\\${cmd}`);
    if (MATHJAX_ONLY[cmd]) warn(MATHJAX_ONLY[cmd]);
    if (SIZE_COMMANDS.has(cmd)) warn(`\\${cmd} doesn't work inside LaTeX maths; use \\text{\\${cmd} …} or \\scalebox (graphicx).`);
  }
  for (const m of code.matchAll(/\\begin\s*\{([^}]+)\}/g)) {
    const pkg = BY_ENV[m[1]];
    if (pkg) need(pkg, `${m[1]} environment`);
  }
  // Named colours beyond the base set need xcolor's dvipsnames option.
  for (const m of code.matchAll(/\\(?:color|textcolor|colorbox)\s*\{([A-Za-z]+)\}/g)) {
    if (!BASE_COLOURS.has(m[1])) need('xcolor', `colour ${m[1]}`, 'dvipsnames');
  }
  const multiline = isMultiline(code);
  if (multiline) need('amsmath', 'several lines (gather*)');

  // Latin letters with accents (ä ö ü ß é …) compile with pdfLaTeX's default
  // UTF-8 input; only other characters (÷, ✓, Greek, emoji) need XeLaTeX.
  const unicode = [...new Set([...code].filter((c) => c.charCodeAt(0) > 127 && !/\p{Script=Latin}/u.test(c)))];
  if (unicode.length) {
    warn(`Unicode characters (${unicode.slice(0, 6).join(' ')}) need XeLaTeX or LuaLaTeX; with pdfLaTeX use commands instead (e.g. \\div for ÷).`);
  }

  const order = ['amsmath', 'amssymb', 'amscd', 'xcolor', 'cancel', 'mhchem', 'physics'];
  const packages = [...needs.values()].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  return { packages, warnings, multiline };
}

/** A paste-ready LaTeX snippet: preamble lines, then the equation in display maths. */
export function latexSnippet(code: string): string {
  const { packages, multiline } = analyze(code);
  const lines: string[] = [];
  if (packages.length) {
    lines.push('% Add to your preamble:');
    for (const p of packages) lines.push(p.option ? `\\usepackage[${p.option}]{${p.name}}` : `\\usepackage{${p.name}}`);
    lines.push('');
  }
  const body = code.trim();
  if (multiline) lines.push('\\begin{gather*}', body, '\\end{gather*}');
  else if (/^\\begin\s*\{(align|gather|multline|alignat)\*?\}/.test(body)) lines.push(body);
  else lines.push('\\[', body, '\\]');
  return lines.join('\n');
}
