# Recon map: Online LaTeX Equation Editor by Lagrida (web)

Scope: the equation editor itself. Type LaTeX or click symbols, see a live preview, export an image or PDF, and save snippets to an account.
For: the user's own product (confirmed 2026-11-11). Not a resale clone, so favour cheap hosting and a guest-first editor. Accounts can come later.
Date: 2026-11-11

Method: one human-speed session on the public page, logged out. I recorded the visible UI and DOM element IDs (to name screens and states). I did not read JS bundles, log network calls, or use any account. I found no terms-of-service page, only a privacy policy.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | the app (guest) | https://latexeditor.lagrida.com/ | single-page editor. All screens below come from here |
| 2 | privacy policy | https://latexeditor.lagrida.com/privacy_policy | Morocco-based. Collects email, first and last name. Google, Facebook and Twitter login. Updated 2021-12-12 |
| 3 | mhchem docs (linked from app) | https://mhchem.github.io/MathJax-mhchem/ | chemistry syntax the app supports |
| 4 | physics package (linked from app) | https://ctan.org/pkg/physics?lang=en | physics macros the app supports |
| 5 | review roundup | https://help.lessonup.com/en/articles/14431773-online-latex-editors | describes a symbol palette, colour support and saving gated behind an account |
| 6 | Reddit r/LaTeX thread | https://reddit.fsky.io/r/LaTeX/comments/1jb3skr/i_created_an_online_latex_editor_with | a user says it has no SVG export and no autocomplete |
| 7 | competitors (positioning) | https://editor.codecogs.com/ , https://vexlio.com/equation-editor/ | the same category. Useful for /replica-entrepreneur |

There is no help center, pricing page, changelog, app-store listing or public API. Donations go through PayPal ("make a donation" to raise the weekly save quota).

## Core loop

Type or click together an equation, check it in the live preview, and download it as an image to paste into a document or slide.

## Screens

The whole app is one page (S01). Everything else is a modal over it.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Editor | `/` | write LaTeX and see it rendered | 4 insert dropdowns (Functions, Functions 2, Color, Size), symbol palette (about 240 buttons in groups), toggles (Displaystyle, Text, TextBf, binomials), Image output checkbox, Font size number input, Remove Line breaks, undo and redo arrows, Download PDF, Download Image, Add Code, textarea, preview pane, right sidebar (logo, login/register, quota text, saved codes, donate, footer) | empty, filled (SVG preview), render error (raw source shown wrapped in `$$\displaystyle{\displaylines{…}}$$`), image output (preview becomes a raster IMG), Download PDF disabled for guests, redo disabled with no history, mobile (not responsive: the desktop layout shrinks) |
| S02 | Matrices modal | toolbar "Matrices" | insert an n×m matrix | 6 radio cards (plain, ( ), [ ], \| \|, ‖ ‖, { }), Rows input, Columns input, Close, Apply | default 3×3, plain |
| S03 | Examples modal | toolbar "Examples" | start from a template | grid of 7 or more preview tiles (aligned equations, sums and products, function maps, cases, commutative diagram, overbrace/underbrace). Click inserts and closes | filled |
| S04 | LaTeX reference modal | toolbar "LaTeX" | cheat sheet | sections: special symbols, spaces, delimiter sizes, fractions. Each shows code and its render | filled, scrolling |
| S05 | Colors reference modal | toolbar "Colors" | colour names | table of about 88 rows: base colours and dvipsnames, with name, HEX and RGB | filled |
| S06 | Backgrounds reference modal | "Backgrounds" | boxed and coloured backgrounds | bbox, bbox with hex, bbox with padding, boxed, framebox, framebox with width, colorbox | filled |
| S07 | Chemistry reference modal | "Chimestry" (sic) | mhchem syntax | sections: ce, precipitate and gas, concentration, brackets, examples, plus a doc link | filled |
| S08 | Physics reference modal | "Physics" | physics package syntax | eval, order, comm, grad, div, curl, laplacian…, plus a doc link | filled |
| S09 | Login modal | sidebar LOGIN | sign in | Google and Facebook buttons, email, password, Log In, Close | seen in DOM only |
| S10 | Register modal | sidebar REGISTER | create an account | Google and Facebook sign-up, username, email, first name, last name, profile image, password, repeat password, captcha | seen in DOM only |
| S11 | Forgot password modal | "Forgot your password?" | reset by email | email, captcha, Send | seen in DOM only |
| S12 | Saved codes list | sidebar, logged in | reopen saved snippets | "Your codes (n)" list from a template, "Select page" pagination | inferred from hidden DOM |
| S13 | Edit profile modal | profile dropdown | change name or avatar | (guess) same fields as register | inferred |
| S14 | Edit password modal | profile dropdown | change password | (guess) old, new, repeat | inferred |
| S15 | Privacy policy | `/privacy_policy` | legal | long text | filled |
| S16 | Global error banner | any failed action | show errors | dismissible red box (×) | hidden |

