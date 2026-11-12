import { APP_NAME } from './brand';
import { to } from './lib/paths';

// Privacy notice for the guest-only version (no accounts, no analytics).
// A draft in plain words; have it reviewed before you add accounts,
// analytics or error tracking, and update it before switching any of them on.
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-base text-fg">
      <a href={to('/')} className="text-sm text-accent underline">← Back to the editor</a>
      <h1 className="mt-6 text-xl font-bold">Privacy</h1>
      <p className="mt-4 text-muted">Last updated 12 November 2026. Draft, not legal advice.</p>
      <div className="mt-6 space-y-4">
        <h2 className="pt-2 text-lg font-semibold">What stays on your device</h2>
        <p>
          {APP_NAME} works entirely in your browser. The equations you type are rendered on your own device and are never sent to us or to
          anyone else.
        </p>
        <p>
          So you don't lose work, your browser's local storage keeps the equation you are editing, your saved equations (up to 50), and your
          chosen size and theme. Nothing of this leaves your device. You can delete it at any time by clearing this site's data in your
          browser settings.
        </p>
        <h2 className="pt-2 text-lg font-semibold">Who else is involved</h2>
        <p>
          The site is hosted on <strong>GitHub Pages</strong> (GitHub, Inc.). Like any web host, GitHub receives the technical data your
          browser sends when it loads the pages, such as your IP address, and may log it for security and operations. See the{' '}
          <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" className="text-accent underline">
            GitHub privacy statement
          </a>
          . We don't receive those logs.
        </p>
        <h2 className="pt-2 text-lg font-semibold">What we don't do</h2>
        <p>There are no accounts, no cookies, no analytics, no ads and no tracking. If that ever changes, this page will say so first.</p>
      </div>
    </main>
  );
}
