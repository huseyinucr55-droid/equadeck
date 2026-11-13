import { APP_NAME } from './brand';
import { to } from './lib/paths';
import { useLang } from './lib/i18n';

// Terms of use for the free, account-free version. A plain-words draft;
// have it reviewed before charging money or adding accounts.
// English and German are kept side by side; keep them in step.
export default function Terms() {
  const de = useLang() === 'de';
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-base text-fg">
      <a href={to('/')} className="text-sm text-accent underline">{de ? '← Zurück zum Editor' : '← Back to the editor'}</a>
      <h1 className="mt-6 text-xl font-bold">{de ? 'Nutzungsbedingungen' : 'Terms of use'}</h1>
      <p className="mt-4 text-muted">
        {de ? 'Zuletzt aktualisiert am 12. November 2026. Entwurf, keine Rechtsberatung.' : 'Last updated 12 November 2026. Draft, not legal advice.'}
      </p>
      {de ? (
        <div className="mt-6 space-y-4">
          <p>{APP_NAME} ist ein kostenloses Werkzeug, um LaTeX-Formeln zu schreiben und zu exportieren. Mit der Nutzung stimmst du diesen Bedingungen zu.</p>
          <h2 className="pt-2 text-lg font-semibold">Deine Formeln gehören dir</h2>
          <p>
            Alles, was du schreibst und exportierst, kannst du frei verwenden, auch kommerziell. Wir erheben keine Rechte daran, und es bleibt
            auf deinem Gerät (siehe <a href={to('/privacy')} className="text-accent underline">Datenschutz</a>).
          </p>
          <h2 className="pt-2 text-lg font-semibold">Bereitgestellt, wie es ist</h2>
          <p>
            {APP_NAME} wird kostenlos und ohne Gewähr angeboten. Prüfe Formeln, bevor du dich auf sie verlässt; wir haften nicht für Fehler in
            dargestellten oder exportierten Ergebnissen oder für den Verlust von Formeln, die in deinem Browser gespeichert sind (das Löschen
            der Websitedaten löscht sie).
          </p>
          <h2 className="pt-2 text-lg font-semibold">Faire Nutzung</h2>
          <p>
            Nutze die Seite nicht, um sie oder ihren Hoster anzugreifen, zu überlasten oder zu missbrauchen. Das Werkzeug kann sich jederzeit
            ändern oder eingestellt werden.
          </p>
          <h2 className="pt-2 text-lg font-semibold">Open-Source-Bestandteile</h2>
          <p>
            Formeln werden mit MathJax (Apache License 2.0) dargestellt. Andere Open-Source-Komponenten behalten ihre eigenen Lizenzen.
          </p>
        </div>
      ) : (
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
      )}
    </main>
  );
}
