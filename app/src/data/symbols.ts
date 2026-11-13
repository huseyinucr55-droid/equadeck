// The symbol palette. Our own grouping and names; labels are rendered by
// MathJax from `label` (defaults to the inserted code without its slot).
// `insert` uses #0 for the current selection (see lib/insert.ts).

export type Sym = { name: string; insert: string; label?: string; keywords?: string };
export type Group = { id: string; title: string; symbols: Sym[] };

const s = (name: string, insert: string, label?: string, keywords?: string): Sym => ({ name, insert, label, keywords });
const plain = (pairs: [string, string][]) => pairs.map(([name, tex]) => s(name, `${tex} `, tex));

export const GROUPS: Group[] = [
  {
    id: 'basics',
    title: 'Basics',
    symbols: [
      s('superscript', '^{#0}', 'x^{n}', 'power exponent'),
      s('subscript', '_{#0}', 'x_{n}', 'index'),
      s('superscript and subscript', '_{#0}^{}', 'x_{i}^{n}'),
      s('fraction', '\\frac{#0}{}', '\\frac{a}{b}', 'divide'),
      s('small fraction', '\\tfrac{#0}{}', '\\tfrac{a}{b}'),
      s('square root', '\\sqrt{#0}', '\\sqrt{x}', 'radical'),
      s('nth root', '\\sqrt[]{#0}', '\\sqrt[n]{x}', 'radical'),
      s('sum', '\\sum_{#0}^{}', '\\sum', 'sigma series'),
      s('product', '\\prod_{#0}^{}', '\\prod', 'pi'),
      s('integral', '\\int_{#0}^{}', '\\int', 'integrate'),
      s('double integral', '\\iint_{#0}', '\\iint'),
      s('contour integral', '\\oint_{#0}', '\\oint'),
      s('limit', '\\lim_{#0}', '\\lim_{x\\to a}'),
      s('binomial', '\\binom{#0}{}', '\\binom{n}{k}', 'choose'),
      s('infinity', '\\infty ', '\\infty'),
      s('partial', '\\partial ', '\\partial', 'derivative'),
      s('nabla', '\\nabla ', '\\nabla', 'gradient del'),
      s('dots', '\\dots ', '\\dots', 'ellipsis'),
      s('centred dots', '\\cdots ', '\\cdots'),
      s('thin space', '\\, ', 'a\\,b', 'space'),
      s('wide space', '\\quad ', 'a\\quad b', 'space'),
    ],
  },
  {
    id: 'relations',
    title: 'Relations',
    symbols: [
      ...plain([
        ['less than', '<'], ['greater than', '>'], ['less or equal', '\\leq'], ['greater or equal', '\\geq'],
        ['much less', '\\ll'], ['much greater', '\\gg'], ['not equal', '\\neq'], ['equivalent', '\\equiv'],
        ['approximately', '\\approx'], ['similar', '\\sim'], ['similar or equal', '\\simeq'], ['congruent', '\\cong'],
        ['proportional', '\\propto'], ['asymptotic', '\\asymp'], ['precedes', '\\prec'], ['succeeds', '\\succ'],
        ['parallel', '\\parallel'], ['perpendicular', '\\perp'], ['divides', '\\mid'],
      ]),
      s('defined as', ':= ', ':='),
    ],
  },
  {
    id: 'operators',
    title: 'Operators',
    symbols: plain([
      // '\div' is redefined as divergence by the physics package, so the
      // division sign goes in as the ÷ character.
      ['plus minus', '\\pm'], ['minus plus', '\\mp'], ['times', '\\times'], ['divide', '÷'],
      ['dot', '\\cdot'], ['star', '\\ast'], ['circle', '\\circ'], ['bullet', '\\bullet'],
      ['circled plus', '\\oplus'], ['circled times', '\\otimes'], ['wedge', '\\wedge'], ['vee', '\\vee'],
      ['big union', '\\bigcup'], ['big intersection', '\\bigcap'], ['coproduct', '\\coprod'], ['big circled plus', '\\bigoplus'],
    ]),
  },
  {
    id: 'arrows',
    title: 'Arrows',
    symbols: [
      ...plain([
        ['left arrow', '\\leftarrow'], ['right arrow', '\\rightarrow'], ['left right arrow', '\\leftrightarrow'],
        ['long right arrow', '\\longrightarrow'], ['long left arrow', '\\longleftarrow'], ['maps to', '\\mapsto'],
        ['implied by', '\\Leftarrow'], ['implies', '\\Rightarrow'], ['if and only if', '\\Leftrightarrow'],
        ['long implies', '\\Longrightarrow'], ['up arrow', '\\uparrow'], ['down arrow', '\\downarrow'],
        ['north east arrow', '\\nearrow'], ['south east arrow', '\\searrow'], ['hook right arrow', '\\hookrightarrow'],
        ['right harpoons', '\\rightleftharpoons'],
      ]),
      s('arrow with text', '\\xrightarrow{#0}', '\\xrightarrow{f}'),
      s('tends to', '\\to ', '\\to', 'limit'),
    ],
  },
  {
    id: 'greek',
    title: 'Greek',
    symbols: plain([
      ['alpha', '\\alpha'], ['beta', '\\beta'], ['gamma', '\\gamma'], ['delta', '\\delta'], ['epsilon', '\\epsilon'],
      ['varepsilon', '\\varepsilon'], ['zeta', '\\zeta'], ['eta', '\\eta'], ['theta', '\\theta'], ['vartheta', '\\vartheta'],
      ['iota', '\\iota'], ['kappa', '\\kappa'], ['lambda', '\\lambda'], ['mu', '\\mu'], ['nu', '\\nu'], ['xi', '\\xi'],
      ['pi', '\\pi'], ['rho', '\\rho'], ['sigma', '\\sigma'], ['tau', '\\tau'], ['upsilon', '\\upsilon'], ['phi', '\\phi'],
      ['varphi', '\\varphi'], ['chi', '\\chi'], ['psi', '\\psi'], ['omega', '\\omega'],
      ['capital gamma', '\\Gamma'], ['capital delta', '\\Delta'], ['capital theta', '\\Theta'], ['capital lambda', '\\Lambda'],
      ['capital xi', '\\Xi'], ['capital pi', '\\Pi'], ['capital sigma', '\\Sigma'], ['capital phi', '\\Phi'],
      ['capital psi', '\\Psi'], ['capital omega', '\\Omega'],
    ]),
  },
  {
    id: 'sets',
    title: 'Sets & logic',
    symbols: [
      ...plain([
        ['element of', '\\in'], ['not element of', '\\notin'], ['contains', '\\ni'], ['subset', '\\subset'],
        ['subset or equal', '\\subseteq'], ['superset', '\\supset'], ['superset or equal', '\\supseteq'],
        ['union', '\\cup'], ['intersection', '\\cap'], ['set minus', '\\setminus'], ['empty set', '\\emptyset'],
        ['for all', '\\forall'], ['exists', '\\exists'], ['not exists', '\\nexists'], ['not', '\\neg'],
        ['and', '\\land'], ['or', '\\lor'], ['therefore', '\\therefore'], ['because', '\\because'],
        ['natural numbers', '\\mathbb{N}'], ['integers', '\\mathbb{Z}'], ['rationals', '\\mathbb{Q}'],
        ['reals', '\\mathbb{R}'], ['complex numbers', '\\mathbb{C}'],
      ]),
      s('blackboard letter', '\\mathbb{#0}', '\\mathbb{A}', 'double struck'),
      s('calligraphic letter', '\\mathcal{#0}', '\\mathcal{A}', 'script'),
    ],
  },
  {
    id: 'brackets',
    title: 'Brackets',
    symbols: [
      s('parentheses', '\\left( #0 \\right)', '\\left(x\\right)', 'round'),
      s('square brackets', '\\left[ #0 \\right]', '\\left[x\\right]'),
      s('braces', '\\left\\{ #0 \\right\\}', '\\left\\{x\\right\\}', 'curly'),
      s('angle brackets', '\\left\\langle #0 \\right\\rangle', '\\left\\langle x\\right\\rangle'),
      s('absolute value', '\\left| #0 \\right|', '\\left|x\\right|', 'modulus'),
      s('norm', '\\left\\| #0 \\right\\|', '\\left\\|x\\right\\|'),
      s('floor', '\\lfloor #0 \\rfloor', '\\lfloor x\\rfloor'),
      s('ceiling', '\\lceil #0 \\rceil', '\\lceil x\\rceil'),
      s('cases', '\\begin{cases} #0 & \\text{if } \\\\  & \\text{otherwise} \\end{cases}', '\\begin{cases}a\\\\b\\end{cases}', 'piecewise'),
      s('overbrace', '\\overbrace{#0}^{}', '\\overbrace{ab}^{n}'),
      s('underbrace', '\\underbrace{#0}_{}', '\\underbrace{ab}_{n}'),
    ],
  },
  {
    id: 'accents',
    title: 'Accents',
    symbols: [
      s('hat', '\\hat{#0}', '\\hat{a}'), s('wide hat', '\\widehat{#0}', '\\widehat{ab}'),
      s('bar', '\\bar{#0}', '\\bar{a}'), s('overline', '\\overline{#0}', '\\overline{ab}'),
      s('vector', '\\vec{#0}', '\\vec{a}'), s('arrow over', '\\overrightarrow{#0}', '\\overrightarrow{AB}'),
      s('dot accent', '\\dot{#0}', '\\dot{a}', 'derivative'), s('double dot', '\\ddot{#0}', '\\ddot{a}'),
      s('tilde', '\\tilde{#0}', '\\tilde{a}'), s('underline', '\\underline{#0}', '\\underline{a}'),
      s('prime', "{#0}'", "a'", 'derivative'), s('cancel', '\\cancel{#0}', '\\cancel{x}', 'strike'),
    ],
  },
  {
    id: 'functions',
    title: 'Functions',
    symbols: [
      ...['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'coth', 'ln', 'log', 'lg', 'exp',
        'det', 'dim', 'ker', 'deg', 'gcd', 'arg', 'Pr', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf'].map((f) =>
        s(f, `\\${f} `, `\\${f}`, 'function')),
      s('log base', '\\log_{#0}', '\\log_{b}'),
      s('custom operator', '\\operatorname{#0}', '\\operatorname{f}', 'function name'),
    ],
  },
  {
    id: 'style',
    title: 'Style',
    symbols: [
      s('text', '\\text{#0}', '\\text{Text}', 'words roman'),
      s('bold', '\\mathbf{#0}', '\\mathbf{B}', 'boldface'),
      s('bold symbol', '\\boldsymbol{#0}', '\\boldsymbol{\\alpha}'),
      s('italic', '\\mathit{#0}', '\\mathit{I}'),
      s('roman', '\\mathrm{#0}', '\\mathrm{R}', 'upright'),
      s('display style', '\\displaystyle ', '\\displaystyle\\sum', 'big'),
      s('boxed', '\\boxed{#0}', '\\boxed{x}', 'frame'),
      ...(['red', 'blue', 'green', 'orange', 'purple', 'teal', 'gray'] as const).map((c) =>
        s(c, `{\\color{${c}} #0}`, `\\color{${c}}{\\blacksquare}`, 'colour color')),
      s('highlight', '\\bbox[yellow]{#0}', '\\bbox[yellow]{x}', 'background'),
      ...(['tiny', 'small', 'large', 'Large', 'huge'] as const).map((z) => s(`size ${z}`, `{\\${z} #0}`, `\\${z} A`, 'size')),
    ],
  },
];

export const ALL_SYMBOLS: Sym[] = GROUPS.flatMap((g) => g.symbols);

export function labelOf(sym: Sym): string {
  return sym.label ?? sym.insert.replace('#0', 'x').trim();
}
