# Pricing: Equadeck

Date: 2026-11-12.

## The market (read 2026-11-12)

Figures come from the vendors' pages as shown in search results on that date. Prices change; confirm on the live page before quoting them anywhere public.

| product | model | price | source |
| --- | --- | --- | --- |
| The original (latexeditor.lagrida.com) | free, ads; account needed to save; **4 saves a week**, more only by donating | free / donation | the site itself (sidebar text), [LessonUp review](https://help.lessonup.com/en/articles/14431773-online-latex-editors) |
| CodeCogs Equation Editor | free web editor with ads; paid "Cloud Licence" for sites (no adverts) | **not published** (contact form) | [codecogs.com/latex/licence.php](https://www.codecogs.com/latex/licence.php) |
| MathType (Wiris) | per user per year, 30-day trial | **from $61.95 / user / year** | [store.wiris.com](https://store.wiris.com/), [wiris.com/pricing](https://www.wiris.com/pricing) |
| Equatio (Texthelp) | freemium; premium per user per year | **$175 / year** (US individual) | [texthelp.com/pricing](https://website-us.texthelp.com/pricing) |

## What users said about price and billing

From `replica/feedback.md` (20 items total; thin):

- **Save limits:** 1 item, 1 source. The original's free plan allows 4 saves a week.
- **Ads / commercial feel:** 1 item, 1 source.
- No billing, refund or cancellation complaints were found (there's nothing to bill on the original).

## The model

**Free at launch, with nothing held back.** The editor, every export (PNG, SVG, PDF, Copy for Word, Copy as LaTeX), autocomplete, reference sheets and 50 saved equations in the browser are free, with no account, no ads and no weekly limits. That is the fix for the two price complaints, and it's the angle ("no sign-up").

Paid only when there is something that costs money to run: accounts that sync. Three tiers at most, named by who they're for:

| tier | for | price | what's in it | status |
| --- | --- | --- | --- | --- |
| **Free** | anyone writing an equation | $0 | everything in the editor today; saves in this browser | **live** |
| **Pro** | people who use it every week, on more than one device | **$3 / month or $30 / year** (annual = 2 months free) | saved equations synced to an account, full history, unlimited saves | **not built**: needs `/replica-backend` (accounts) |
| **Classroom** | a teacher and their students | to decide | shared equation sets for a class | idea only; validate demand first |

Why $3: an order of magnitude under MathType ($62/yr) and Equatio ($175/yr), which are full Office/Docs add-ins. Equadeck Pro sells convenience (sync), not the core. If the free editor is the hook, Pro must never take a free feature away.

## Billing rules (fix complaints before they happen)

- Cancel in one click from the account page (Stripe Customer Portal); access runs to the end of the period.
- A renewal reminder email 7 days before an annual renewal.
- No per-seat surprises: Pro is one person; Classroom pricing gets shown in full before checkout.
- Downgrading never deletes data: synced equations stay readable and exportable.

## Stripe (you create these, test mode first)

Only when Pro exists:

| product | price id (name) | amount | interval |
| --- | --- | --- | --- |
| Equadeck Pro | `pro_monthly` | $3.00 | month |
| Equadeck Pro | `pro_yearly` | $30.00 | year |

Stripe Checkout for sign-up, Customer Portal for changes and cancelling. Webhooks are handled by `/replica-backend`.
