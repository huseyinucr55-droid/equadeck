// Client-side export of the rendered equation. No server involved.

const SVG_NS = 'http://www.w3.org/2000/svg';
// iOS Safari refuses canvases above ~16.7M pixels; stay under it.
const MAX_PIXELS = 16_000_000;
const MAX_SIDE = 8192;

function inkColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--lx-color-export-ink').trim() || 'black';
}

/** A standalone SVG string at the on-screen size, in export ink. */
export function standaloneSvg(svgEl: SVGSVGElement, padding: number) {
  const rect = svgEl.getBoundingClientRect();
  const w = Math.ceil(rect.width + padding * 2);
  const h = Math.ceil(rect.height + padding * 2);
  const inner = svgEl.cloneNode(true) as SVGSVGElement;
  inner.setAttribute('x', String(padding));
  inner.setAttribute('y', String(padding));
  inner.setAttribute('width', String(rect.width));
  inner.setAttribute('height', String(rect.height));
  inner.removeAttribute('style');

  const outer = document.createElementNS(SVG_NS, 'svg');
  outer.setAttribute('xmlns', SVG_NS);
  outer.setAttribute('width', String(w));
  outer.setAttribute('height', String(h));
  outer.setAttribute('viewBox', `0 0 ${w} ${h}`);
  outer.setAttribute('color', inkColor());
  outer.setAttribute('style', `color:${inkColor()}`);
  outer.appendChild(inner);
  return { markup: new XMLSerializer().serializeToString(outer), width: w, height: h };
}

export async function toPng(svgEl: SVGSVGElement, scale: number, padding = 8) {
  const { markup, width, height } = standaloneSvg(svgEl, padding);
  let s = scale;
  const fits = (k: number) => width * k * height * k <= MAX_PIXELS && width * k <= MAX_SIDE && height * k <= MAX_SIDE;
  while (s > 0.25 && !fits(s)) s /= 2;
  const clamped = s !== scale;

  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * s);
  canvas.height = Math.round(height * s);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // transparent background

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/png'),
  );
  return { blob, scale: s, clamped };
}

export function download(blob: Blob, filename: string) {
  // Hand the browser a neutral type: an application/pdf (or image/svg+xml) blob
  // can be grabbed by the built-in viewer, which under load cancelled the save
  // (BUG-007). The file name's extension still sets the type on disk.
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Keep the link in the page until the browser has picked the save up; removing
  // it synchronously can cancel the download on a busy machine (BUG-007).
  setTimeout(() => a.remove(), 5_000);
  // Revoking too soon cancels the save on a slow machine (BUG-002), so keep
  // the blob URL alive for a minute; it's tiny.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** A one-page vector PDF sized to the equation. jsPDF and svg2pdf load on first use. */
let pdfLibs: Promise<[typeof import('jspdf'), typeof import('svg2pdf.js')]> | null = null;
/** Start fetching jsPDF + svg2pdf early (hover/focus on the PDF button), so the click is fast (BUG-007). */
export function preloadPdf() {
  pdfLibs ??= Promise.all([import('jspdf'), import('svg2pdf.js')]);
  return pdfLibs;
}

export async function toPdf(svgEl: SVGSVGElement, padding = 8): Promise<Blob> {
  const [{ jsPDF }, { svg2pdf }] = await preloadPdf();
  const { markup, width, height } = standaloneSvg(svgEl, padding);
  const pt = (px: number) => px * 0.75; // CSS px → PDF points
  // svg2pdf reads computed styles, so the SVG has to be in the document briefly.
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden';
  holder.innerHTML = markup;
  document.body.appendChild(holder);
  try {
    const el = holder.querySelector('svg')!;
    const doc = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'pt', format: [pt(width), pt(height)] });
    await svg2pdf(el, doc, { x: 0, y: 0, width: pt(width), height: pt(height) });
    return doc.output('blob');
  } finally {
    holder.remove();
  }
}

export function svgBlob(svgEl: SVGSVGElement, padding = 8): Blob {
  return new Blob([standaloneSvg(svgEl, padding).markup], { type: 'image/svg+xml' });
}
