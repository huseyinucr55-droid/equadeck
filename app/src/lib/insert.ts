/**
 * Templates use #0 as the slot for the current selection.
 *   applyTemplate('^{#0}', 'a')   -> { text: '^{a}', cursor: 4 }
 *   applyTemplate('^{#0}', '')    -> { text: '^{}',  cursor: 2 }  (inside the braces)
 *   applyTemplate('\\frac{#0}{}', 'a') -> cursor lands in the empty second {}
 * Without a slot the template is inserted as is, cursor in the first {} or at the end.
 */
export function applyTemplate(tpl: string, selected: string): { text: string; cursor: number } {
  const slot = tpl.indexOf('#0');
  if (slot < 0) {
    const empty = tpl.indexOf('{}');
    return { text: tpl, cursor: empty >= 0 ? empty + 1 : tpl.length };
  }
  const text = tpl.slice(0, slot) + selected + tpl.slice(slot + 2);
  if (!selected) return { text, cursor: slot };
  const empty = text.indexOf('{}', slot + selected.length);
  const bracket = text.indexOf('[]', slot + selected.length);
  const next = [empty, bracket].filter((i) => i >= 0).sort((a, b) => a - b)[0];
  return { text, cursor: next !== undefined ? next + 1 : text.length };
}

export type MatrixKind = 'matrix' | 'pmatrix' | 'bmatrix' | 'vmatrix' | 'Vmatrix' | 'Bmatrix';

/** A rows × cols matrix with empty cells; the cursor goes to the first cell. */
export function matrixTemplate(kind: MatrixKind, rows: number, cols: number): { text: string; cursor: number } {
  const r = Math.max(1, Math.min(12, Math.floor(rows)));
  const c = Math.max(1, Math.min(12, Math.floor(cols)));
  const row = Array.from({ length: c }, () => ' ').join('&');
  const body = Array.from({ length: r }, () => row).join('\\\\\n');
  const open = `\\begin{${kind}}\n`;
  return { text: `${open}${body}\n\\end{${kind}}`, cursor: open.length + 1 };
}

/** "Remove line breaks": join lines and drop \\ separators into spaces. */
export function removeLineBreaks(code: string): string {
  return code
    .replace(/\\\\\s*/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}
