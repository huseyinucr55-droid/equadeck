# Fixes: what users want that the original doesn't give them

Date: 2026-11-11. Data: `replica/reviews.csv` (20 items), ranked in `replica/feedback.md`.

## Read this first: the sample is small

- **20 items from 4 kinds of source** (Reddit, Hacker News, a help-centre review, a forum reply). **None have star ratings.**
- **Only 5 are about the original itself.** The original is a small free tool: it has no app-store listing, no G2/Capterra/Trustpilot page, and no public feature board. A search turned up one Reddit post, one help-centre comparison, one forum reply, and directory pages.
- **The other 15 are about the category**: people talking about online and desktop equation editors in general (Hacker News via the official Algolia API, two r/LaTeX threads).
- **Excluded:** SaaSHub's "features and disadvantages" for the original. They read as machine-generated and claim things the app doesn't have (collaborative editing). listoffreeware.com is an editor's write-up, used only for context.
- Under 30 items supports a direction, not a ranking. Every theme below says how thin it is. Excerpts are kept short and verbatim; each links to its source.

## 1. What they hate

| # | problem | items | sources | evidence | the clone today |
| --- | --- | --- | --- | --- | --- |
| 1 | **The original has no SVG export and no autocomplete** | 1 | 1 (Reddit) | "Lagrida cannot generate SVG and does not have autocomplete." [r/LaTeX](https://reddit.fsky.io/r/LaTeX/comments/1jb3skr/i_created_an_online_latex_editor_with) | **fixed**: SVG export and autocomplete are both built |
| 2 | **Saving needs an account and is capped at 4 a week** | 1 | 1 (review site) | "the free plan limits this to 4 per week" [LessonUp](https://help.lessonup.com/en/articles/14431773-online-latex-editors) | **fixed**: 1-click save, no account, 50 in the browser |
| 3 | **Ads; it feels commercial** | 1 | 1 (forum) | "since I see advertisements on it" [latex.org](https://latex.org/forum/viewtopic.php?p=111652) | **fixed** if you keep it ad-free (a launch decision) |
| 4 | **Fewer symbols than the market leader** | 1 | 1 (review site) | "may not cover more advanced notation" [LessonUp](https://help.lessonup.com/en/articles/14431773-online-latex-editors) | partly: about 230 keys + search; more packages are cheap (fix F6) |
| 5 | *Category:* equation editors in general frustrate people (Word's especially) | 4 | **1 (HN only, thin)** | "sufficiently frustrated with word's equation editor" [HN](https://news.ycombinator.com/item?id=22678245) | none |
| 6 | *Category:* slow previews in competing web editors | 2 | **1 (Reddit only, thin)** | "Codecogs is very slow when generating previews." [r/LaTeX](https://reddit.fsky.io/r/LaTeX/comments/1jb3skr/i_created_an_online_latex_editor_with) | rendering is local and instant after load; the first load is the weak spot (fix F4) |
| 7 | *Category:* broken PNG exports in a new competitor | 1 | 1 (thin) | "the PNG and JPEG exports don't work properly." [r/LaTeX](https://reddit.fsky.io/r/LaTeX/comments/1jb3skr/i_created_an_online_latex_editor_with) | PNG is tested in Chrome only (fix F3) |

What people **like**, so it isn't lost: speed and simplicity ("Quick and simple to use", [LessonUp](https://help.lessonup.com/en/articles/14431773-online-latex-editors)), and editors where LaTeX is native ([HN](https://news.ycombinator.com/item?id=21185823)). The clone keeps both.

## 2. What is missing

| # | request | items | sources | evidence | the clone today |
| --- | --- | --- | --- | --- | --- |
| 1 | **Easier input for people who don't know LaTeX** (visual editing, a maths keyboard) | 5 | 2 (HN, Reddit) | "something easy to replace this equation editor" [HN](https://news.ycombinator.com/item?id=48276424) · "can't find a decent WSYSIWYG latex editor" [HN](https://news.ycombinator.com/item?id=36795104) | palette + autocomplete only; no visual mode (fix F7) |
| 2 | **Getting the equation into Word, PowerPoint, Keynote or Slides** | 3 | 2 (Reddit, HN) | "it sends the PNG or a PDF to the clipboard" [r/LaTeX](https://reddit.fsky.io/r/LaTeX/comments/1jb3skr/i_created_an_online_latex_editor_with) · "Powerpoint doesn't directly support latex format without third-party addins" [HN](https://news.ycombinator.com/item?id=27056551) | Copy image (PNG) works; nothing pastes as an editable Office equation (fix F1) |
| 3 | **Knowing which LaTeX packages an equation needs** | 2 | 1 (Reddit, thin) | "create comments indicating which package was used" [r/LaTeX](https://reddit.fsky.io/r/LaTeX/comments/1jb3skr/i_created_an_online_latex_editor_with) | none (fix F2) |
| 4 | **Chemistry notation (mhchem)** | 1 | 1 (thin) | "include the mhchem" [r/LaTeX](https://downdoot.com/r/LaTeX/comments/1jb3skr/i_created_an_online_latex_editor_with/mhrl71t/?context=3) | **done** (`\ce`, with a reference sheet) |
| 5 | **A history of past equations** | 1 | 1 (thin) | "Has a history feature" [HN](https://news.ycombinator.com/item?id=45699580) | Saved list only, manual (fix F5) |

## 3. What is unsolved (positioning)

1. **People who need maths but don't speak LaTeX**: students, teachers, engineers writing reports. Every web editor in the sample, the original included, assumes you type LaTeX or hunt through an icon grid. 5 items, 2 sources. It's the strongest signal, but almost all of it is category-level.
2. **People putting maths into slides and documents**: Word, PowerPoint, Keynote, Google Slides. The job isn't "render LaTeX", it's "get a crisp, editable equation into my deck". 3 items, 2 sources.
3. **People who want a tool without ads, sign-ups or weekly limits.** 2 items, 2 sources (thin). The clone already does this; it's a supporting message, not the headline.

## 4. The fix plan

Ranked by evidence × how cheap it is. Each fix is also a row in `features.csv` with `original = no`.

| # | fix | size | skill | evidence |
| --- | --- | --- | --- | --- |
| F1 ✅ | **Copy for Word / PowerPoint**: put MathML on the clipboard next to the PNG (MathJax can output MathML), so Office pastes an *editable* equation. Add a "Copy for Google Docs" path (LaTeX in Docs' equation box) and test each target app by hand. | M | /replica-build | Missing #2, 3 items, 2 sources |
| F2 ✅ | **"Packages needed" line**: under the preview, list what the equation uses (`amsmath`, `cancel`, `mhchem`, `physics`…) and offer "Copy as LaTeX with \usepackage lines". Cheap, because each command maps to its package. | S | /replica-build | Missing #3 (thin) |
| F3 | **Export tested in Firefox and Safari**: add WebKit and Firefox projects to Playwright; check PNG, SVG, PDF and copy-image in each. A broken PNG export is what users punished a competitor for. | S | /replica-test | Hate #7 (thin) + the export theme, 5 items |
| F4 | **Instant repeat loads, works offline**: a service worker caching the MathJax engine and PDF chunk (also parity next step #3). | S–M | /replica-build | Hate #6 (thin); 5–20 s first load seen in tests |
| F5 | **Automatic recent history**: the last 30 rendered equations kept automatically (local), separate from Saved. | S | /replica-build | Missing #5 (thin), cheap |
| F6 | **More notation**: add the mathtools, braket, upgreek and extpfeil packages (all MathJax built-ins) and about 60 more palette keys (more arrows, relations, operators). | S | /replica-build | Hate #4 |
| F7 | **Visual input mode** for non-LaTeX users: an optional "type maths like a calculator" field (e.g. MathLive, MIT licence) that writes LaTeX into the editor. A bigger bet; prototype first. | L | /replica-build | Missing #1, 5 items, 2 sources (category) |

Not taken: pricing and billing. There's no evidence beyond "4 a week" and ads; a pricing decision belongs in `/replica-launch`.

## 5. The angle

**Option A: for slides and documents** (recommended)
> For people who put maths in slides and documents and are tired of fighting copy-paste, *your app* turns LaTeX into a crisp equation you can paste straight into Word, PowerPoint, Keynote or Google Slides. No sign-up, no ads.
> Evidence: "getting the equation into Word/Slides/PowerPoint", 3 items across 2 sources; plus "no account, no limits" (2 items, 2 sources).

**Option B: maths without LaTeX**
> For students and teachers who need equations but don't speak LaTeX, *your app* lets you build them by clicking, searching and typing naturally, then gives you clean LaTeX and images.
> Evidence: "easier input for non-experts", 5 items across 2 sources (category-level).

**Option C: the no-strings editor**
> For anyone tired of ads, sign-ups and weekly limits on equation tools, *your app* is free to use with nothing to join.
> Evidence: "ads, accounts and save limits", 2 items across 2 sources (thin).

**Recommendation: A.** It's the job people describe (a crisp equation in their deck or doc). It plays to what the clone already does best (SVG, PDF, copy image, no account). F1 makes it unique for a medium-sized build. B has more raw evidence, but it's category-level and needs the large F7 before the promise is true; keep it as the next step once F7 is prototyped. C is table stakes; use it as the supporting line under A.

Don't use the original's name in your app name, ads or store listing. Any comparison page is a question for a lawyer in your country.

## Next

- Build F1–F6 (`/replica-build`), F3 via `/replica-test`.
- Then `/replica-brand` (name and voice from angle A) and `/replica-launch`.
- Before betting the roadmap on this, collect more: post a short survey where your users are, and watch r/LaTeX and the HN queries in `feedback.md` for new threads.

## Status (2026-11-11)

- **F1 built:** a "Copy for Word" button puts MathML (MathJax's own serialiser, internal `data-mjx-*` attributes stripped) on the clipboard as plain text. Word and PowerPoint convert pasted MathML into an editable equation. The e2e tests check the clipboard contents; **pasting into Office itself hasn't been tried here** (no Office on this machine). Do that once by hand.
  - **Not done:** a separate Google Docs path. Docs doesn't accept pasted MathML or LaTeX into its equation box; "Copy image" is the working route for Docs today.
- **F2 built:** a line under the preview lists the packages the equation needs in real LaTeX (amsmath, amssymb, amscd, xcolor with `dvipsnames` for named colours, cancel, mhchem, physics), each with the reason on hover. It warns about MathJax-only commands (`\bbox`, `\style`…), size commands in maths, and Unicode characters. "Copy as LaTeX" copies the `\usepackage` lines plus the equation in `\[ … \]`, or `gather*` for several lines.
- Tests: `app/e2e/fixes-f1-f2.spec.ts`, 8 cases, written before the code (all failed first, all pass now).
