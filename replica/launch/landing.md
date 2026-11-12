# Landing page: Equadeck

Built as `/about` in the app (`app/src/Landing.tsx`). The editor stays at `/`: the promise is "open it and type", so the tool is the front door and the landing page explains it. Voice: clear, quick, warm (see `brand.md`). No testimonials, user counts, ratings or logos: there are none yet, so the proof section is the real product screenshot.

## 1. Hero

- **Headline:** Equations for your slides and documents
- **Line under it:** Type LaTeX, see it instantly, and paste a crisp, editable equation into Word, PowerPoint, Keynote or Google Slides. Free, no sign-up.
- **Button:** Open the editor → `/`
- **Image:** a real screenshot of the editor (`app/public/screenshot-editor.png`, from `replica/clone-screens/brand-light.png`).

## 2. The problem

Paraphrased from the top themes in `feedback.md`, not quoted:

- **Getting maths into a deck or a document is a fight.** You end up with screenshots, blurry images or an add-in you didn't want. (Theme: "getting the equation into Word/Slides/PowerPoint", 3 items, 2 sources.)
- **Equation tools want something from you.** An account before you can save, a weekly limit, or ads around your work. (Theme: "ads, accounts and save limits", 2 items, 2 sources; thin.)

## 3. How it works

1. **Type or click.** LaTeX with autocomplete, a searchable symbol palette, or start from an example.
2. **See it instantly.** A live preview, and a plain explanation when something's off.
3. **Paste it anywhere.** Copy for Word or PowerPoint as an editable equation, or save a PNG, SVG or PDF.

## 4. Features (fixes first)

- **Copy for Word and PowerPoint** *(fix F1)*: pastes as a real equation you can still edit, not a picture.
- **Know what LaTeX needs** *(fix F2)*: see which packages your equation uses, and copy it with the `\usepackage` lines.
- **No account, no ads, no limits:** save up to 50 equations in your browser without signing up.
- **Crisp exports:** PNG at up to 4×, SVG and PDF, in dark ink even if you work in dark mode.
- **Faster typing:** autocomplete for about 200 commands and a palette you can search.
- **Works on your phone:** a real mobile layout, not a shrunken desktop page.
- *Also included:* matrix builder, examples, reference sheets for spacing, colours, boxes, chemistry and physics.

## 5. Pricing

From `pricing.md`: **Free** today, with everything above. **Pro** ($3/month or $30/year, for syncing across devices) is shown as *not available yet*, with no buy button.

## 6. FAQ

- **Does it cost anything?** No. Everything on this page is free. If we add paid sync later, nothing free goes away.
- **Do I need an account?** No. Your current equation and up to 50 saved ones stay in this browser.
- **Is my work sent anywhere?** No. Equations are drawn in your browser; nothing you type leaves your device.
- **Does "Copy for Word" really give an editable equation?** It puts MathML on your clipboard, which Word and PowerPoint turn into their own equations when you paste. For Google Docs and Slides, use Copy image.
- **Which LaTeX does it understand?** The maths most people write: amsmath, symbols, matrices, colours and boxes, plus chemistry (mhchem) and physics notation.
- **Can I bring equations from other tools?** Yes. Most equation tools can give you their LaTeX; paste it in.

## 7. Final call to action

- **Headline:** Your next equation is one paste away
- **Button:** Open the editor → `/`
