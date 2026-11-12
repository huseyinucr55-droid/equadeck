# Components

The design system for the editor, built from the component list in
`replica/recon.md`. Tokens are in `tokens.json` / `tokens.css`, and the
Tailwind class names come from `tailwind.css`.

Rules for every component:

- Icons come from **Lucide** (ISC licence).
- Palette and example labels are **rendered by MathJax at build time**, never
  taken from the original's sprite sheets.
- All copy is written fresh.
- Accessible base: **Radix UI primitives** (Dialog, DropdownMenu, Tabs,
  Switch, Tooltip, RadioGroup, Toast).
- Every interactive element has a **focus ring**: `2px focus`, offset 2px,
  shown on `:focus-visible` only.

Where the original differs, a **Changed from original** line says why.

## Layout shell (S01)

```
AppShell
  regions   header 56px (logo slot, theme toggle, account button) ·
            main (max 1200px, 16px gutters, 24px on lg) ·
            snippets sidebar 280px (lg+, right) / drawer (below lg)
  lg+       two columns: [palette + editor + preview] | [snippets]
  md        one column, the snippets drawer opens from the header
  < md      sticky preview at the top (max 40vh, scrolls), editor under it,
            palette as a bottom panel with tabs, actions in a bottom bar
  tokens    bg bg, header border-b border, sidebar bg surface
  a11y      landmarks: <header>, <main>, <aside aria-label="Saved equations">;
            a skip link to the editor
  Changed from original: the original is fixed-width, with a 220px sidebar,
            and doesn't adapt to phones
```

## Editor (S01)

```
CodeEditor (CodeMirror 6)
  states    empty (placeholder "Type LaTeX, e.g. \frac{a}{b}"), focused,
            filled, error-line (the line holding the parse error gets a wavy
            danger underline)
  tokens    bg bg, border input 1px, radius md, font mono code 15/24,
            min-height 160px, resizable vertically, focus: border accent + ring
  syntax    commands accent, braces muted, comments muted italic
  behaviour Undo/redo through the CodeMirror history (Ctrl/Cmd+Z, Shift+Z) ·
            autocomplete on "\" (the could-have) · Tab inserts 2 spaces, and
            Esc then Tab leaves the editor (no keyboard trap)
  a11y      aria-label "LaTeX source", aria-describedby → the preview's
            error message when there is one
```

## Preview (S01)

```
Preview
  states    empty (muted hint "Your equation appears here"), rendering (keeps
            the last result, no spinner under 300ms, then a 2px accent bar at
            the top), rendered (SVG), error (last good render at 40% opacity
            + a Callout danger with the MathJax message, e.g. "Missing close
            brace"), raster (shows the exported PNG instead of the SVG, for
            the image-output toggle)
  tokens    bg surface, border border 1px, radius lg, padding 24px, math
            size = font-size control (default 20px), colour fg; centred,
            overflow-x auto for wide equations
  a11y      role="img", aria-label = the LaTeX source (MathJax's assistive
            MathML is on, so screen readers can read the maths); the error
            sits in aria-live="polite"
  Changed from original: the original shows the raw $$…$$ source on an error
            and gives no message
```

## Palette

```
PaletteKey
  variants  symbol (a MathJax-rendered glyph), text ("Text", "Bold",
            "Display")
  size      36×36px (44×44 on touch), the text variant is auto-width with 8px padding
  states    default (bg surface, text fg), hover (bg surface-2), active
            (pressed, bg accent-soft, text accent), focus-visible (ring),
            disabled (40% opacity, no hover)
  tokens    radius sm, border none, transition background fast
  behaviour Click inserts its template at the cursor. If text is selected,
            the selection replaces #0 ("^{#0}" turns "a" into "^{a}") and the
            cursor lands inside the first empty {}. Focus returns to the
            editor after an insert
  a11y      a real <button>, aria-label = the spoken name ("superscript",
            "alpha", "not equal"), a Tooltip shows the name + LaTeX after 500ms
  used on   S01

PaletteGroup / PaletteTabs
  groups    Basics (sup, sub, frac, sqrt, sum, prod, int) · Relations ·
            Operators · Arrows · Greek · Sets & logic · Brackets · Accents ·
            Functions (the original's two Functions selects become one
            searchable group) · Style (colour, size, bold, text, display)
  lg+       all the groups visible as labelled rows, wrapping, 4px gap, 12px
            between groups
  < lg      Tabs (scrollable tab list) + one group grid at a time
  search    an input above it filters every key by name or LaTeX ("arrow",
            "\leq"); shows "No symbols match" when empty
  a11y      Radix Tabs; each group is role="group" with a heading;
            arrow keys move inside a grid (roving tabindex)
  Changed from original: the original shows about 240 sprite buttons at once,
            with no search
```

