# Brand: Equadeck

Date: 2026-11-12. Angle (from `fixes.md`): *the fastest way from LaTeX to a crisp, editable equation in your slides and documents. No sign-up, no ads.*

## 1. Name

### 20 candidates

| style | candidates |
| --- | --- |
| descriptive | Slidemath, PasteMath, DocEquation, Mathslide |
| compound | Equadeck, Formulink, Formulamint, Inkmath, Sumprint |
| invented | Equora, Eqndrop, Formuladrop |
| metaphor | Chalkline, Inkstone, Chalkmark |
| verb | Mathdrop, Texdrop, Paste, Typeset, Render |

Cut first: anything echoing the original's name or its "LaTeX Equation Editor" title; "MathPaste"/"Typeset"/"Render" (too generic or too close to category names like MathType); Texdrop (TeX-only, hard to say).

### Shortlist and checks

Run 2026-11-12. RDAP = the registries' official lookup (200 = registered, 404 = not registered). Web = exact-name search plus category search.

| name | .com | .app | GitHub handle | web / app stores | US TM (USPTO, cl. 9 & 42) | EU TM (EUIPO / TMview) | Canada | WIPO | X / Instagram / TikTok |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Equadeck** | not registered (2026-11-12) | not registered (2026-11-12) | free (2026-11-12) | no product found; nearest is "Aquadeck" (marine decking, different field) (2026-11-12) | **to run** | **to run** | **to run** | **to run** | **to run** |
| Formulamint | not registered (2026-11-12) | not registered (2026-11-12) | free (2026-11-12) | no product found (2026-11-12) | to run | to run | to run | to run | to run |
| Slidemath | not registered (2026-11-12) | not registered (2026-11-12) | free (2026-11-12) | no app by that name (2026-11-12) | to run | to run | to run | to run | to run |
| Formulink | registered (2026-11-12) | not registered (2026-11-12) | taken (2026-11-12) | no product found, but **"Formudrag"**, an equation app, exists (2026-11-12) | to run | to run | to run | to run | to run |
| Mathdrop | registered (2026-11-12) | not registered (2026-11-12) | taken (2026-11-12) | no product found, but "drop" vs **"Formudrag"** "drag" in the same category (2026-11-12) | to run | to run | to run | to run | to run |

"Not registered" is what the registry says today, not a promise; register before announcing. Social handles and the trademark databases weren't checked (logins and search forms), so they're marked to run.

### Recommendation: **Equadeck**

- Says the job: equations (*Equa*) for your deck. It fits the slides-and-documents angle without being as generic, and as hard to protect, as "Slidemath".
- Easy to say and spell after hearing it once (EK-wa-deck); no awkward meaning found in English, German, French or Spanish.
- .com, .app and the GitHub handle are all unregistered as of today.
- **Risk to put to a lawyer:** the established equation editor **Equatio** (Texthelp) also starts with "Equa-". The shared part is the ordinary root of "equation", and the rest differs in sound and look (-deck vs -tio), but it's the same category. That's exactly the question a trademark search answers. To avoid stacking similarities, the palette stays away from purple.
- Runner-up: **Formulamint**, with no web conflicts and all three registrations free, but longer and the "mint" idea is weaker for the angle.

These are screening checks, not legal clearance. Before spending money on the name, have a trademark lawyer search classes 9 and 42 in your markets.

## 2. Palette

A new primary hue in a different family from the original's (Bootstrap blue `#337ab7`, plus pink panel buttons and a light-green toggle) and from purple (see above): **deep teal**. Same token roles as `design/tokens.json`; only values changed.

