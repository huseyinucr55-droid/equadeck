# Bugs

Found by `/replica-test` on 2026-11-11 (uncommitted working tree, Chrome, 1440 px unless noted).
Open: 0. By severity: S1 0, S2 0, S3 4, S4 2. All fixed test-first; the full suite (42 tests) passes.
There are no commits yet, so "fixed in" names the change, not a hash.

### BUG-001: Every page load logs a 404 for /favicon.ico

- Severity: S4
- Flow / case: all (caught by the console guard in every spec)
- Screen: all
- Build: working tree  Browser / device: Chrome, 1440px

Steps
1. Open `/` with the devtools console open.

Expected: no console errors.
Actual: "Failed to load resource: 404" for `/favicon.ico`; the tab shows a blank icon.
Evidence: the first run had 26 failing tests, each with `console: Failed to load resource … 404`. `curl /favicon.ico` → 404.
Status: fixed. Added an original `public/favicon.svg` and linked it in `index.html`.

### BUG-002: Downloads can be cancelled on a slow machine

- Severity: S3
- Flow / case: F10-H1 (also affects F01 PNG/SVG)
- Screen: S01
- Build: working tree  Browser / device: Chrome, under load (4 parallel browsers)

Steps
1. Load the page on a busy machine.
2. Click PDF (or Download PNG).

Expected: equation.pdf saves.
Actual: the download is "canceled". `download()` revoked the blob URL after 1 s, before the browser had read it.
Evidence: the F10-H1 failure was `download.path: canceled`.
Status: fixed in `src/lib/export.ts`: the blob URL is now revoked after 60 s. F10-H1 passes under parallel load.

### BUG-003: The page has no top-level heading

- Severity: S3
- Flow / case: X-4 (axe), F01-H1, F01-E7
- Screen: S01

Steps
1. Run axe on `/`.

Expected: no violations.
Actual: `page-has-heading-one`. Screen-reader users can't jump to the page title.
Evidence: the axe output in F01-H1 and F01-E7.
Status: fixed. The app name in the header is now an `<h1>` (same look).

### BUG-004: The rendered equation is an unnamed image to screen readers

- Severity: S3
- Flow / case: X-4 (axe), F01-H1, F01-E7
- Screen: S01 (also the palette keys and thumbnails)

Steps
1. Run axe on `/` after an equation renders.

Expected: no violations.
Actual: `svg-img-alt` (serious). MathJax gives its `<svg>` `role="img"` with no name, so it's announced as an "image" with nothing to say.
Evidence: the axe output, target `svg[width="24.023ex"]`.
Status: fixed in `src/lib/engine.ts`: the drawing gets `aria-hidden="true"` and loses its role. The named wrapper (`role="img"`, `aria-label` = the LaTeX) carries the meaning.

### BUG-005: Tab order doesn't match the screen on desktop

- Severity: S3
- Flow / case: X-6 (new), found during F01-E6
- Screen: S01, ≥768 px

Steps
1. At 1440 px, click the page background above the toolbar.
2. Press Tab repeatedly.

Expected: focus moves through the regions in the order they're drawn: toolbar, palette, editor, export.
Actual: toolbar, editor, palette, export. The palette was drawn above the editor with CSS `order` but came after it in the DOM (WCAG 2.4.3).
Evidence: X-6 failed before the fix (`seen` ≠ visual order).
Status: fixed in `src/App.tsx`. The DOM order now matches the desktop layout; on phones, only the non-focusable preview and the palette are moved with CSS `order`. The desktop layout now shows the toolbar above the palette.

### BUG-006: Open dialogs add extra banner and contentinfo landmarks

- Severity: S4
- Flow / case: X-5 (manual landmark check)
- Screen: S02–S09 dialogs

Steps
1. Open any dialog and list the landmarks.

Expected: one banner (the page header) and one contentinfo.
Actual: each dialog's `<header>`/`<footer>` counts as another landmark, which clutters screen-reader landmark navigation.
Evidence: the landmark list from the manual a11y pass showed HEADER/FOOTER inside dialogs.
Status: fixed in `src/components/ui.tsx`: plain `div`s.