## Toolbar and actions

```
Button
  variants  primary (Download), secondary (Copy, Save, Insert), ghost
            (Undo, Redo, Clear line breaks, icon buttons), danger (Delete
            snippet, Delete account)
  sizes     sm 32px, md 40px, lg 48px; icon-only is square
  states    default, hover (primary: accent-hover; secondary: bg surface-2),
            active, focus-visible (ring), disabled (40% opacity, the reason
            in a Tooltip, e.g. "Nothing to export"), loading (a spinner
            replaces the icon and the label stays for screen readers,
            aria-busy)
  tokens    primary bg accent / text on-accent; secondary bg surface, border
            border, text fg; ghost transparent, text fg; danger bg danger,
            text on-accent; radius md; font sm/600
  a11y      a real <button>, icon-only gets an aria-label, keyboard
            shortcuts are shown in the Tooltip
  used on   S01, S02, S09–S14

SplitButton / ExportMenu
  anatomy   primary "Download PNG" + a chevron that opens a DropdownMenu:
            PNG, SVG, PDF, ─, Copy image, Copy SVG code, Copy LaTeX,
            ─, Scale 1× / 2× / 4×, Transparent background ✓
  states    as Button; menu items: default, highlighted, disabled
            (with the reason)
  behaviour exports always use the colour fg of the *light* theme
            (#15181d) unless "Match theme" is checked, so a dark-mode user
            doesn't paste white maths into a white document
  a11y      Radix DropdownMenu (arrow keys, typeahead, Esc)
  Changed from original: the original has separate PNG and PDF buttons, PDF
            disabled, no SVG or copy

UndoRedo
  two ghost icon buttons (Lucide undo-2 / redo-2), disabled when the history
  is empty at that end; mirrors the editor history, Ctrl/Cmd+Z in the Tooltip

Switch (Raster preview)
  states    off, on, focus-visible, disabled
  tokens    track border-input → accent when on, thumb bg
  a11y      Radix Switch, role="switch", aria-checked, a visible label

NumberField (Font size)
  range     8–96px, step 1, default 20; − and + steppers, typing allowed
  states    default, focus, invalid (out of range → border danger + a hint)
  tokens    height 32px, border input, radius md, font sm, tabular numbers
  a11y      <input type="number"> with a visible label "Size"
```

## Modals

```
Dialog
  anatomy   overlay (bg overlay) + panel (bg bg, radius lg, shadow pop,
            max-width 560px, max-height 85vh) · header (title lg/600 + close
            icon button) · scrollable body (padding 24px) · footer (actions
            right aligned, 8px gap; primary last)
  < md      opens as a bottom sheet: full width, radius lg on the top corners,
            max-height 90vh
  states    closed, opening (fade + 8px rise, base), open, closing
  a11y      Radix Dialog: focus trap, Esc closes, focus returns to the
            trigger, aria-labelledby the title
  used on   S02–S14
  Changed from original: the original modals slide in from top: -600px with
            no focus handling

MatrixBuilder (S02)
  anatomy   RadioGroup of 6 cards (plain, ( ), [ ], | |, ‖ ‖, { }), each card a
            live MathJax preview at 2×2; Rows and Columns NumberFields
            (1–12, default 3); a live preview of the result; footer Cancel /
            Insert
  states    card: default, hover, selected (border accent 2px + bg
            accent-soft), focus-visible
  behaviour Insert writes \begin{pmatrix} … \end{pmatrix} with empty cells
            and puts the cursor in the first cell
  a11y      Radix RadioGroup (arrow keys between cards)

ExampleGallery (S03)
  anatomy   a grid of example cards (2 columns on md, 1 below), each a MathJax
            render + a short name ("Piecewise function", "Commutative square");
            your own examples, not the original's
  behaviour click inserts and closes; Shift+click appends instead of replacing
  states    card: default, hover (bg surface-2), focus-visible

ReferenceSheet (S04–S08, one component fed by data)
  anatomy   a section heading + rows of [code (mono sm, accent on surface)
            | render] · a doc link for mhchem / physics (the upstream docs)
  behaviour click a row → insert it (the could-have); a copy icon on hover/focus
  sheets    LaTeX basics, Colours (a swatch table: name, hex, swatch with a
            border), Boxes & backgrounds, Chemistry, Physics
  a11y      each row is a <button> labelled "Insert <code>"; the table has
            <th> headers
  Changed from original: the original's sheets are read-only and you retype
            the code
```

