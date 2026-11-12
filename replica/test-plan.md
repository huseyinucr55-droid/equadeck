# Test plan: LaTeX equation editor (clone)

Build: uncommitted working tree, 2026-11-11. Result: 42/42 automated pass (production build, Chrome, 2 workers, 254 s); 1 manual pass; 2 manual not run. Env: local production build (vite preview), Chrome (Playwright `channel: 'chrome'`), fresh browser storage per test.
Scope: the guest editor. There's no backend yet, so the session, payment and other-users cases don't apply (marked n/a).
Every automated spec also fails on any console error or 5xx response, and runs an axe accessibility scan of the screen or dialog it opens.

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | write and download PNG | happy | type an integral, wait for the preview, Download PNG | a valid PNG file named equation.png, transparent background | e2e | pass |
| F01-E1 | | edge: empty input | clear the editor | "appears here" hint; PNG/SVG/PDF/Copy disabled | e2e | pass |
| F01-E2 | | edge: very long input | 300 terms of a sum | renders; the preview scrolls sideways, the page doesn't | e2e | pass |
| F01-E3 | | edge: accents and emoji | `\text{café, naïve, ✓ 😀}` | renders without error | e2e | pass |
| F01-E4 | | edge: refresh mid-flow | type, reload | the same code and size are back | e2e | pass |
| F01-E5 | | edge: dark theme export | dark scheme, export PNG | the ink is dark (export ink), not the white screen text | e2e | pass |
| F01-E6 | | edge: keyboard only | Tab to the editor, type, Tab to Download, Enter | a file downloads with no mouse | e2e | pass |
| F01-E7 | | edge: mobile width | 390×844 | no horizontal page scroll; the preview sits above the editor | e2e | pass |
| F01-E8 | | edge: two tabs | edit in two tabs | no crash; the last edit wins the draft | manual | not run (see to-check) |
| F01-E9 | | edge: slow network / offline | throttle; offline after load | shell first, then the preview; offline after load keeps working | manual | not run (see to-check) |
| F01-N1 | | negative: invalid LaTeX | `\frac{1}{` | after a pause, "Missing close brace"; exports disabled | e2e | pass |
| F01-N2 | | negative: link injection | `\href{javascript:alert(1)}{x}` | an error, no link in the DOM | e2e | pass |
| F01-N3 | | negative: double-click Download | double-click | no crash; the button disables while busy | e2e | pass |
| F01-N4 | | negative: font size out of range | type 200 | inline "8 to 96" hint; the preview keeps the last valid size | e2e | pass |
| F02-H1 | palette builds an equation | happy | type `a+b`, select `a`, click superscript | `^{a}+b` | e2e | pass |
| F02-E1 | | edge: nothing selected | click fraction | `\frac{}{}`; typing goes into the numerator | e2e | pass |
| F02-E2 | | edge: search | "arrow" | arrow keys only; clearing restores the tab | e2e | pass |
| F02-E3 | | edge: search no match | "zzzz" | "No symbols match" | e2e | pass |
| F02-E4 | | edge: keyboard | Tab into the grid, ArrowRight, Enter | the second key's symbol is inserted | e2e | pass |
| F03-H1 | insert matrix | happy | Matrix → Parentheses 3×3 → Insert, type 1 | a pmatrix with 1 in the first cell | e2e | pass |
| F03-E1 | | edge: out of range | rows 0 / 13 | Insert disabled, hint shown | e2e | pass |
| F03-E2 | | edge: cancel | Esc | nothing inserted; focus back on Matrix | e2e | pass |
| F04-H1 | start from an example | happy | Examples → Quadratic formula | the editor holds it; a toast | e2e | pass |
| F04-E1 | | edge: append | Shift+click an example | added below with `\\` | e2e | pass |
| F04-E2 | | edge: undo | after a pick, Undo | the previous code is back | e2e | pass |
| F05-H1 | look up syntax | happy | Reference → Chemistry → click a row | `\ce{H2O}` inserted at the cursor | e2e | pass |
| F05-E1 | | edge: every row renders | open every sheet | no row without a rendered SVG | e2e | pass |
| F06-H1 | undo/redo | happy | type, Undo, Redo | the text goes and comes back | e2e | pass |
| F06-E1 | | edge: limits | fresh page | Undo and Redo disabled | e2e | pass |
| F07-H1 | save an equation | happy | Save | listed, marked current, Save disabled | e2e | pass |
| F07-E1 | | edge: invalid code | broken LaTeX | Save disabled | e2e | pass |
| F07-E2 | | edge: delete + undo | delete, then the toast's Undo | gone, then back | e2e | pass |
| F07-E3 | | edge: limit | 50 already saved, save again | "keep 50" message, nothing added | e2e | pass |
| F07-E4 | | edge: corrupt storage | invalid JSON in `lx.snippets.v1` | an empty list, no crash | e2e | pass |
| F07-E5 | | edge: storage blocked | localStorage throws | the editor still works | e2e | pass |
| F07-E6 | | edge: second user's data | n/a: no accounts (local only) | none | n/a | n/a |
| F08-H1 | reopen a saved equation | happy | click a saved row | code and size loaded; a toast | e2e | pass |
| F08-E1 | | edge: undo after load | Undo | the previous code is back | e2e | pass |
| F09-H1 | recover a password | happy | n/a: no accounts; the Sign in dialog explains | the dialog opens and closes | e2e | pass |
| F10-H1 | export PDF | happy | PDF | equation.pdf starting with %PDF | e2e | pass |
| X-1 | copy | happy | Copy LaTeX | the clipboard holds the code | e2e | pass |
| X-2 | autocomplete | happy | type `\fra`, Enter, type 1 | `\frac{1}{}` | e2e | pass |
| X-3 | privacy page | happy | /privacy | heading, a back link, no errors | e2e | pass |
| X-4 | accessibility | a11y | axe on the editor, every dialog, privacy | no violations | e2e | pass |
| X-5 | screen reader labels | a11y | inspect names | editor, keys, buttons and switches all named | manual (browser) | pass: 57/57 controls named |
| X-6 | keyboard focus order | a11y | Tab through the page at 1440 px | the focus order matches the visual order of the regions | e2e | pass (added for BUG-005) |
