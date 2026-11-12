# Architecture: your LaTeX equation editor (a rebuild of Lagrida's core features)

Built from `replica/recon.md` and `replica/features.csv` on 2026-11-11. It's your own product, so the plan is guest-first: the whole editor runs in the browser with no backend. Accounts and saved snippets come in a later milestone, on a managed backend that needs no server code.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Vite + React + TypeScript, a static single-page app | Rendering and export all happen in the browser, so there is nothing to server-render. One page plus `/privacy`. Next.js would add a server for no benefit |
| editor | CodeMirror 6 with `@codemirror/legacy-modes` stex (LaTeX highlighting) and `@codemirror/autocomplete` | Undo/redo history (F06), selection-aware insertion (F02) and autocomplete (a gap in the original) come built in. A plain textarea would need all three written by hand |
| rendering | MathJax 3 from npm (`mathjax-full`), TeX input with SVG output. Packages: base, ams, color, bbox, boldsymbol, mhchem, physics, cancel, newcommand, noerrors off. `safe` extension on | The same open-source engine the original uses (Apache-2.0), so the syntax matches. Bundled locally rather than from a CDN, so it works offline and loads in one request |
| export | PNG through SVG → canvas. SVG serialised directly. PDF through `jspdf` + `svg2pdf.js`. Copy through `navigator.clipboard` | Everything runs on the client: no render server to pay for or scale. Covers the PNG, SVG, PDF and copy rows in the matrix |
| styling | Tailwind, with tokens from /replica-design | Fast to build a responsive layout, which the original doesn't have |
| local storage | `localStorage` for the current draft and up to 50 guest snippets | Guests can save without an account. This beats the original's registration gate |
| database | Postgres on Supabase (milestone 3) | Managed, free at zero users, and its RLS lets the browser talk to the database directly, with no API server |
| auth | Supabase Auth: email + password, Google OAuth, password reset | Covers S09, S10, S11 and S14 without code. Facebook and Twitter are skipped (see recon) |
| payments | none | It's your own product and the recon marks the quota as optional. Add Stripe Checkout only if you decide to charge later |
| email | Supabase Auth emails, sent through Resend SMTP in production | Supabase's built-in SMTP is heavily rate-limited and meant for development only |
| jobs | none | Nothing runs on a schedule |
| files | Supabase Storage bucket `avatars` (only if you build S13) | Profile pictures. Optional |
| hosting | Cloudflare Pages (or Vercel), static | Free, global CDN, and deploys from git |

One database, no servers, no microservices.

## Schema

Tables: 2 (`profiles`, `snippets`) plus Supabase's own `auth.users`. Access rules: Postgres row level security. Every row is visible only to its owner. Full SQL: [schema.sql](schema.sql).

- `profiles`: one row per user, created by a trigger on sign-up. Username, display name, avatar.
- `snippets`: a saved equation. `code` (max 20,000 chars), an optional `title`, render `settings` jsonb (`font_size`, `image_output`). The owner's `user_id` cascades on delete.
- Hard constraints, enforced in the database rather than the UI:
  - a per-user cap of 1,000 snippets (anti-spam, enforced by a trigger, adjustable)
  - the code length check
  - a username format check, unique ignoring case
- `delete_my_account()`, a security-definer function, so a user can delete themselves (GDPR) without a server.

Not built: the original's donation-for-quota (skipped in recon), and the password-reset table (Supabase Auth handles it).

## API

There's no custom HTTP API. The browser calls Supabase directly with `supabase-js`, and RLS enforces access. "Client" in the table means a pure browser function with no network call.

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET `/` | the editor (S01 and all its modals) | anyone | `?code=` (optional, URL-encoded LaTeX, for share links) | the page | F01–F06 |
| GET `/privacy` | privacy policy (S15) | anyone | none | the page | none |
| GET `/auth/callback` | finishes the OAuth or reset redirect | anyone | Supabase tokens in the URL | redirects to `/` | F07, F09 |
| client `render(code)` | MathJax → SVG, or a parse error with a message | anyone | LaTeX string, display mode | `{svg}` or `{error, message}` | F01, F02 |
| client `exportPng(svg, fontSize, scale)` | draws the SVG on a canvas and downloads a transparent PNG | anyone | svg, font size, 1–4× scale | a file | F01 |
| client `exportSvg(svg)` | downloads a standalone SVG (fontCache none) | anyone | svg | a file | F01 |
| client `exportPdf(svg)` | a PDF page cropped to the equation's bounding box | anyone | svg | a file | F10 |
| client `copy(kind)` | copies the LaTeX, the PNG or the SVG to the clipboard | anyone | `code`, `png` or `svg` | a toast | F01 |
| client `insert(snippet)` | inserts at the cursor, or wraps the selection in place of `#0` | anyone | template such as `^{#0}` | an editor transaction | F02, F03, F04, F05 |
| client `localSnippets.*` | list, save and delete in localStorage | guest | code, title | a list | F07 (guest) |
| `auth.signUp` | registers with email | anyone | email, password, username | a session (after email confirmation) | F07 |
| `auth.signInWithPassword` | logs in | anyone | email, password | a session | F07 |
| `auth.signInWithOAuth` | logs in with Google | anyone | provider `google` | a redirect | F07 |
| `auth.resetPasswordForEmail` | sends a reset link | anyone | email | an email | F09 |
| `auth.updateUser` | changes the password or email | the user | new password | ok | S14 |
| `auth.signOut` | logs out | the user | none | ok | none |
| select `snippets` order by `updated_at desc` range | lists the user's snippets, 20 per page | the owner (RLS) | page | rows + count | F08 |
| insert `snippets` | saves the current code ("Add Code") | the owner | code, title, settings | the row | F07 |
| insert `snippets` (batch) | imports guest snippets after the first sign-in | the owner | up to 50 rows | rows | F07 |
| update `snippets` | renames, or overwrites the code | the owner | id, fields | the row | F08 |
| delete `snippets` | deletes one | the owner | id | ok | F08 |
| select/update `profiles` | shows and edits the profile | the owner | username, display name, avatar url | the row | S13 |
| rpc `delete_my_account` | deletes the user and all their data | the user | none | ok | none (GDPR) |

