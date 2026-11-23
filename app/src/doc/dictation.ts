// Voice input: the browser's speech recognition (Chrome, Edge, Safari) and
// what becomes of a spoken phrase: text, a formula, or a command.
import type { Editor } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import type { MathfieldElement } from 'mathlive';
import { activeMathField } from './math';
import { closeSuggestions } from './math-suggest';
import { spokenCommand, spokenFormula, spokenToLatex, type SpeechLang } from './speech-math';

// The parts of the Web Speech API used here (not in every TypeScript DOM lib).
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally?: boolean;
  start(): void;
  stop(): void;
  abort(): void;
};
type PackOptions = { langs: string[]; processLocally: boolean };
type RecognitionClass = {
  new (): Recognition;
  /** Newer Chrome: recognition on the device with a language pack. */
  available?(o: PackOptions): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  install?(o: PackOptions): Promise<boolean>;
};

const recognitionClass = (): RecognitionClass | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};
const locale = (lang: SpeechLang) => (lang === 'de' ? 'de-DE' : 'en-US');

export const voiceSupported = () => typeof window !== 'undefined' && !!recognitionClass();

/** Can this browser recognise the language on the device itself? */
export async function localPack(lang: SpeechLang): Promise<'ready' | 'downloadable' | 'no'> {
  try {
    const state = await recognitionClass()?.available?.({ langs: [locale(lang)], processLocally: true });
    if (state === 'available') return 'ready';
    return state === 'downloadable' || state === 'downloading' ? 'downloadable' : 'no';
  } catch {
    return 'no';
  }
}

export async function installPack(lang: SpeechLang): Promise<boolean> {
  try {
    return (await recognitionClass()?.install?.({ langs: [locale(lang)], processLocally: true })) ?? false;
  } catch {
    return false;
  }
}

export type VoiceError = 'denied' | 'no-mic' | 'network' | 'language' | 'failed';
export type VoiceEvents = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  /** It stopped by itself: an error, or (null) nothing was said for a while. */
  onStop: (error: VoiceError | null) => void;
};

/** Nothing said for this long: the microphone goes off. */
const SILENCE_MS = 60_000;

/** Listen until `stop()`; the browser ends after a pause, so it is started again. */
export function listen(lang: SpeechLang, local: boolean, on: VoiceEvents): { stop: () => void; cancel: () => void } {
  const Cls = recognitionClass()!;
  const rec = new Cls();
  rec.lang = locale(lang);
  rec.continuous = true;
  rec.interimResults = true;
  if (local) rec.processLocally = true;
  let active = true;
  let cancelled = false;
  let heard = Date.now();
  let started = 0;
  let quickEnds = 0;
  let done = 0; // results of this run already passed on (some browsers repeat them)

  const end = (error: VoiceError | null) => {
    if (!active) return;
    active = false;
    window.clearInterval(watch);
    rec.abort();
    on.onStop(error);
  };
  const watch = window.setInterval(() => Date.now() - heard > SILENCE_MS && end(null), 1000);
  const start = () => {
    started = Date.now();
    done = 0;
    try {
      rec.start();
    } catch {
      end('failed');
    }
  };

  rec.addEventListener('result', (e) => {
    const results = (e as Event & { results: ArrayLike<SpeechResult> }).results;
    heard = Date.now();
    quickEnds = 0;
    let interim = '';
    for (let i = 0; i < results.length; i++) {
      const text = results[i][0].transcript;
      if (!results[i].isFinal) interim += text;
      else if (i >= done) {
        done = i + 1;
        // After stop() the last phrase still arrives and counts.
        if (text.trim() && !cancelled) on.onFinal(text.trim());
      }
    }
    if (active) on.onInterim(interim.trim());
  });
  rec.addEventListener('error', (e) => {
    const code = (e as Event & { error: string }).error;
    if (code === 'not-allowed' || code === 'service-not-allowed') end('denied');
    else if (code === 'audio-capture') end('no-mic');
    else if (code === 'network') end('network');
    else if (code === 'language-not-supported') end('language');
    // "no-speech" and "aborted" are normal; "end" follows and it starts again.
  });
  rec.addEventListener('end', () => {
    if (!active) return;
    // Ending at once again and again: give up instead of looping.
    quickEnds = Date.now() - started < 1000 ? quickEnds + 1 : 0;
    if (quickEnds >= 5) end('failed');
    else window.setTimeout(() => active && start(), 150 * (quickEnds + 1));
  });
  start();

  return {
    stop: () => {
      if (!active) return;
      active = false;
      window.clearInterval(watch);
      on.onInterim('');
      rec.stop();
    },
    /** Off at once; a phrase still on its way is dropped. */
    cancel: () => {
      active = false;
      cancelled = true;
      window.clearInterval(watch);
      rec.abort();
    },
  };
}

// --- What a phrase does -------------------------------------------------------

const press = (mf: MathfieldElement, key: string) =>
  mf.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, composed: true }));

/** Each phrase is its own undo step. */
const undoStep = (editor: Editor) => editor.view.dispatch(closeHistory(editor.state.tr));

/** A space before the phrase where one is missing; a capital at the start of a sentence. */
export function fitText(before: string, phrase: string): string {
  const text = /^\s*$|[.!?]\s*$/.test(before) ? phrase.charAt(0).toUpperCase() + phrase.slice(1) : phrase;
  return before && !/[\s(„"]$/.test(before) && !/^[.,;:!?)]/.test(text) ? ` ${text}` : text;
}

/** Put a phrase where you are: in the formula you are in, or in the text. "stop" ends voice input. */
export function applySpoken(editor: Editor, phrase: string, lang: SpeechLang): 'stop' | undefined {
  if (editor.isDestroyed) return;
  const command = spokenCommand(phrase, lang);
  if (command === 'stop') return 'stop';
  if (command === 'undo') {
    editor.commands.undo();
    return;
  }
  const mf = activeMathField();
  if (mf) {
    closeSuggestions(mf); // else Enter would take a suggestion and Esc only close the list
    if (command === 'newline') press(mf, 'Enter');
    else if (command === 'text') press(mf, 'Escape');
    else if (!command) {
      const { latex } = spokenToLatex(phrase.replace(/[.?]+$/, ''), lang);
      if (!latex) return;
      undoStep(editor);
      mf.insert(latex, { mode: 'math', format: 'latex', selectionMode: latex.includes('placeholder') ? 'placeholder' : 'after', focus: true });
      closeSuggestions(mf);
      undoStep(editor);
    }
    return;
  }
  if (command === 'text') return;
  undoStep(editor);
  if (command === 'newline') editor.chain().focus().splitBlock().run();
  else if (command === 'formula') editor.chain().focus().insertMath().run();
  else {
    const { $from } = editor.state.selection;
    const before = $from.parent.isTextblock ? $from.parent.textBetween(0, $from.parentOffset, undefined, 'x') : '';
    const latex = spokenFormula(phrase, lang);
    if (latex) {
      if (before && !/\s$/.test(before)) insertPlain(editor, ' ');
      const open = latex.includes('placeholder');
      editor.chain().focus().insertMath(latex, false, !open).run();
    } else insertPlain(editor, fitText(before, phrase));
  }
  undoStep(editor);
}

/** As plain text (never read as HTML). */
function insertPlain(editor: Editor, text: string) {
  const { tr } = editor.state;
  editor.view.dispatch(tr.insertText(text).scrollIntoView());
}
