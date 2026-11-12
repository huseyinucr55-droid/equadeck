// Reference sheets (S04–S08). Our own selection and wording; every row can be
// inserted with a click. `render` overrides what is drawn when the code alone
// would be invisible (spaces) or needs context.

export type RefRow = { code: string; render?: string; note?: string };
export type RefSection = { title: string; rows: RefRow[] };
export type RefSheet = { id: string; title: string; intro: string; link?: { label: string; href: string }; sections: RefSection[] };

const colours = [
  'black', 'gray', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan', 'blue', 'purple', 'magenta', 'brown',
  'Maroon', 'BrickRed', 'Salmon', 'BurntOrange', 'Goldenrod', 'OliveGreen', 'ForestGreen', 'SeaGreen', 'Turquoise',
  'SkyBlue', 'CornflowerBlue', 'RoyalBlue', 'NavyBlue', 'MidnightBlue', 'Orchid', 'Plum', 'Mulberry', 'Sepia', 'Tan',
];

export const SHEETS: RefSheet[] = [
  {
    id: 'basics',
    title: 'LaTeX basics',
    intro: 'Spacing, special characters and sizing that the palette doesn’t cover.',
    sections: [
      {
        title: 'Spacing',
        rows: [
          { code: 'a\\!b', note: 'negative thin space' },
          { code: 'a\\,b', note: 'thin space' },
          { code: 'a\\:b', note: 'medium space' },
          { code: 'a\\;b', note: 'thick space' },
          { code: 'a\\quad b', note: '1em' },
          { code: 'a\\qquad b', note: '2em' },
        ],
      },
      {
        title: 'Characters that need a backslash',
        rows: [{ code: '\\# \\$ \\% \\& \\_ \\{ \\}' }, { code: '\\backslash' }, { code: '\\text{discount} = 50\\%', note: 'keep \\% outside \\text' }],
      },
      {
        title: 'Growing brackets',
        rows: [
          { code: '\\big( \\Big( \\bigg( \\Bigg(', note: 'fixed sizes' },
          { code: '\\left( \\frac{a}{b} \\right)', note: 'grow to fit' },
          { code: '\\left. \\frac{df}{dx} \\right|_{x=0}', note: 'one side only' },
        ],
      },
      {
        title: 'Fractions',
        rows: [
          { code: '\\frac{1}{2}' },
          { code: '\\tfrac{1}{2}', note: 'text size' },
          { code: '\\dfrac{1}{2}', note: 'display size' },
          { code: '\\cfrac{1}{1+\\cfrac{1}{x}}', note: 'continued' },
          { code: '{}^{a}/_{b}', note: 'slanted' },
        ],
      },
      {
        title: 'Text and fonts inside maths',
        rows: [
          { code: 'x \\text{ for all } x > 0' },
          { code: '\\mathrm{d}x', note: 'upright d' },
          { code: '\\mathbb{R} \\mathcal{L} \\mathfrak{g} \\mathsf{S} \\mathtt{T}' },
        ],
      },
      {
        title: 'Aligning lines',
        rows: [
          { code: '\\begin{aligned} a &= b + c \\\\ &= d \\end{aligned}', note: 'align at &' },
          { code: '\\begin{gathered} a = b \\\\ c = d \\end{gathered}', note: 'centred' },
        ],
      },
    ],
  },
  {
    id: 'colours',
    title: 'Colours',
    intro: 'Named colours work with \\color and \\textcolor. For any other colour, use a hex code like \\color{#E4572E} or RGB values.',
    sections: [
      {
        title: 'Using colour',
        rows: [
          { code: '{\\color{red} x} + y', note: 'colour a group' },
          { code: '\\textcolor{blue}{x} + y', note: 'colour one item' },
          { code: '\\color{#E4572E}{x}', note: 'hex colour' },
          { code: '\\color[RGB]{46,134,171}{x}', note: 'RGB, 0–255' },
        ],
      },
      {
        title: 'Named colours',
        rows: colours.map((c) => ({ code: `\\color{${c}}{\\blacksquare}\\ \\text{${c}}`, note: `\\color{${c}}` })),
      },
    ],
  },
  {
    id: 'boxes',
    title: 'Boxes & backgrounds',
    intro: 'Frames, highlights and strike-throughs.',
    sections: [
      {
        title: 'Highlight',
        rows: [
          { code: '\\bbox[yellow]{x^2 + 1}' },
          { code: '\\bbox[#cfe8ff, 6px]{x^2 + 1}', note: 'hex colour + padding' },
          { code: '\\bbox[4px, border: 2px solid red]{x^2 + 1}', note: 'border' },
          { code: '\\colorbox{yellow}{$x^2 + 1$}' },
        ],
      },
      {
        title: 'Frames',
        rows: [
          { code: '\\boxed{E = mc^2}' },
          { code: '\\fbox{text in a frame}' },
          { code: '\\fcolorbox{red}{yellow}{$x$}', note: 'frame + fill' },
        ],
      },
      {
        title: 'Cancel',
        rows: [{ code: '\\cancel{x}' }, { code: '\\bcancel{x}' }, { code: '\\xcancel{x}' }, { code: '\\cancelto{0}{x}' }],
      },
    ],
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    intro: 'Formulas and reactions with \\ce{…} (mhchem). Numbers are subscripted, charges superscripted automatically.',
    link: { label: 'Full mhchem manual', href: 'https://mhchem.github.io/MathJax-mhchem/' },
    sections: [
      {
        title: 'Formulas and ions',
        rows: [{ code: '\\ce{H2O}' }, { code: '\\ce{SO4^2-}' }, { code: '\\ce{[Cu(NH3)4]^2+}' }, { code: '\\ce{^{14}_{6}C}', note: 'isotope' }],
      },
      {
        title: 'Reactions',
        rows: [
          { code: '\\ce{2H2 + O2 -> 2H2O}' },
          { code: '\\ce{N2 + 3H2 <=> 2NH3}', note: 'equilibrium' },
          { code: '\\ce{CaCO3 ->[\\Delta] CaO + CO2 ^}', note: 'heat, gas' },
          { code: '\\ce{Ag+ + Cl- -> AgCl v}', note: 'precipitate' },
        ],
      },
      {
        title: 'States and units',
        rows: [{ code: '\\ce{NaCl(aq)}' }, { code: '\\ce{H2O(l)}' }, { code: '\\pu{25 kJ mol-1}', note: 'units' }],
      },
    ],
  },
  {
    id: 'physics',
    title: 'Physics',
    intro: 'Shorthand from the physics package: derivatives, vectors, brackets and quantum notation.',
    link: { label: 'physics package documentation', href: 'https://ctan.org/pkg/physics' },
    sections: [
      {
        title: 'Derivatives',
        rows: [{ code: '\\dv{f}{x}' }, { code: '\\dv[2]{f}{x}' }, { code: '\\pdv{f}{x}' }, { code: '\\pdv{f}{x}{y}' }, { code: '\\eval{x^2}_0^1' }],
      },
      {
        title: 'Vectors and operators',
        rows: [
          { code: '\\vb{F} = m\\vb{a}' },
          { code: '\\grad{\\phi}' },
          { code: '\\div{\\vb{E}}' },
          { code: '\\curl{\\vb{B}}' },
          { code: '\\laplacian{\\psi}' },
        ],
      },
      {
        title: 'Brackets',
        rows: [{ code: '\\abs{x}' }, { code: '\\norm{\\vb{v}}' }, { code: '\\qty(\\frac{a}{b})', note: 'auto-sized' }, { code: '\\order{x^2}' }],
      },
      {
        title: 'Quantum',
        rows: [{ code: '\\bra{\\phi}' }, { code: '\\ket{\\psi}' }, { code: '\\braket{\\phi}{\\psi}' }, { code: '\\expval{H}' }, { code: '\\comm{A}{B}' }],
      },
    ],
  },
];
