import { APP_NAME } from './brand';
import { to } from './lib/paths';

// Placeholder privacy notice for the guest-only version. Review before launch
// (replica-launch adds the real legal pages once accounts exist).
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-base text-fg">
      <a href={to('/')} className="text-sm text-accent underline">← Back to the editor</a>
      <h1 className="mt-6 text-xl font-bold">Privacy</h1>
      <p className="mt-4 text-muted">Draft notice, {new Date().getFullYear()}.</p>
      <div className="mt-6 space-y-4">
        <p>{APP_NAME} works entirely in your browser. The equations you type are rendered on your own device and are not sent to our servers.</p>
        <p>To spare you from losing work, the equation you are editing and your chosen size and theme are stored in your browser's local storage. You can clear them at any time through your browser settings.</p>
        <p>There are no accounts, no tracking cookies and no analytics in this version. If that changes, this page will say so before it happens.</p>
      </div>
    </main>
  );
}
