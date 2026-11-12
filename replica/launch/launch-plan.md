# Launch plan: Equadeck

Date: 2026-11-12. Lead with the fix, not the clone: **"paste an editable equation into Word or PowerPoint, free, no sign-up."**

## Before launch (blocking)

| item | status | notes |
| --- | --- | --- |
| Register equadeck.com and equadeck.app | **to do (you)** | unregistered as of 2026-11-12; register before anything public |
| Trademark screening (US, EU, your market; classes 9 and 42) | **to do (you / lawyer)** | including the "Equa-" overlap with Equatio, see `brand.md` |
| Try Copy for Word in real Word and PowerPoint | **to do (you)** | the clipboard is tested; the paste into Office has never been tried |
| Real logo from the brief | to do | the favicon is a placeholder |
| Deploy on your domain | next skill | `/replica-deploy` |
| Privacy page reviewed | to do | update it first if you add analytics or error tracking (below) |

## Measuring (privacy-first, matches the "nothing leaves your device" promise)

- **Analytics:** a cookie-less, privacy-friendly tool (e.g. Plausible or Umami). Count page views, Download PNG/SVG/PDF, Copy for Word, Copy as LaTeX, and Save. **Never send the LaTeX itself.** Update `/privacy` before switching it on.
- **Error tracking:** Sentry (or similar) for uncaught errors only, with a `beforeSend` that strips the editor contents. The render-error message stays local.
- **The one number that matters early:** the share of visits that end in an export or copy.

## Waitlist / beta

Equadeck is free and usable today, so there's no waitlist for the product itself. There is one for **Pro (sync)**: a "Tell me when sync is ready" email field on `/about`. This needs a tiny backend or a form service; add it with `/replica-backend`. Until then, don't promise dates.

## Where the people are

From the research (`reviews.csv`); post in public, as yourself, and say you built it:

| place | why | how |
| --- | --- | --- |
| r/LaTeX | both research threads live there; people there asked for clipboard export, package hints and mhchem | a "Show" post leading with Copy for Word and the package line; answer questions in the thread |
| Hacker News (Show HN) | equation-editor frustration comes up in Word/LaTeX threads | "Show HN: Equadeck, LaTeX equations you can paste into Word as real equations"; be in the comments for the first hours |
| Product Hunt | general maker audience | the same lead; real screenshots only, no invented stats |
| Teacher and student communities (r/Teachers, r/GradSchool, university Slack/Discord groups you belong to) | they make slides and handouts with maths | ask for feedback, not upvotes |

Rules: no fake accounts, no vote rings, no reviewer quotes as testimonials, never the original's name in titles or ads.

## The first 10 users, by hand

1. Make a short list from people who **publicly** asked for this in the threads above. Reply in the thread, never by cold DM.
2. Ask 5 people you know who make maths slides (teachers, TAs, students) to use it for one real deck, and watch one of them do it over a call.
3. For each: what they pasted into, whether Copy for Word worked in *their* Office version, and what they reached for that wasn't there.
4. Write the answers into `replica/reviews.csv` as your own research (source = interview, with permission) and re-run `reviews.py`.

## After launch (first 2 weeks)

- Fix whatever breaks Copy for Word in real Office versions first; it's the headline promise.
- If people ask for sync, build accounts (`/replica-backend`) and switch on Pro.
- Next fixes from `fixes.md`: F3 (Firefox/Safari export tests), F4 (offline / instant repeat loads), F5 (history).
