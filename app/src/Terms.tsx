import { APP_NAME } from './brand';
import { to } from './lib/paths';

// Terms of use for the free, account-free version. A plain-words draft;
// have it reviewed before charging money or adding accounts.
export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-base text-fg">
      <a href={to('/')} className="text-sm text-accent underline">← Back to the editor</a>
      <h1 className="mt-6 text-xl font-bold">Terms of use</h1>
      <p className="mt-4 text-muted">Last updated 12 November 2026. Draft, not legal advice.</p>
      <div className="mt-6 space-y-4">
        <p>{APP_NAME} is a free tool for writing LaTeX equations and exporting them. By using it you agree to these terms.</p>
        <h2 className="pt-2 text-lg font-semibold">Your equations are yours</h2>
        <p>
          Everything you write and export is yours to use however you like, including commercially. We claim no rights to it, and it stays on
          your device (see <a href={to('/privacy')} className="text-accent underline">Privacy</a>).
        </p>
        <h2 className="pt-2 text-lg font-semibold">Provided as is</h2>
        <p>
          {APP_NAME} is offered free of charge and as is, without warranties. Check equations before you rely on them; we're not liable for
          errors in rendered or exported output, or for losing equations stored in your browser (clearing site data deletes them).
        </p>
        <h2 className="pt-2 text-lg font-semibold">Fair use</h2>
        <p>Don't use the site to attack, overload or misuse it or its host. The tool may change or be discontinued at any time.</p>
        <h2 className="pt-2 text-lg font-semibold">Open source parts</h2>
        <p>
          Equations are rendered with MathJax (Apache License 2.0). Other open-source components keep their own licences.
        </p>
      </div>
    </main>
  );
}
