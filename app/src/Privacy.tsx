import { APP_NAME } from './brand';
import { to } from './lib/paths';
import { useLang, useT } from './lib/i18n';

// Privacy notice for the guest-only version (no accounts, no analytics).
// A draft in plain words; have it reviewed before you add accounts,
// analytics or error tracking, and update it before switching any of them on.
// English and German are kept side by side; keep them in step.
export default function Privacy() {
  const t = useT();
  const de = useLang() === 'de';
  const policy = de
    ? 'https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement'
    : 'https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement';
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-base text-fg">
      <a href={to('/')} className="text-sm text-accent underline">{de ? '← Zurück zum Editor' : '← Back to the editor'}</a>
      <h1 className="mt-6 text-xl font-bold">{t('Privacy')}</h1>
      <p className="mt-4 text-muted">
        {de ? 'Zuletzt aktualisiert am 23. November 2026. Entwurf, keine Rechtsberatung.' : 'Last updated 23 November 2026. Draft, not legal advice.'}
      </p>
      {de ? (
        <div className="mt-6 space-y-4">
          <h2 className="pt-2 text-lg font-semibold">Was auf deinem Gerät bleibt</h2>
          <p>
            {APP_NAME} läuft vollständig in deinem Browser. Die Formeln, die du tippst, werden auf deinem eigenen Gerät dargestellt und
            weder an uns noch an andere gesendet.
          </p>
          <p>
            Damit deine Arbeit nicht verloren geht, speichert der lokale Speicher deines Browsers die Formel, an der du gerade arbeitest, deine
            gespeicherten Formeln (bis zu 50) sowie deine gewählte Größe, Darstellung und Sprache. Nichts davon verlässt dein Gerät. Du kannst
            es jederzeit löschen, indem du in den Browsereinstellungen die Daten dieser Seite löschst.
          </p>
          <h2 className="pt-2 text-lg font-semibold">Wer sonst noch beteiligt ist</h2>
          <p>
            Die Seite wird bei <strong>GitHub Pages</strong> (GitHub, Inc.) gehostet. Wie jeder Webhoster erhält GitHub die technischen Daten,
            die dein Browser beim Laden der Seiten sendet, zum Beispiel deine IP-Adresse, und kann sie zu Sicherheits- und Betriebszwecken
            protokollieren. Siehe die{' '}
            <a href={policy} className="text-accent underline">
              Datenschutzerklärung von GitHub
            </a>
            . Diese Protokolle erhalten wir nicht.
          </p>
          <p>
            <strong>Spracheingabe</strong> (nur im Dokument und nur, wenn du sie einschaltest): Dein Browser wandelt deine Sprache in Text um und
            kann die Aufnahme dafür an seinen Hersteller senden, zum Beispiel Chrome an Google und Safari an Apple. Dafür gelten deren
            Datenschutzregeln. Wir bekommen und speichern keine Aufnahme. Der Browser hört zu, solange unten auf der Seite das Mikrofon-Feld zu
            sehen ist; nach einer Minute ohne Sprache schaltet es sich ab. Dass du zugestimmt hast, merkt sich nur dieser Browser.
          </p>
          <h2 className="pt-2 text-lg font-semibold">Was wir nicht tun</h2>
          <p>
            Es gibt keine Konten, keine Cookies, keine Analysen, keine Werbung und kein Tracking. Falls sich das jemals ändert, sagt dir diese
            Seite es zuerst.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <h2 className="pt-2 text-lg font-semibold">What stays on your device</h2>
          <p>
            {APP_NAME} works entirely in your browser. The equations you type are rendered on your own device and are never sent to us or to
            anyone else.
          </p>
          <p>
            So you don't lose work, your browser's local storage keeps the equation you are editing, your saved equations (up to 50), and your
            chosen size, theme and language. Nothing of this leaves your device. You can delete it at any time by clearing this site's data in
            your browser settings.
          </p>
          <h2 className="pt-2 text-lg font-semibold">Who else is involved</h2>
          <p>
            The site is hosted on <strong>GitHub Pages</strong> (GitHub, Inc.). Like any web host, GitHub receives the technical data your
            browser sends when it loads the pages, such as your IP address, and may log it for security and operations. See the{' '}
            <a href={policy} className="text-accent underline">
              GitHub privacy statement
            </a>
            . We don't receive those logs.
          </p>
          <p>
            <strong>Voice input</strong> (only in the document, and only if you switch it on): your browser turns your speech into text and may
            send the sound to its maker for this, for example Chrome to Google and Safari to Apple. Their privacy rules apply. We neither get
            nor store any sound. The browser listens while the microphone bar shows at the bottom of the page; it switches off after a minute
            without speech. Only this browser remembers that you agreed.
          </p>
          <h2 className="pt-2 text-lg font-semibold">What we don't do</h2>
          <p>There are no accounts, no cookies, no analytics, no ads and no tracking. If that ever changes, this page will say so first.</p>
        </div>
      )}
    </main>
  );
}
