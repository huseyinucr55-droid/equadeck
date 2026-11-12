// Facade over the lazily loaded MathJax engine. Nothing here imports MathJax
// statically, so the first paint doesn't wait for it.
import { useSyncExternalStore } from 'react';

type Engine = typeof import('./engine');
export type { RenderResult } from './engine';

let engine: Engine | null = null;
let enginePromise: Promise<Engine> | null = null;
let extrasPromise: Promise<void> | null = null;
let version = 0; // bumps when the engine or extras arrive, so labels re-render
const listeners = new Set<() => void>();
const notify = () => {
  version++;
  listeners.forEach((l) => l());
};

export function loadEngine(): Promise<Engine> {
  enginePromise ??= import('./engine').then((e) => {
    engine = e;
    notify();
    return e;
  });
  return enginePromise;
}

export function loadExtras(): Promise<void> {
  extrasPromise ??= Promise.all([loadEngine(), import('./extras')]).then(([e]) => {
    e.enableExtras();
    notify();
  });
  return extrasPromise;
}

/** Start loading: the engine right away, the extras when the browser is idle. */
export function preload() {
  void loadEngine().then(() => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (idle) idle(() => void loadExtras());
    else setTimeout(() => void loadExtras(), 1500);
  });
}

const EXTRA_HINT = /\\(ce|pu|dv|pdv|grad|curl|laplacian|bra|ket|braket|expval|comm|acomm|qty|abs|norm|vb|vu|eval|order|op|mel|ip|op|tr|Tr|rank)\b/;

export async function render(code: string) {
  const e = await loadEngine();
  if (EXTRA_HINT.test(code) && !e.extrasEnabled()) await loadExtras();
  let r = e.render(code);
  if (!r.ok && !e.extrasEnabled() && /Undefined control sequence/.test(r.message)) {
    await loadExtras();
    r = e.render(code);
  }
  return r;
}

/** MathML for Word / PowerPoint (F1). Loads the extras when the code needs them. */
export async function mathml(code: string): Promise<string> {
  const e = await loadEngine();
  if (EXTRA_HINT.test(code) && !e.extrasEnabled()) await loadExtras();
  let r = e.toMathML(code);
  if (!r.ok && !e.extrasEnabled()) {
    await loadExtras();
    r = e.toMathML(code);
  }
  if (!r.ok) throw new Error(r.message);
  return r.svg;
}

/** The engine once loaded (null before), re-rendering the caller when it or the extras arrive. */
export function useEngine(): Engine | null {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  return engine;
}
