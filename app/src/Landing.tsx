import { ArrowRight, ClipboardCheck, Eye, FileType, Keyboard, PackageCheck, ShieldCheck, Smartphone, Sparkles, Type } from 'lucide-react';
import { APP_NAME } from './brand';
import { to } from './lib/paths';

// The landing page (/about). Copy comes from replica/launch/landing.md.
// No testimonials, counts, ratings or logos: there are none yet, so the real
// product screenshot is the proof.

const CTA = (
  <a
    href={to('/')}
    className="inline-flex h-12 items-center gap-2 rounded-md bg-accent px-5 text-base font-semibold text-on-accent hover:bg-accent-hover"
  >
    Open the editor
    <ArrowRight aria-hidden className="size-4" />
  </a>
);

const STEPS = [
  { icon: Keyboard, title: 'Type or click', body: 'LaTeX with autocomplete, a palette you can search, or start from an example.' },
  { icon: Eye, title: 'See it instantly', body: 'A live preview, and a plain explanation when something is off.' },
  { icon: ClipboardCheck, title: 'Paste it anywhere', body: 'Copy for Word or PowerPoint as an editable equation, or save a PNG, SVG or PDF.' },
];

const FEATURES = [
  { icon: FileType, title: 'Copy for Word and PowerPoint', body: 'Pastes as a real equation you can still edit, not a picture.' },
  { icon: PackageCheck, title: 'Know what LaTeX needs', body: 'See which packages your equation uses, and copy it with the \\usepackage lines.' },
  { icon: ShieldCheck, title: 'No account, no ads, no limits', body: 'Save up to 50 equations in your browser without signing up.' },
  { icon: Sparkles, title: 'Crisp exports', body: 'PNG at up to 4×, SVG and PDF, in dark ink even if you work in dark mode.' },
  { icon: Type, title: 'Faster typing', body: 'Autocomplete for about 200 commands and a symbol palette you can search.' },
  { icon: Smartphone, title: 'Works on your phone', body: 'A real mobile layout, not a shrunken desktop page.' },
];

const FAQ = [
  { q: 'Does it cost anything?', a: 'No. Everything on this page is free. If we add paid sync later, nothing free goes away.' },
  { q: 'Do I need an account?', a: 'No. Your current equation and up to 50 saved ones stay in this browser.' },
  { q: 'Is my work sent anywhere?', a: 'No. Equations are drawn in your browser; nothing you type leaves your device.' },
  {
    q: 'Does “Copy for Word” really give an editable equation?',
    a: 'It puts MathML on your clipboard, which Word and PowerPoint turn into their own equations when you paste. For Google Docs and Slides, use Copy image.',
  },
  { q: 'Which LaTeX does it understand?', a: 'The maths most people write: amsmath, symbols, matrices, colours and boxes, plus chemistry (mhchem) and physics notation.' },
  { q: 'Can I bring equations from other tools?', a: 'Yes. Most equation tools can give you their LaTeX; paste it in.' },
];

export default function Landing() {
  return (
    <div className="min-h-full bg-bg text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-bg focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-[var(--lx-layout-max)] items-center gap-2 px-4 lg:px-6">
          <a href={to('/')} className="flex items-center gap-2 text-base font-semibold">
            <Sparkles aria-hidden className="size-5 text-accent" />
            {APP_NAME}
          </a>
          <a href={to('/')} className="ml-auto text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Open the editor
          </a>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[var(--lx-layout-max)] px-4 lg:px-6">
        {/* 1. Hero */}
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-20">
          <div>
            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight">Equations for your slides and documents</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Type LaTeX, see it instantly, and paste a crisp, editable equation into Word, PowerPoint, Keynote or Google Slides. Free, no sign-up.
            </p>
            <div className="mt-8">{CTA}</div>
          </div>
          <img
            src={to('/screenshot-editor.png')}
            alt="The Equadeck editor: a symbol palette, the LaTeX for the quadratic formula, its rendered preview, and export buttons."
            width={1440}
            height={900}
            className="w-full rounded-lg border border-border shadow-pop"
          />
        </section>

        {/* 2. The problem */}
        <section aria-labelledby="problem" className="border-t border-border py-14">
          <h2 id="problem" className="text-xl font-bold">Equation tools make you fight them</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <p className="text-base leading-relaxed text-muted">
              <strong className="text-fg">Getting maths into a deck or a document is a fight.</strong> You end up with screenshots, blurry images or an
              add-in you didn’t want.
            </p>
            <p className="text-base leading-relaxed text-muted">
              <strong className="text-fg">Many want something from you first.</strong> An account before you can save, a weekly limit, or ads around
              your work.
            </p>
          </div>
        </section>

        {/* 3. How it works */}
        <section aria-labelledby="how" className="border-t border-border py-14">
          <h2 id="how" className="text-xl font-bold">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-border bg-surface p-5">
                <s.icon aria-hidden className="size-6 text-accent" />
                <h3 className="mt-3 text-base font-semibold">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Features, fixes first */}
        <section aria-labelledby="features" className="border-t border-border py-14">
          <h2 id="features" className="text-xl font-bold">What you get</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <f.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted">
            Also included: a matrix builder, examples, and reference sheets for spacing, colours, boxes, chemistry and physics.
          </p>
        </section>

        {/* 5. Pricing */}
        <section aria-labelledby="pricing" className="border-t border-border py-14">
          <h2 id="pricing" className="text-xl font-bold">Pricing</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border-2 border-accent bg-bg p-6">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-1 text-sm text-muted">For anyone writing an equation</p>
              <p className="mt-4 text-xl font-bold">$0</p>
              <ul className="mt-4 grid gap-2 text-sm">
                <li>Everything above: editor, every export, Copy for Word</li>
                <li>Up to 50 equations saved in your browser</li>
                <li>No account, no ads, no weekly limits</li>
              </ul>
              <div className="mt-6">{CTA}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-1 text-sm text-muted">For people who use it every week, on more than one device</p>
              <p className="mt-4 text-xl font-bold">
                $3 <span className="text-sm font-normal text-muted">a month, or $30 a year</span>
              </p>
              <ul className="mt-4 grid gap-2 text-sm">
                <li>Your saved equations on every device</li>
                <li>Full history, unlimited saves</li>
              </ul>
              <p className="mt-6 inline-block rounded-md bg-surface-2 px-3 py-2 text-sm font-medium text-muted">Not available yet</p>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section aria-labelledby="faq" className="border-t border-border py-14">
          <h2 id="faq" className="text-xl font-bold">Questions</h2>
          <dl className="mt-8 grid gap-6 md:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-base font-semibold">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 7. Final call to action */}
        <section aria-labelledby="final" className="border-t border-border py-16 text-center">
          <h2 id="final" className="text-xl font-bold">Your next equation is one paste away</h2>
          <div className="mt-6 flex justify-center">{CTA}</div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[var(--lx-layout-max)] gap-4 px-4 py-4 text-xs text-muted lg:px-6">
          <span>Rendered with MathJax</span>
          <a href={to('/privacy')} className="underline hover:text-fg">
            Privacy
          </a>
          <a href={to('/terms')} className="underline hover:text-fg">
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
