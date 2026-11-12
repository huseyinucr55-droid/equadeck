# Deploy: Equadeck

Date: 2026-11-12. **Live:** https://huseyinucr55-droid.github.io/equadeck/ (repo: https://github.com/huseyinucr55-droid/equadeck).

## Host

GitHub Pages, chosen by the owner because it's free. The app is static (no server, database, payments, OAuth or email), so GitHub Pages is enough. `.github/workflows/pages.yml` builds `app/` on every push to `main` (with `PAGES_BASE=/<repo>/` and `SITE_URL`) and deploys it. Pages source: "GitHub Actions" (set by the owner). HTTPS is automatic.

## Preflight (2026-11-12)

| check | command / how | result |
| --- | --- | --- |
| e2e tests | `npx playwright test` (prod build, Chrome, 2 workers, 1 retry) | **57/57 passed**, 0 flaky |
| feature parity | `parity.py replica/features.csv` | **85/100, must-haves 11 of 11**; the gap is accounts (optional) |
| rebrand sweep | `sweep.py . --config replica/brand.json` | **clean** |
| store listing | `listing.py replica/launch/listing.json` | **0 errors, 0 warnings** (for a later store app) |
| production build | `npm run build` | **passes** |
| open S1/S2 bugs | `bugs.md` | **0** (8 found, all fixed) |
| privacy page | `/privacy` | **fixed in this pass:** now names GitHub Pages as host (IP logs) and covers saved equations |
| terms page | `/terms` | **added in this pass** (plain-words draft) |
| cookie banner | none needed | no cookies; local storage only for the user's own drafts |
| account deletion | n/a | no accounts |
| favicon / title / OG image | own | favicon is a placeholder until the logo exists; OG tags + 1200×630 preview image **added in this pass** |
| live pages | HTTP status after deploy | `/`, `/about`, `/privacy` → 200; unknown → 404 (`/terms` after the next push) |

Also fixed in this pass: `features.csv` row 39 had an unquoted comma, which crashed `parity.py`.

## Production services

None needed: no database, Stripe, OAuth or email. They come with Pro (accounts), via `/replica-backend`.

## Custom domain (optional, later)

After buying equadeck.com at any registrar (you buy it; I never do):

| record | name | value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | huseyinucr55-droid.github.io |

Then: repo Settings → Pages → Custom domain → `equadeck.com`, tick "Enforce HTTPS", and change the workflow to `PAGES_BASE: /` and `SITE_URL: https://equadeck.com`. Verify the IPs against GitHub's current docs ("Managing a custom domain for your GitHub Pages site") when you do it. No email DNS is needed: the site sends no email.

## Watching it (first week)

- **Deploys:** the repo's Actions tab; a failed run emails you (GitHub default).
- **Uptime:** a free uptime check (e.g. UptimeRobot) on the home page, alerting your email.
- **Errors / analytics:** not set up, by design ("no tracking"). If added: cookie-less analytics and error tracking that never sends the LaTeX, and **update `/privacy` first**.
- **By hand:** type an equation, Download PNG, Copy for Word into real Word/PowerPoint, on desktop **and on your phone**.

## Mobile app

None. The store listing in `replica/launch/listing.json` is ready for a later PWA or native wrapper.
