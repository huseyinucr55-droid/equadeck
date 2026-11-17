// The floating suggestion list, shared by formulas (math-suggest.ts) and the
// text on the page (text-suggest.ts): a symbol preview and its meaning per
// row, the chosen row highlighted, placed under the caret.
import { convertLatexToMarkup } from 'mathlive';
import type { Suggestion } from '../lib/completions';

let box: HTMLDivElement | null = null;
// Who shows the list right now (a formula or the text): each one only closes
// its own list, so the text editor noticing a change doesn't hide a formula's.
let owner: unknown = null;

export function hideSuggestionBox(who?: unknown) {
  if (who !== undefined && who !== owner) return;
  box?.remove();
  box = null;
  owner = null;
}

export function showSuggestionBox(items: Suggestion[], index: number, under: DOMRect, onPick: (i: number) => void, who?: unknown) {
  if (!items.length) return hideSuggestionBox(who);
  owner = who ?? null;
  box ??= document.body.appendChild(document.createElement('div'));
  box.className = 'doc-suggest';
  box.setAttribute('role', 'listbox');
  box.setAttribute('aria-label', document.documentElement.lang === 'de' ? 'Vorschläge' : 'Suggestions');
  box.replaceChildren(
    ...items.map((s, i) => {
      const row = document.createElement('div');
      row.className = 'doc-suggest-item';
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(i === index));
      const sym = document.createElement('span');
      sym.className = 'doc-suggest-symbol';
      try {
        sym.innerHTML = convertLatexToMarkup(s.latex.replace(/#\?/g, '\\placeholder{}'));
      } catch {
        sym.textContent = s.latex;
      }
      const label = document.createElement('span');
      label.className = 'doc-suggest-label';
      label.textContent = s.meaning;
      row.append(sym, label);
      // Keep the focus where you are typing; pick on click.
      row.addEventListener('mousedown', (e) => e.preventDefault());
      row.addEventListener('click', () => onPick(i));
      return row;
    }),
  );
  box.style.left = `${Math.max(8, Math.min(under.left, window.innerWidth - 300))}px`;
  box.style.top = `${Math.min(under.bottom + 6, window.innerHeight - box.offsetHeight - 8)}px`;
}
