// The microphone button in the title bar, the question before its first use,
// and the bar that shows what is being heard.
import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Mic, MicOff } from 'lucide-react';
import { Button, Dialog } from '../components/ui';
import { useLang, useT } from '../lib/i18n';
import { to } from '../lib/paths';
import { applySpoken, installPack, listen, localPack, voiceSupported, type VoiceError } from './dictation';

const KEY = 'lx.doc.voiceOk'; // "cloud": agreed that the browser may send the sound away
const agreed = () => {
  try {
    return localStorage.getItem(KEY) === 'cloud';
  } catch {
    return false;
  }
};

const ERRORS: Record<VoiceError, string> = {
  denied: 'The microphone is blocked. Allow it in the address bar of your browser.',
  'no-mic': 'No microphone found.',
  network: 'Voice input needs an internet connection.',
  language: 'This browser cannot recognise this language.',
  failed: 'Voice input stopped. Please try again.',
};

type Mode = 'off' | 'local' | 'cloud';

export function VoiceInput({ editor, docId, say }: { editor: Editor | null; docId: string; say: (msg: string) => void }) {
  const t = useT();
  const lang = useLang();
  const [mode, setMode] = useState<Mode>('off');
  const [interim, setInterim] = useState('');
  const [asking, setAsking] = useState(false);
  const [pack, setPack] = useState<'ready' | 'downloadable' | 'no'>('no');
  const [loading, setLoading] = useState(false);
  const session = useRef<ReturnType<typeof listen> | null>(null);
  const starting = useRef(false);

  const stop = () => {
    session.current?.stop();
    session.current = null;
    setMode('off');
    setInterim('');
  };

  /** Off without the phrase still on its way (it belongs to what you left). */
  const cancel = () => {
    session.current?.cancel();
    session.current = null;
    setMode('off');
    setInterim('');
  };

  const start = (local: boolean) => {
    if (!editor || session.current) return;
    setMode(local ? 'local' : 'cloud');
    session.current = listen(lang, local, {
      onInterim: setInterim,
      onFinal: (text) => {
        if (applySpoken(editor, text, lang) === 'stop') stop();
      },
      onStop: (error) => {
        session.current = null;
        setMode('off');
        setInterim('');
        say(t(error ? ERRORS[error] : 'Voice input is off: nothing was said for a minute.'));
      },
    });
  };

  const toggle = async () => {
    if (session.current) return stop();
    if (starting.current) return;
    starting.current = true;
    const state = await localPack(lang);
    starting.current = false;
    if (state === 'ready') return start(true); // nothing leaves the device: nothing to ask
    if (agreed()) return start(false);
    setPack(state);
    setAsking(true);
  };
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  // F8 switches it on and off.
  useEffect(() => {
    if (!voiceSupported()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'F8' || e.repeat || document.querySelector('dialog[open]')) return;
      e.preventDefault();
      void toggleRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // Another language or document, another tab, leaving: the microphone goes off.
  useEffect(() => cancel, [lang, docId]);
  useEffect(() => {
    const onHide = () => document.hidden && session.current && cancel();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  if (!voiceSupported()) return null;
  const on = mode !== 'off';
  const label = t('Voice input (F8)');

  return (
    <>
      <button
        type="button"
        className="doc-link doc-voice-btn"
        aria-pressed={on}
        aria-label={label}
        title={label}
        onMouseDown={(e) => e.preventDefault()} // keeps the cursor in the text or formula
        onClick={toggle}
      >
        <Mic aria-hidden className="size-4" />
      </button>

      {on && (
        <div className="doc-voice">
          <Mic aria-hidden className="size-4 shrink-0 doc-voice-live" />
          <span className="doc-voice-text" role={interim ? undefined : 'status'}>{interim || t('Listening… Say "formula" to dictate maths.')}</span>
          <span className="doc-voice-where">{mode === 'local' ? t('on this device') : t('via your browser')}</span>
          <button type="button" className="doc-link" onMouseDown={(e) => e.preventDefault()} onClick={stop}>
            <MicOff aria-hidden className="size-4" /> {t('Stop')}
          </button>
        </div>
      )}

      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title={t('Voice input')}
        footer={
          <>
            <Button onClick={() => setAsking(false)}>{t('Cancel')}</Button>
            {pack === 'downloadable' && (
              <Button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const ok = await installPack(lang);
                  setLoading(false);
                  setAsking(false);
                  if (ok) start(true);
                  else say(t('The language pack could not be downloaded.'));
                }}
              >
                {loading ? t('Downloading…') : t('Only on this device')}
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => {
                try {
                  localStorage.setItem(KEY, 'cloud');
                } catch {
                  /* ignore */
                }
                setAsking(false);
                start(false);
              }}
            >
              {t('Allow and start')}
            </Button>
          </>
        }
      >
        <p className="m-0">
          {t('Your browser turns your speech into text. It may send the sound to its maker for this (Chrome: Google, Safari: Apple). Equadeck itself gets and stores no sound.')}
        </p>
        {pack === 'downloadable' && (
          <p className="mt-3 mb-0">{t('This browser can also do it on your device, after downloading a language pack once.')}</p>
        )}
        <p className="mt-3 mb-0">
          <a href={to('/privacy')} target="_blank" rel="noreferrer" className="text-accent underline">{t('Privacy')}</a>
        </p>
      </Dialog>
    </>
  );
}