| role | light | dark |
| --- | --- | --- |
| accent | `#0f766e` | `#2dd4bf` |
| accent-hover | `#115e59` | `#5eead4` |
| accent-soft | `#ccfbf1` | `#0d2b29` |
| on-accent | `#ffffff` | `#042f2a` |
| focus | `#0f766e` | `#2dd4bf` |
| success (moved to lime so it doesn't blur into teal) | `#3f6212` on `#ecfccb` | `#a3e635` on `#1c2a0b` |

Neutrals, danger and warning are unchanged. `contrast.py`: **40 pairs, 0 failing AA**. Updated in `design/tokens.json`, `design/tokens.css`, `app/src/styles/tokens.css`, `design/primitives.html` and the favicon. The original's colours are in `brand.json`, so the sweep catches any that come back.

## 3. Logo brief

- **Idea:** an equation landing on a slide. A small deck-of-slides shape, the front card showing a simple maths stroke (a fraction bar or Σ), in teal.
- **Mark type:** a symbol plus a wordmark ("Equadeck" in a clean geometric sans, lowercase or title case); the symbol must stand alone.
- **Must work at:** 16 px (favicon: the symbol only, two shapes at most), 32 px, and a 1024 px app icon.
- **Deliverables:** SVG (symbol, wordmark, lockup; light and dark), app icon 1024×1024 PNG with **no transparency** (iOS), favicon set (16, 32, 180 apple-touch, SVG), social image 1200×630.
- **Must not resemble the original:** the original's header is a "LaTeX" wordmark with the classic dropped-E typesetting, plus "Equation Editor" in serif. So: no LaTeX-style lowered letters, no serif "Equation Editor" lockup, no Bootstrap blue, no pink/green pairing. Also check against **Equatio**'s mark. Put the original's header and Equatio's logo next to the drafts and compare.
- The current favicon (teal square with a white Σ-like stroke) is a placeholder until the real mark exists.

## 4. Voice

**Clear, quick, warm.**
- *Clear*, not clinical: plain words; name the thing ("PNG", "Word"), not the mechanism.
- *Quick*, not curt: short sentences, but say what happens next.
- *Warm*, not cute: friendly, no jokes in error messages, no exclamation marks.

| do | don't |
| --- | --- |
| "Saved as PNG." | "Your PNG file has been successfully downloaded!" |
| "Undo brings your equation back." | "Action reversible via the history feature." |
| "This browser holds up to 50 equations. Delete one to make room." | "Error: storage limit exceeded." |
| "Start typing. Your equation shows up here." | "No content to display." |
| "Accounts are on the way." | "Coming soon!!! 🚀" |

### Strings rewritten in this voice (all new, none echoing the original)

| where | before | after |
| --- | --- | --- |
| editor placeholder | Type LaTeX, for example \frac{a}{b} | Type LaTeX here, like \frac{a}{b} |
| empty preview | Your equation appears here. | Start typing. Your equation shows up here. |
| render error suffix | Showing the last version that worked. | Your last working version stays on screen. |
| PNG / SVG / PDF saved | PNG downloaded. (etc.) | Saved as PNG. / Saved as SVG. / Saved as PDF. |
| Copy LaTeX | LaTeX copied. | LaTeX copied to your clipboard. |
| Copy for Word | Copied. Paste into Word or PowerPoint to get an editable equation. | Ready. Paste into Word or PowerPoint for an equation you can edit. |
| example picked | Example loaded. Undo brings back what you had. | Example in place. Undo brings your equation back. |
| saved equation opened | Loaded. Undo brings back what you had. | Opened. Undo brings your last equation back. |
| saved list empty | Nothing saved yet. Press Save to keep the equation you're working on. | No saved equations yet. Press Save to keep this one for later. |
| save limit | You can keep 50 equations in this browser. Delete one to save another. | This browser holds up to 50 equations. Delete one to make room. |
| sign-in dialog | Accounts are coming later. Until then… | Accounts are on the way. Until then, your work and everything you save stay in this browser. |

Also changed: the app name (`app/src/brand.ts` → **Equadeck**), the page title ("Equadeck: LaTeX equations for your slides and documents") and the meta description.

## 5. Sweep

`sweep.py . --config replica/brand.json` → **clean** (no original name, domain or colours outside `replica/`). Checked by hand: no "LaTeX Equation Editor" placeholder left in `app/`. Favicon, title and description updated. There are no email templates or OG image yet (both come with launch and deploy).

## Still to do

- Run the "to run" checks (trademarks in classes 9 and 42, social handles) and register equadeck.com and equadeck.app before announcing.
- Commission or draw the logo from the brief; replace the placeholder favicon.
- Next skill: `/replica-launch` (landing page, pricing, listing).