Reference screenshots are in `replica/screens/` (S01 empty, filled, error, image-output, mobile; S02, S03, S04).

## Flows

```
F01 Write an equation and download it as an image   (the core loop)
    S01 type -> live preview -> Download Image
    happy path clicks: 1 (plus typing)
    edge: invalid LaTeX (preview shows raw source and no error message), empty input, very wide equation, font size changed

F02 Build an equation with the palette, no LaTeX knowledge needed
    S01 select text -> click symbol (wraps the selection: "a" -> "^{a}") -> preview
    happy path clicks: 1 per symbol
    edge: nothing selected (inserts at the cursor), dropdown inserts like \color{Red}

F03 Insert a matrix
    S01 -> S02 pick a bracket style -> rows and cols -> Apply -> S01
    happy path clicks: 4 (open, style, Apply, plus editing two inputs)
    edge: 0 or a huge row count, non-numeric input

F04 Start from an example
    S01 -> S03 click tile -> S01 (inserted, modal closes)
    happy path clicks: 2

F05 Look up syntax
    S01 -> S04 / S05 / S06 / S07 / S08 -> read -> Close
    happy path clicks: 2. The user copies code by hand; there is no click-to-insert in the reference modals

F06 Undo or redo an edit
    S01 left arrow (previous) / right arrow (next)
    edge: redo disabled at the head of history

F07 Register and save a snippet
    S01 -> S10 (fill in 7 fields plus captcha, or Google/Facebook) -> S01 Add Code -> S12 shows the code
    happy path clicks: about 4 with OAuth
    edge: weekly quota reached (4 per week), duplicate username or email, captcha failure

F08 Reopen a saved snippet
    S12 click a code -> S01 loads it
    edge: pagination

F09 Recover a password
    S09 -> S11 email + captcha -> Send -> email link (not observed)

F10 Export a PDF
    S01 Download PDF (disabled as guest; the button also calls swithLaTeXMode. Guess: only enabled in another mode or when logged in)
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Symbol button | icon (sprite), text (Displaystyle, Text, TextBf) | default, hover, pressed | S01 (about 240 instances) |
| Insert dropdown (select) | Functions, Functions 2, Color, Size | default, open | S01 |
| Panel button | pink "opens modal" (Matrices, Examples, LaTeX, Colors, Backgrounds, Chemistry, Physics) | default, hover | S01 |
| Action button | with icon (Download PDF, Download Image, Add Code), plain (Remove Line breaks) | default, disabled | S01 |
| Arrow button | previous, next | enabled, disabled | S01 |
| Checkbox toggle | Image output | on, off | S01 |
| Number input | font size | default 20 | S01 |
| Textarea | LaTeX source, monospace, resizable | empty, focused, filled | S01 |
| Preview pane | SVG render, IMG render, raw-source fallback | rendered, error | S01 |
| Modal | header + × , scroll body, footer (Close / Apply) | closed (off-screen top), open with dim overlay | S02–S14 |
| Radio card | matrix bracket style | selected, unselected | S02 |
| Example tile | preview image, click inserts | default, hover | S03 |
| Code + render row | code (red monospace) above its render | static | S04, S06–S08 |
| Colour table | name, HEX, RGB, swatch | static | S05 |
| Form field | text, email, password, file, captcha | default, error | S09–S14 |
| OAuth button | Google, Facebook | default | S09, S10 |
| Sidebar | guest (login, register, quota text), user (profile dropdown, saved codes, pagination) | guest, logged in | S01 |
| Error banner | dismissible | hidden, shown | S16 |
| Loading overlay | "Loading..." full-screen | hidden, shown | all (overlay2) |

## Inferred data model

```
User         id, username (unique), email (unique), first_name, last_name, avatar_url,
             password_hash (nullable when OAuth), oauth_provider (google | facebook | twitter),
             weekly_quota (default 4), created_at
             evidence: S10 register fields, privacy policy, sidebar text "4 LaTeX codes per week"
             confidence: high for fields, guess for weekly_quota as a stored column