Webhooks in: none. Webhooks out: none. Jobs: none.
Only Supabase's and Google's official APIs, with your own keys. Nothing from the original's endpoints.

## The parts that bite

- **Render races:** MathJax renders asynchronously. Debounce the render by about 150 ms after typing. Tag each render with a counter, and drop the result if a newer render has started, so a stale result never overwrites a fresh one.
- **Error state:** with `noerrors` and `noundefined` off, MathJax returns `merror` nodes. Detect them and show the message under the preview. Keep the last good render dimmed instead of showing raw source, which is what the original does.
- **Unsafe input:** `\href{javascript:…}`, `\class`, `\style` and `\unicode` can inject into the page through a `?code=` share link. Turn on MathJax's `safe` extension and leave out the `html` package.
- **Export fidelity:** the SVG must be standalone (`fontCache: 'none'`), or glyphs go missing in the downloaded file. The PNG scale comes from the font size (the original defaults to 20px). Draw onto a transparent canvas. Wait for `img.decode()` before calling `drawImage`.
- **Canvas size limits:** iOS Safari caps a canvas at about 16.7M pixels. Clamp the scale for huge equations, and say so in a toast.
- **Clipboard:** copying an image needs `ClipboardItem` with `image/png`. Firefox support is newer and permission rules differ. Fall back to downloading the file, and copy only the code where an image can't be copied.
- **PDF:** size the page to the equation's bounding box plus padding, not to A4. `svg2pdf.js` needs the same standalone SVG.
- **Bundle size:** MathJax plus the mhchem and physics extensions is large. Load the extensions lazily the first time `\ce` or a physics macro appears, and keep the first paint under about 300 KB gzipped.
- **The palette:** about 240 symbols. Keep them as a data file (`symbols.ts`: group, LaTeX template, label). Render each button's label with MathJax once and cache it. Don't copy the original's sprite sheet. Add a search box: on a phone, a filter beats a grid of 240 icons.
- **Mobile:** the original isn't responsive. Use tabs for the palette groups, a sticky preview above the editor, and a bottom sheet for the modals.
- **Rate limits and spam:** Supabase has default auth rate limits. The 1,000-snippet trigger stops a script from filling the database.
- **Email deliverability:** use custom SMTP (Resend) with SPF and DKIM on your domain before launch, or confirmation and reset emails will land in spam.
- **GDPR deletion:** `delete_my_account()` removes the auth user. The cascade removes the profile and snippets. Avatar files in Storage need deleting by the client first.
- **Not applicable:** time zones (only `created_at` is shown, in the user's locale), idempotency (no webhooks), realtime, multi-tenancy, and search on the server (filter the snippet list on the client).

## Build order

1. **Vertical slice, without accounts:** S01 with a CodeMirror editor, the debounced MathJax SVG preview, the font size input and Download PNG. No tables and no routes beyond `/`. This proves the hardest risk: the render and export pipeline.
2. **Must-haves:**
   - The palette from `symbols.ts`: Greek letters, operators, arrows, relations, and the Functions and Functions 2 dropdowns, all with selection wrapping (S01, F02).
   - The Displaystyle, Text and TextBf toggles.
   - Line breaks and Remove Line breaks.
   - The undo/redo buttons, wired to CodeMirror history (F06).
   - The real error state.
   - The matrix builder (S02, F03).
   - A responsive layout.
3. **Should-haves:**
   - The colour and size dropdowns.
   - The reference modals S04–S08, built as one component fed by data, where clicking a sample inserts it.
   - Examples (S03), with your own example equations.
   - SVG and PDF export, and the raster preview toggle.
   - Then the backend: create the Supabase project and apply `schema.sql`, then auth (S09, S10, S11), then saved snippets (S12, F07, F08) with the guest import.
4. **Could-haves:**
   - Autocomplete.
   - Copy to clipboard.
   - Guest local save (could land as early as milestone 2, since it's tiny).
   - `?code=` share links.
   - Profile and password editing (S13, S14).
   - Account deletion.
5. **Fixes from /replica-entrepreneur**, once it has run.
