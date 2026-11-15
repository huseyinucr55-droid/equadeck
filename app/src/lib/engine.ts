// The MathJax engine. Loaded lazily (see lib/mathjax.ts) so the app shell
// paints before the TeX fonts and parsers arrive.
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { SafeHandler } from 'mathjax-full/js/ui/safe/SafeHandler.js';
import { SerializedMmlVisitor } from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js';
import { STATE } from 'mathjax-full/js/core/MathItem.js';

import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/amscd/AmsCdConfiguration.js';
import 'mathjax-full/js/input/tex/color/ColorConfiguration.js';
import 'mathjax-full/js/input/tex/bbox/BboxConfiguration.js';
import 'mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import 'mathjax-full/js/input/tex/cancel/CancelConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';

const adaptor = liteAdaptor();
SafeHandler(RegisterHTMLHandler(adaptor));

// Letters the TeX fonts lack (ä, ö, ü, ß, é, emoji …) are drawn as SVG <text>
// in a system font. The lite adaptor can't measure text and says it is 0 wide,
// so the next letters overlapped or left a gap ("Verknü pfungen"). In the
// browser, measure it for real with a canvas in the same font.
const measure = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
if (measure) {
  const liteSize = adaptor.nodeSize.bind(adaptor);
  adaptor.nodeSize = (node, em = 1, local?: boolean) => {
    if (adaptor.kind(node) !== 'text') return liteSize(node, em, local);
    const attr = (name: string) => adaptor.getAttribute(node, name) || '';
    measure.font = `${attr('font-style')} ${attr('font-weight')} ${parseFloat(attr('font-size')) || em}px ${attr('font-family') || 'serif'}`;
    return [measure.measureText(adaptor.textContent(node)).width / em, 0];
  };
}

const CORE = ['base', 'ams', 'amscd', 'color', 'bbox', 'boldsymbol', 'cancel', 'newcommand'];
// mhchem and physics register themselves when lib/extras.ts is imported.
const EXTRAS = ['mhchem', 'physics'];
let extrasOn = false;

export function enableExtras() {
  extrasOn = true;
  labelDoc = null;
}
export const extrasEnabled = () => extrasOn;

class TexError extends Error {}

function makeDocument() {
  const tex = new TeX({
    packages: extrasOn ? [...CORE, ...EXTRAS] : CORE,
    // Throw instead of drawing a red error box, so the UI can show a message
    // and keep the last good render.
    formatError: (_jax: unknown, err: { message: string }) => {
      throw new TexError(err.message);
    },
  });
  // fontCache 'none': every glyph is inlined, so an exported SVG stands alone.
  const svg = new SVG({ fontCache: 'none' });
  return mathjax.document('', { InputJax: tex, OutputJax: svg });
}

/**
 * MathJax marks its SVG role="img" with no name (axe: svg-img-alt, BUG-004).
 * Our wrappers already name the equation (the preview's aria-label is the
 * LaTeX), so the drawing itself is hidden from assistive tech.
 */
function hideFromAT(svg: string): string {
  return svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => `<svg${attrs.replace(/\srole="img"/, '')} aria-hidden="true">`);
}

export type RenderResult ={ ok: true; svg: string } | { ok: false; message: string };

/** Lines separated by \\ at the top level need \displaylines in display mode. */
export function prepare(raw: string): string {
  // Control characters (e.g. a form feed pasted from a PDF) crash MathJax's
  // parser with an internal TypeError (BUG-008); treat them as spaces.
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');
  // Maths mode drops spaces, so "\text{Hallo} x" rendered as "Hallox". A space
  // typed right next to a \text{…} block is meant to show: make it "\ ".
  const TEXT = String.raw`\\text(?:bf|it|rm|sf|tt)?\s*\{[^{}]*\}`;
  // Every typed space counts: "zwei   Mengen" keeps all three.
  const spaces = (run: string) => '\\ '.repeat(run.length);
  // One pass: a second pass saw the "\" of a "\ " it had just written as the
  // character before "\text" and turned it into "\\", a line break.
  // A new line typed between words counts as a space, not as nothing.
  const code = cleaned.replace(new RegExp(`(?<=${TEXT})[ \\n]+(?=\\S)|(?<=\\S)[ \\n]+(?=${TEXT})`, 'g'), spaces);
  const hasBreak = /\\\\/.test(code);
  const hasEnv = /\\begin\s*\{/.test(code);
  return hasBreak && !hasEnv ? `\\displaylines{${code}}` : code;
}

export function render(code: string, display = true): RenderResult {
  if (!code.trim()) return { ok: true, svg: '' };
  try {
    // A fresh document per render, so \newcommand and \label state from the
    // previous keystroke never leak into this one.
    const doc = makeDocument();
    const node = doc.convert(display ? prepare(code) : code, { display, em: 16, ex: 8, containerWidth: 1200 });
    return { ok: true, svg: hideFromAT(adaptor.innerHTML(node)) };
  } catch (e) {
    // TeX errors have useful messages ("Missing close brace"); anything else is
    // an internal failure and its message means nothing to the user.
    const message = e instanceof TexError ? e.message : 'Something in this equation could not be drawn';
    return { ok: false, message: message.replace(/\s+/g, ' ').trim() };
  }
}

/**
 * F1: MathML for pasting into Word / PowerPoint, which turn pasted MathML text
 * into an editable equation. MathJax's internal data-mjx-* attributes are
 * stripped; they mean nothing to Office.
 */
const mmlVisitor = new SerializedMmlVisitor();
export function toMathML(code: string): RenderResult {
  if (!code.trim()) return { ok: false, message: 'Nothing to copy' };
  try {
    const doc = makeDocument();
    const node = doc.convert(prepare(code), { display: true, end: STATE.CONVERT });
    const mml = (mmlVisitor.visitTree(node) as string)
      .replace(/\s+data-mjx-[\w-]+="[^"]*"/g, '')
      .replace(/\n\s*/g, '');
    return { ok: true, svg: mml };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

// Small inline renders (palette keys, thumbnails) share one document and a cache.
const labelCache = new Map<string, string>();
let labelDoc: ReturnType<typeof makeDocument> | null = null;
export function renderLabel(tex: string): string {
  const hit = labelCache.get(tex);
  if (hit) return hit;
  labelDoc ??= makeDocument();
  let out = '';
  try {
    out = hideFromAT(adaptor.innerHTML(labelDoc.convert(tex, { display: false, em: 16, ex: 8 })));
  } catch {
    out = '';
  }
  if (out) labelCache.set(tex, out); // failures retry, e.g. once extras arrive
  return out;
}