LatexCode    id, user_id, code (text), created_at
             evidence: Add Code button, "Your codes (n)" list, latex_code_template, pagination
             confidence: high for existence, guess for extra fields (title? render settings?)

Donation     id, user_id, amount, provider (paypal), quota_granted, created_at
             evidence: "To increase your number of codes per week, make a donation" + paypal.me link
             confidence: guess (may be handled by hand)

PasswordReset  token, user_id, expires_at
             evidence: S11
             confidence: medium

EditorHistory  client-side stack of textarea states (undo/redo arrows), never stored on the server
             evidence: previous and next buttons, next disabled at head
             confidence: medium
```

Relationships: User 1-n LatexCode, User 1-n Donation, User 1-n PasswordReset.

Rendering: the preview is MathJax 3 with SVG output (seen in the DOM: `MathJax-script`, `mjx-container[jax=SVG]`), with the mhchem, physics, bbox and color extensions. MathJax is open source (Apache-2.0), so the clone can use it directly. Image output swaps the SVG for a raster IMG. Whether it is rasterised in the browser or on a server is not known.

## Feature matrix

See `features.csv`. Must: 12, should: 12, could: 8, skip: 4.

## Out of scope (cannot or should not be cloned)

- The "Lagrida" name, the LaTeX logo artwork, and the sprite sheets of button icons and example tiles. Redraw them, or render the button labels with MathJax itself.
- The example set as images. Write your own example equations.
- Users' saved codes and accounts.
- The PayPal donation link and the donation-for-quota arrangement as is. Pick your own monetisation in /replica-entrepreneur.
- Facebook and Twitter login need app review and are low value. Start with Google plus email.

## Gaps worth beating (from the session and the public reviews)

- Not responsive on mobile.
- No SVG export (Reddit) and no copy-to-clipboard for the image or for the code (LessonUp).
- No autocomplete for LaTeX commands.
- No error message when the LaTeX is invalid. It silently shows the raw source.
- Reference modals are read-only. Clicking a sample should insert it.
- The PDF export is disabled with no hint why.
- A 4-snippets-per-week cap behind registration. Local or no-account saving would beat it.

## Size

Screens 16 (about 8 distinct to build, since S04–S08 share one modal pattern). Flows 10. Entities 3, plus client-side history.
Hard parts:
1. Faithful, fast rendering of all supported syntax (mhchem, physics, colours, bbox) and a clear error state. MathJax solves most of it.
2. Pixel-accurate export: PNG at a chosen font size with a transparent background, SVG, and PDF.
3. The about 240-button palette with selection-aware insertion, organised and searchable without becoming a wall of icons.
Accounts, quota and OAuth are routine.

Size: **S** (a weekend) for the guest editor with exports. **M** (a couple of weeks) with accounts, saved snippets, quota and a responsive redesign.
