// LaTeX -> MathML (MathLive) -> OMML, the formula format Word edits natively.
// Covers what school and university maths uses: fractions, roots, powers and
// indices, sums/integrals/limits, brackets, matrices, accents and text.
import { convertLatexToMathMl } from 'mathlive';

const NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const NARY = new Set(['∑', '∏', '∐', '∫', '∬', '∭', '∮', '⋃', '⋂', '⋁', '⋀', '⨁', '⨂']);
const INTEGRALS = new Set(['∫', '∬', '∭', '∮']);
const OPEN = new Set(['(', '[', '{', '|', '‖', '⟨', '⌊', '⌈']);
const CLOSE = new Set([')', ']', '}', '|', '‖', '⟩', '⌋', '⌉']);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function run(text: string, upright = false, normalText = false): string {
  if (!text) return '';
  const rPr = normalText ? '<m:rPr><m:nor/></m:rPr>' : upright ? '<m:rPr><m:sty m:val="p"/></m:rPr>' : '';
  return `<m:r>${rPr}<m:t xml:space="preserve">${esc(text)}</m:t></m:r>`;
}

const kids = (el: Element) => [...el.children].filter((c) => c.localName !== 'annotation' && c.localName !== 'annotation-xml');
const textOf = (el: Element | undefined) => (el?.textContent ?? '').trim();

/** The base of a sub/superscript, ignoring wrapper rows: "∑" for <msub><mo>∑</mo>… */
function naryChar(el: Element | undefined): string | null {
  if (!el) return null;
  const t = textOf(el);
  return (el.localName === 'mo' || el.localName === 'mrow') && NARY.has(t) ? t : null;
}

/** Convert a list of sibling elements; an n-ary operator swallows what follows it as its body. */
function seq(list: Element[]): string {
  let out = '';
  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    const name = el.localName;
    // ∑_{k=1}^{n} …, ∫_a^b … : sub/superscripted big operator.
    if (name === 'msubsup' || name === 'munderover' || name === 'msub' || name === 'munder' || name === 'msup' || name === 'mover') {
      const [base, a, b] = kids(el);
      const chr = naryChar(base);
      if (chr) {
        const hasSub = name !== 'msup' && name !== 'mover';
        const hasSup = name !== 'msub' && name !== 'munder';
        const sub = hasSub ? a : undefined;
        const sup = hasSup ? (name === 'msup' || name === 'mover' ? a : b) : undefined;
        const body = seq(list.slice(i + 1));
        const loc = INTEGRALS.has(chr) ? 'subSup' : 'undOvr';
        out += `<m:nary><m:naryPr><m:chr m:val="${esc(chr)}"/><m:limLoc m:val="${loc}"/>${hasSub ? '' : '<m:subHide m:val="1"/>'}${hasSup ? '' : '<m:supHide m:val="1"/>'}</m:naryPr><m:sub>${sub ? node(sub) : ''}</m:sub><m:sup>${sup ? node(sup) : ''}</m:sup><m:e>${body}</m:e></m:nary>`;
        return out;
      }
    }
    // A bare big operator: ∑ x
    if (name === 'mo' && NARY.has(textOf(el))) {
      out += `<m:nary><m:naryPr><m:chr m:val="${esc(textOf(el))}"/><m:subHide m:val="1"/><m:supHide m:val="1"/></m:naryPr><m:sub/><m:sup/><m:e>${seq(list.slice(i + 1))}</m:e></m:nary>`;
      return out;
    }
    // ( … ) : a bracket pair becomes a growing delimiter.
    if (name === 'mo' && OPEN.has(textOf(el))) {
      let depth = 0;
      let j = i + 1;
      for (; j < list.length; j++) {
        const t = list[j].localName === 'mo' ? textOf(list[j]) : '';
        if (CLOSE.has(t) && depth === 0) break; // "|" closes when nothing else is open
        if (CLOSE.has(t)) depth--;
        else if (OPEN.has(t)) depth++;
      }
      if (j < list.length) {
        const beg = textOf(el);
        const end = textOf(list[j]);
        out += `<m:d><m:dPr><m:begChr m:val="${esc(beg)}"/><m:endChr m:val="${esc(end)}"/></m:dPr><m:e>${seq(list.slice(i + 1, j))}</m:e></m:d>`;
        i = j;
        continue;
      }
    }
    out += node(el);
  }
  return out;
}