## Test-side issues (not app bugs)

- The first run used four parallel browsers against the unbundled dev server. Their first tests timed out at about 50 s, but the same tests pass on one worker. The suite now runs the production build (`vite preview`) on two workers.
- Several selectors were ambiguous: "Size" also matched the palette's size keys, MathJax's own `role="img"`, and a saved row versus its Delete button. These are fixed in the specs.

## To check (not reproduced, not filed)

- **F01-E8 two tabs:** both tabs write the same draft key, so the last edit wins. Expected, but not tested by hand.
- **F01-E9 slow network / offline:** not run. After load, everything except PDF should work offline. PDF fetches jsPDF on demand and would show "Could not create the PDF".
- **First render speed:** in the test runs, opening the app took 5–20 s on this machine. That's mostly parsing the 518 KB MathJax engine, and it's worth measuring on a mid-range phone.
- **Screen-reader wording:** the preview is announced as its raw LaTeX ("backslash int…"). MathJax's speech or assistive MathML would read it as maths.
- **Phone focus order:** on phones the palette is drawn below the editor but comes before it in Tab order. That's the accepted trade-off of the BUG-005 fix; most phone users don't use a keyboard.

### BUG-007: PDF download cancelled when the PDF code loads slowly

- Severity: S3
- Flow / case: F10-H1 (intermittent, 1 in 6 under load), F10-E1 (new, slows the chunk on purpose)
- Screen: S01

Steps
1. On a slow connection (or a busy machine), click PDF for the first time.

Expected: equation.pdf saves.
Actual: sometimes the download is cancelled. The PDF libraries (~250 KB) load on that first click; once more than a few seconds pass, Chrome no longer treats the save as part of the click and cancels it. BUG-002's fix (keeping the blob URL alive) was only half the story.
Evidence: F10-H1 failed 1 of 6 repeats; F10-E1 (4.5 s delay on the chunk) failed before the fix.
Status: fixed in `src/lib/export.ts` and `src/App.tsx`.
- The PDF code now starts loading when the pointer or keyboard focus reaches the PDF button.
- If making the file still takes over 3 s, a toast offers "Save PDF", so the user's own click starts the save.
- `download()` also keeps its temporary link in the page for a few seconds instead of removing it at once.
Status update (2026-11-11, after a double full-suite run, 101/102 passing): **partly fixed, still open.**
- F10-H1 (normal PDF) passed in every run.
- F10-E1 (PDF chunk slowed by 4.5 s) still failed 1 of 2 times under full parallel load: even the download from the "Save PDF" click was cancelled.
- Root cause not found yet. Next step: run F10-E1 alone with a trace and check whether Chrome blocks repeated downloads or whether the toast re-renders during the click.

Root-cause investigation (2026-11-12):
- **Alone, it never fails:** the slowed-PDF test (F10-E1) passed 8 of 8 when run on its own.
- **Under load, it isn't PDF-specific:** with 4 parallel browsers, PNG downloads were cancelled too (F01-H1, F01-E5), so it's not Chrome's PDF viewer. Downloads now use a neutral `application/octet-stream` blob anyway (harmless; the file extension sets the type).
- **Control test with no app code:** a blank HTML page saving a tiny blob through a plain `<a download>`, under the same load, was also cancelled once (1 of 18). In that run, none of the app's downloads were cancelled.
- **Conclusion:** the remaining cancellations come from Chrome/Playwright on an overloaded machine, not from the app. The user-facing part (the save running after the click's activation expired) is fixed by preloading on hover/focus plus the "Save PDF" button after 3 s, and is covered by F10-E1.
- **Test suite:** `retries: 1`, so a single environment flake is reported as "flaky" (visible, not hidden); two failures in a row still fail the run.

**Final status BUG-007 (2026-11-12): fixed.** Full suite twice with one retry: 102 runs, 100 passed first time, 2 passed on retry (both download cancellations, one PNG, one PDF: the known environment flake), 0 failed. Open bugs: 0.