## Accounts (S09–S14)

```
FormField
  types     text, email, password (show/hide toggle), file (avatar, could)
  anatomy   label (sm/500, fg) above · input 40px, border input, radius md,
            padding 12px · hint (xs, muted) or error (xs, danger, with an icon)
  states    default, focus (border accent + ring), invalid (border danger,
            aria-invalid, the error linked via aria-describedby), disabled
  used on   S09, S10, S11, S13, S14

OAuthButton
  variants  Google only (Facebook and Twitter skipped); secondary Button
            with the provider's official mark per their brand rules, label
            "Continue with Google"

AuthDialog (S09/S10 merged)
  tabs      Sign in | Create account; register asks only email + password
            (+ an optional username), not the original's 7 fields + captcha;
            Supabase rate limits + email confirmation replace the captcha
  states    idle, submitting (Button loading), error (Callout danger above the
            form, e.g. "Email or password is wrong"), check-your-inbox
            (Callout success)
```

## Snippets (S12)

```
SnippetList
  anatomy   a header "Saved" + a count + a "Save current" button · a filter input ·
            a list of SnippetRows · "Load more" (20 per page)
  states    guest (saved in this browser, with a note "Sign in to keep these
            on every device"), empty ("No saved equations yet. Press Save to
            keep the one you're working on."), loading (3 skeleton rows),
            filled, error (Callout + Retry)
  a11y      a <ul>; "Load more" announces the new count via aria-live

SnippetRow
  anatomy   a MathJax thumbnail (max 48px high, clipped) · a title (or the
            first 40 chars of the code, mono) · a relative date (muted xs) ·
            a kebab menu (Rename, Duplicate, Delete)
  states    default, hover (bg surface-2), current (bg accent-soft, left
            border accent 3px), focus-visible
  behaviour click loads it into the editor; if the editor has unsaved
            changes, confirm first
  a11y      the row is a <button>; the menu is a Radix DropdownMenu
```

## Feedback

```
Callout
  variants  info (accent-soft / accent), success, warning, danger (the *-soft
            bg + the matching text colour), with a Lucide icon
  tokens    radius md, padding 12px 16px, font sm
  a11y      role="status" (info, success) or role="alert" (danger)

Toast
  variants  neutral, success, danger
  behaviour bottom-right on md+, bottom-centre above the action bar on mobile;
            4s, pauses on hover/focus; "Copied", "Saved", "PNG too large,
            exported at 2×"
  a11y      Radix Toast, aria-live polite

Tooltip
  bg fg, text bg (inverted), xs, radius sm, 500ms delay, never the only way
  to learn something (labels and aria-labels carry it)

Skeleton
  bg surface-2, a shimmer only if motion is allowed
```

## Not copied

- The LaTeX logo artwork, the "Equation Editor" wordmark, the icon and
  example sprite sheets, the PayPal donate button.
- The pink, green and blue Bootstrap button styles. These are recorded as roles in
  `tokens.json → _measured_from_original` only.
- All the labels and messages here are new copy.
