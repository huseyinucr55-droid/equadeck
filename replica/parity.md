# Parity: LaTeX equation editor vs latexeditor.lagrida.com

Date: 2026-11-11. Build: uncommitted working tree (42/42 e2e passing, 0 open bugs).
Tools: `parity.py` (features), `imgdiff.py` layout mode (structure only, colour ignored).

## Verdict: **shippable** (as a guest editor)

- All the original's must-haves are done: 11 of 11. ("Responsive layout" is a must-have the original doesn't have, so it isn't scored.)
- The feature score is 85, above the 80 bar.
- There are no open S1 or S2 bugs (6 found in testing, all fixed).
- It isn't yet "better than the original" by the pack's definition: that needs the fixes from `/replica-entrepreneur`, which hasn't run. It already beats the original in several places (see the behaviour diff below).

## Scores

| measure | score | notes |
| --- | --- | --- |
| **Overall** | **71.5** | the tool's blend of features and layout |
| Features | **85.0** | 26 features counted; the whole gap is accounts |
| Layout (mean of 5) | 17.7 | "different" on every screen. Mostly deliberate, see below |

### Features by area

| area | score | |
| --- | --- | --- |
| editor | 100 | |
| palette | 100 | |
| export | 100 | |
| insert | 100 | |
| reference | 100 | |
| accounts | **0** | 6 features, all needing a backend |

### Layout per screen

| screen | score | comparable? | what differs |
| --- | --- | --- | --- |
| S01 editor, 1440×900 | 26.1 | yes: same state, same viewport, both light | The original stacks three dense rows of symbol buttons and two dropdown rows above a borderless preview. The clone has a toolbar, one tabbed palette row, a bordered preview card and an export bar. The macro layout matches: a centre column (symbols → editor → preview → export) and a right sidebar (account / saved). |
| S01 editor, 390 px | 7.2 | **no**: the original has no phone layout. Its capture is the whole desktop page shrunk (1600×3461); the clone's is a real phone viewport | This is the responsive design doing its job. Not a gap. |
| S02 matrix dialog | 17.1 | rough: the original was captured at 1400 px, the clone at 1440 px in dark mode | Same content (6 bracket styles, rows, columns, apply). The clone uses labelled cards and a footer bar. |
| S03 examples | 18.0 | rough (as S02) | The original has 7 image tiles of its examples; the clone has 12 of its own with names. Different content on purpose. |
| S04 LaTeX reference | 20.1 | rough (as S02) | The clone merges five read-only sheets into one tabbed dialog with click-to-insert rows. |

The layout score is low on purpose. The design pass rebuilt the system (roles, components, states), not the look. The original's exact grid of icon buttons is part of its trade dress and would change before launch anyway. What a switcher needs is there: the same regions in the same order, the same top-to-bottom flow, and the same right-hand account column. The one familiarity gap worth considering is next-step item 2.

Diff images: `replica/diffs/S01.png`, `S01-mobile.png`, `S02.png`, `S03.png`, `S04.png` (red = cells where the structure differs). Screenshots: `replica/screens/` (original) and `replica/clone-screens/` (clone), taken in the in-app browser.

## Missing features, in build order

1. [should] Account with email and password (S09–S11)
2. [should] Google sign-in
3. [should] Save equations to an account and reopen them on any device (S12 sync)
4. [could] Edit profile and password (S13–S14)
5. [could] Password reset by email
6. [could] A weekly save quota with an upgrade. Optional: only if you decide to charge. Guests currently get 50 local saves with no account.

All six need `/replica-backend` (Supabase, schema in `replica/schema.sql`).

Left out on purpose: Facebook/Twitter login, the Lagrida brand and sprites, the PayPal donation-for-quota scheme, and the original's users and data.
The clone's own additions (not scored): a responsive layout, SVG export, copy image or code, autocomplete, click-to-insert reference sheets, and saving without an account.

## Behaviour diff

| flow | the original does | the clone does | fix or keep |
| --- | --- | --- | --- |
| F01 write + export | type → live preview → Download Image: **1 click**. PDF is disabled for guests. No SVG or copy. | type → live preview → Download PNG: **1 click**. Also SVG, PDF, copy image or LaTeX, 1–4× scale. | keep. More formats in the same click count. |
| F01 invalid LaTeX | shows the raw `$$\displaystyle{…}$$` source with no message | keeps the last good render dimmed, shows MathJax's message after a 0.7 s pause, and blocks export | keep (better) |
| F02 palette | about 240 buttons visible at once: any symbol in **1 click**, but a wall of icons | 1 click in the open tab, **2 clicks** for another group, or search | keep, but consider a "show all" desktop view for switchers (next steps #2) |
| F02 selection wrap | `a` selected + superscript → `^{a}` | the same | parity |
| F03 matrix | Matrices → style → rows, cols → Apply (**4 actions**) | Matrix → style → Insert (**3** at the 3×3 default). The cursor lands in the first cell. | keep |
| F04 examples | Examples → tile (**2 clicks**) | the same, plus Shift+click to append; Undo restores | keep |
| F05 reference | read-only sheets; **retype** the code by hand | click a row to insert it (**3 clicks, no typing**) | keep (better) |
| F06 undo/redo | arrow buttons | buttons + Ctrl/Cmd+Z, disabled at the ends | parity |
| F07 save | register first (7 fields + captcha), then Add Code. **4 saves a week.** | **1 click** with no account, up to 50 in this browser. Delete has an Undo. | keep for guests; **gap**: no cross-device sync until accounts exist |
| F08 reopen | from the account's list | from the local list; Undo restores what you had | parity (local only) |
| F09 password reset | yes | none (no accounts yet) | **gap**, with accounts |
| Remembered between visits | not checked on the original | the draft, size, theme and saved list (this browser) | none |
| Phones | desktop page shrunk to fit; tiny targets | a real phone layout: sticky preview, 44 px keys | keep (better) |
| Emails | password-reset email (not observed) | none | with accounts |

## Top five to build next

1. **Accounts and sync** (`/replica-backend`). This closes all six missing features: email and Google sign-in, saved equations on every device, reset and profile. It lifts the feature score from 85 to 100. Guest saves import on the first sign-in, because the local format already matches the `snippets` table.
2. **A "show all symbols" palette view on desktop.** One toggle that lays all groups out at once, like the original's grid, for switchers who want any symbol in one click. It was in the original component spec (lg+ shows all groups) and was dropped for simplicity.
3. **Faster first render.** A service worker that caches the 518 KB MathJax engine (and the PDF chunk), so repeat visits render instantly and work offline. First load took 5–20 s in the test browsers.
4. **Spoken maths for screen readers.** Today the preview is announced as raw LaTeX. Adding MathJax's assistive MathML or speech would let it be read as maths.
5. **Run `/replica-entrepreneur`** to find what the original's users actually complain about, and make the clone better rather than equal. That's the bar for "better than the original".