function node(el: Element): string {
  const c = kids(el);
  switch (el.localName) {
    case 'math':
    case 'mrow':
    case 'mstyle':
    case 'mpadded':
    case 'mphantom':
    case 'semantics':
    case 'menclose':
      return seq(c);
    case 'mi': {
      const t = textOf(el);
      // Multi-letter names (sin, log, lim) and \mathrm are upright.
      return run(t, t.length > 1 || el.getAttribute('mathvariant') === 'normal');
    }
    case 'mn':
      return run(textOf(el));
    case 'mo':
      return run(textOf(el));
    case 'mtext':
      return run(el.textContent ?? '', false, true);
    case 'mspace':
      return run(' ');
    case 'mfrac':
      return `<m:f><m:num>${c[0] ? node(c[0]) : ''}</m:num><m:den>${c[1] ? node(c[1]) : ''}</m:den></m:f>`;
    case 'msqrt':
      return `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${seq(c)}</m:e></m:rad>`;
    case 'mroot':
      return `<m:rad><m:deg>${c[1] ? node(c[1]) : ''}</m:deg><m:e>${c[0] ? node(c[0]) : ''}</m:e></m:rad>`;
    case 'msup':
      return `<m:sSup><m:e>${node(c[0])}</m:e><m:sup>${c[1] ? node(c[1]) : ''}</m:sup></m:sSup>`;
    case 'msub':
      return `<m:sSub><m:e>${node(c[0])}</m:e><m:sub>${c[1] ? node(c[1]) : ''}</m:sub></m:sSub>`;
    case 'msubsup':
      return `<m:sSubSup><m:e>${node(c[0])}</m:e><m:sub>${c[1] ? node(c[1]) : ''}</m:sub><m:sup>${c[2] ? node(c[2]) : ''}</m:sup></m:sSubSup>`;
    case 'munder': {
      return `<m:limLow><m:e>${node(c[0])}</m:e><m:lim>${c[1] ? node(c[1]) : ''}</m:lim></m:limLow>`;
    }
    case 'mover': {
      const accent = textOf(c[1]);
      if (el.getAttribute('accent') === 'true' || accent.length === 1) {
        return `<m:acc><m:accPr><m:chr m:val="${esc(accent)}"/></m:accPr><m:e>${node(c[0])}</m:e></m:acc>`;
      }
      return `<m:limUpp><m:e>${node(c[0])}</m:e><m:lim>${c[1] ? node(c[1]) : ''}</m:lim></m:limUpp>`;
    }
    case 'munderover':
      return `<m:limLow><m:e><m:limUpp><m:e>${node(c[0])}</m:e><m:lim>${c[2] ? node(c[2]) : ''}</m:lim></m:limUpp></m:e><m:lim>${c[1] ? node(c[1]) : ''}</m:lim></m:limLow>`;
    case 'mtable': {
      const rows = c.filter((r) => r.localName === 'mtr' || r.localName === 'mlabeledtr');
      const cols = Math.max(1, ...rows.map((r) => kids(r).length));
      return `<m:m><m:mPr><m:mcs><m:mc><m:mcPr><m:count m:val="${cols}"/><m:mcJc m:val="center"/></m:mcPr></m:mc></m:mcs></m:mPr>${rows
        .map((r) => `<m:mr>${kids(r).map((cell) => `<m:e>${seq(kids(cell))}</m:e>`).join('')}</m:mr>`)
        .join('')}</m:m>`;
    }
    default:
      return c.length ? seq(c) : run(textOf(el));
  }
}

/** OMML for one formula: <m:oMath> (in the text) or <m:oMathPara> (own line). */
export function latexToOmml(latex: string, display: boolean): string {
  const mathml = convertLatexToMathMl(latex.replace(/\\placeholder\{\}/g, ''))
    // A space ("\ ") comes as a bare &nbsp;, which XML doesn't know (the whole
    // formula then came out as LaTeX code in Word): make it a real space.
    .replace(/&nbsp;/g, '<mspace width="0.3em"/>')
    // Other HTML names (&InvisibleTimes; …) as the characters they stand for.
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#)([a-zA-Z]+);/g, (m, name: string) => {
      const t = document.createElement('textarea');
      t.innerHTML = `&${name};`;
      return t.value === m ? '' : t.value;
    });
  const doc = new DOMParser().parseFromString(`<math xmlns="http://www.w3.org/1998/Math/MathML">${mathml}</math>`, 'application/xml');
  const body = doc.querySelector('parsererror') ? run(latex) : node(doc.documentElement);
  const math = `<m:oMath xmlns:m="${NS}">${body}</m:oMath>`;
  return display ? `<m:oMathPara xmlns:m="${NS}">${math.replace(` xmlns:m="${NS}"`, '')}</m:oMathPara>` : math;
}
