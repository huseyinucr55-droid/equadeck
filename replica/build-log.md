# Build log

App: `app/` (Vite 8 + React 19 + TypeScript + Tailwind 4 + CodeMirror 6 + MathJax 3.2).
Run it: `npm --prefix app install` once, then `npm --prefix app run dev`.

| screen | date | status | missing | harder than expected |
| --- | --- | --- | --- | --- |
| S01 Editor | 2026-11-11 | done | none for the guest editor | MathJax's CommonJS `version.js` calls `require()` (fixed with a `PACKAGE_VERSION` define). Clicking the empty part of the editor didn't focus it. Half-typed commands flashed errors (errors now wait 700 ms). A stale render could be exported (export now waits until the preview matches the code) |
| S02 Matrix dialog | 2026-11-11 | done | none | the opening click closed the native `<dialog>` (fixed: close only when the press starts on the backdrop). Focus returned to the button instead of the editor |
| S03 Examples | 2026-11-11 | done | none | none |
| S04 LaTeX basics sheet | 2026-11-11 | done | none | `\%` inside `\text{}` isn't processed by MathJax (row rewritten) |
| S05 Colours sheet | 2026-11-11 | done | none | MathJax has no `HTML` colour model, so `\color[HTML]{…}` fails. The sheet shows `\color{#hex}` and `[RGB]` instead |
| S06 Boxes sheet | 2026-11-11 | done | none | none |
| S07 Chemistry sheet | 2026-11-11 | done | none | none |
| S08 Physics sheet | 2026-11-11 | done | none | physics redefines `\div` as divergence, so the palette's "divide" key now inserts `÷` |
| S09–S11 Sign in / register / reset | 2026-11-11 | stub | everything; needs /replica-backend | none |
| S12 Saved list | 2026-11-11 | done for guests (localStorage) | account sync; needs /replica-backend | a long code line pushed the delete button outside the panel (fixed with min-w-0) |
| S13–S14 Profile / password | not started | none | everything; needs /replica-backend | none |
| S15 Privacy | 2026-11-11 | draft | a legal review before launch | none |
| S16 Error banner | 2026-11-11 | done as the inline Callout + toasts (with Undo) | none | none |

## Performance (production build, gzipped)

| chunk | size | loads |
| --- | --- | --- |
| app shell (React, CodeMirror, UI) | 185 KB | first paint (target was 300 KB, was 746 KB) |
| MathJax engine + TeX fonts | 518 KB | right after first paint |
| mhchem + physics | 14 KB | first `\ce`/physics macro, or when idle |
| jsPDF + svg2pdf (+ helpers) | ~250 KB | only when PDF is clicked |

## Checked in the browser (2026-11-11)

- Milestone 1–2 checks (see git history once committed): palette wrap, undo, error state, PNG, matrix, search, the 390 px layout.
- Examples: all 12 render (incl. physics and chemistry). A click replaces the content and focus returns to the editor.
- Reference: all 98 rows across 5 sheets render; clicking a row inserts at the cursor and closes the dialog.
- PDF: valid `%PDF-1.3`, the page sized to the equation (132×31 pt), dark ink.
- Preview as image: shows the PNG and hides the SVG; turning it off restores the SVG.
- Saved: Save adds the equation and marks it current (Save then disables). Delete removes it with an Undo toast, and Undo restores it.
- Autocomplete: `\fra` → `\frac` → Enter → `\frac{1}{}` with the cursor in the numerator.
- No error while typing `\fr`; the message appears about 0.7 s after typing stops.
- 390×844: no horizontal scroll, sticky preview, the saved panel below the editor.

## Known issues / notes

- The MathJax engine chunk (518 KB gz) is mostly SVG font data. It loads after paint, so typing works at once, but the first render waits for it on slow connections. A service worker (PWA) would cache it after the first visit.
- Deviations from components.md: native `<dialog>` and `title` tooltips instead of Radix; palette tabs at every width; Tab doesn't insert spaces.
- Screenshots in `replica/clone-screens/` are from the in-app browser, which scales and compresses them. Use them for layout diffs, not colour.
- Not committed: the folder isn't a git repository yet.

## 2026-11-11: fixes F1 and F2 (from /replica-entrepreneur)

| item | status | notes |
| --- | --- | --- |
| F1 Copy for Word / PowerPoint | done | MathML via MathJax's serialiser (`toMathML` in `engine.ts`); Office paste not verified by hand yet; no Google Docs path |
| F2 Packages-needed line + Copy as LaTeX | done | `lib/packages.ts` (static command → package map) + `components/PackagesLine.tsx` |
| BUG-007 PDF download cancelled on slow loads | fixed (remaining cancellations shown to be Chrome/Playwright under load; suite retries once and reports them as flaky) | preload on hover/focus; "Save PDF" toast after 3 s; the download link is kept briefly |
