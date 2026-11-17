// Real A4 pages on screen (phase 3). The text flows over a stack of white
// pages; when a paragraph, list item or formula would cross the bottom edge
// of a page, an invisible spacer pushes it to the top of the next page, like
// a word processor. A forced page break pushes what follows the same way.
//
// Positions are measured "naturally" (as if there were no spacers), so the
// result doesn't feed back into itself and settles in one pass.
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';

export type PageLayout = {
  /** Page height in CSS px (at 100 % zoom). */
  pageHeight: number;
  /** Top and bottom margin in CSS px. */
  margin: number;
  /** Grey gap between two pages in CSS px. */
  gap: number;
  /** Current zoom factor (1 = 100 %). */
  zoom: number;
};

type State = { decorations: DecorationSet; pages: number; key: string };

export const paginationKey = new PluginKey<State>('pagination');

/** Layout shared with the React side; call `repaginate` after changing it. */
export const layout: PageLayout = { pageHeight: 1123, margin: 94, gap: 24, zoom: 1 };
let onPages: (pages: number) => void = () => {};
export function onPageCount(fn: (pages: number) => void) {
  onPages = fn;
}

export function repaginate(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(paginationKey, 'measure').setMeta('addToHistory', false));
}

/** The pieces that move to the next page as a whole: blocks, and list items one by one. */
function units(doc: PMNode): { pos: number; node: PMNode }[] {
  const out: { pos: number; node: PMNode }[] = [];
  doc.forEach((node, offset) => {
    if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
      node.forEach((item, itemOffset) => out.push({ pos: offset + 1 + itemOffset, node: item }));
    } else out.push({ pos: offset, node });
  });
  return out;
}

function spacer(height: number) {
  return () => {
    const el = document.createElement('div');
    el.className = 'doc-spacer';
    el.setAttribute('aria-hidden', 'true');
    el.contentEditable = 'false';
    el.style.height = `${height}px`;
    return el;
  };
}

function measure(view: EditorView): State {
  const { pageHeight, margin, gap, zoom } = layout;
  const room = pageHeight - 2 * margin; // text height per page
  const stride = pageHeight + gap; // from one page's text top to the next
  const root = view.dom.getBoundingClientRect();
  const spacers = [...view.dom.querySelectorAll<HTMLElement>('.doc-spacer')].map((s) => s.getBoundingClientRect());

  const decorations: Decoration[] = [];
  const keys: string[] = [];
  let shift = 0; // height of the spacers placed so far
  let page = 0;
  let afterBreak = false;

  for (const { pos, node } of units(view.state.doc)) {
    const dom = view.nodeDOM(pos);
    if (!(dom instanceof HTMLElement)) continue;
    const r = dom.getBoundingClientRect();
    const cs = getComputedStyle(dom);
    const mt = parseFloat(cs.marginTop) || 0;
    const mb = parseFloat(cs.marginBottom) || 0;
    // Where it would sit without our spacers, in unzoomed px from the text top.
    const above = spacers.filter((s) => s.bottom <= r.top + 0.5).reduce((sum, s) => sum + s.height, 0);
    let y = (r.top - root.top - above) / zoom - mt + shift;
    const height = r.height / zoom + mt + mb;

    const start = page * stride;
    const overflows = y + height > start + room + 0.5 && y > start + 0.5 && height <= room;
    if (afterBreak || overflows) {
      const add = (page + 1) * stride - y;
      if (add > 0) {
        decorations.push(Decoration.widget(pos, spacer(add), { side: -1, key: `sp${pos}:${Math.round(add)}`, ignoreSelection: true }));
        keys.push(`${pos}:${Math.round(add)}`);
        shift += add;
        y += add;
      }
      page += 1;
    }
    // A block taller than a page runs on over the next pages.
    if (height > room) page = Math.max(page, Math.floor((y + height - 0.5) / stride));
    afterBreak = node.type.name === 'pageBreak';
  }
  const pages = page + 1 + (afterBreak ? 1 : 0);
  return { decorations: DecorationSet.create(view.state.doc, decorations), pages, key: `${pages}|${keys.join(',')}` };
}

export const Pagination = Extension.create({
  name: 'pagination',
  addProseMirrorPlugins() {
    let frame = 0;
    return [
      new Plugin<State>({
        key: paginationKey,
        state: {
          init: () => ({ decorations: DecorationSet.empty, pages: 1, key: '' }),
          apply(tr, value) {
            const meta = tr.getMeta(paginationKey) as State | 'measure' | undefined;
            if (meta && meta !== 'measure') return meta;
            return { ...value, decorations: value.decorations.map(tr.mapping, tr.doc) };
          },
        },
        props: {
          decorations: (state) => paginationKey.getState(state)?.decorations,
        },
        view: (first) => {
          const schedule = (view: EditorView) => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
              if (!view.dom.isConnected) return;
              const next = measure(view);
              if (paginationKey.getState(view.state)?.key !== next.key) {
                view.dispatch(view.state.tr.setMeta(paginationKey, next).setMeta('addToHistory', false));
              }
              onPages(next.pages);
            });
          };
          schedule(first);
          return {
            update(view, prev) {
              // Only the cursor moved: nothing to measure. (Our own result does
              // trigger one more measure, which finds the same pages and stops.)
              if (view.state.doc === prev.doc && paginationKey.getState(view.state) === paginationKey.getState(prev)) return;
              schedule(view);
            },
            destroy: () => cancelAnimationFrame(frame),
          };
        },
      }),
    ];
  },
});
