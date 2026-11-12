import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { render } from '../lib/mathjax';
import { toPng } from '../lib/export';

export type PreviewHandle = { svg: () => SVGSVGElement | null };
export type PreviewStatus = { empty: boolean; error: boolean; ready: boolean; fresh: boolean };

type Props = {
  code: string;
  fontSize: number;
  raster: boolean;
  errorId: string;
  onStatus?: (s: PreviewStatus) => void;
};

const DEBOUNCE_MS = 150;
// Errors wait a little longer than successes, so half-typed commands like
// "\fr" don't flash a message on every keystroke.
const ERROR_DELAY_MS = 700;

export const Preview = forwardRef<PreviewHandle, Props>(function Preview({ code, fontSize, raster, errorId, onStatus }, ref) {
  const [svg, setSvg] = useState<string | null>(null); // null until the engine has rendered once
  const [error, setError] = useState<string | null>(null);
  const [renderedCode, setRenderedCode] = useState<string | null>(null); // code the current svg was made from
  const [png, setPng] = useState<{ url: string; w: number; h: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    let errTimer: ReturnType<typeof setTimeout> | undefined;
    const t = setTimeout(async () => {
      const r = await render(code);
      if (id !== seq.current) return; // a newer keystroke won the race
      if (r.ok) {
        setSvg(r.svg);
        setRenderedCode(code);
        setError(null);
      } else {
        // Keep the last good svg; show the error once typing pauses.
        errTimer = setTimeout(() => id === seq.current && setError(r.message), ERROR_DELAY_MS - DEBOUNCE_MS);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(errTimer);
    };
  }, [code]);

  // Raster mode shows the PNG that export would produce, at 1x.
  useEffect(() => {
    if (!raster || !svg || error) {
      setPng(null);
      return;
    }
    let url = '';
    let cancelled = false;
    const el = box.current?.querySelector('svg');
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    toPng(el, 2, 0).then(({ blob }) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setPng({ url, w: width, h: height });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [raster, svg, error, fontSize]);

  const empty = !code.trim();
  // Ready once the engine has answered, with a picture or with an error.
  const ready = svg !== null || error !== null;
  // Export only what the code says right now, never a stale render.
  const fresh = renderedCode === code;
  useEffect(() => onStatus?.({ empty, error: !!error, ready, fresh }), [empty, error, ready, fresh, onStatus]);

  useImperativeHandle(ref, () => ({ svg: () => box.current?.querySelector('svg') ?? null }));

  return (
    <section aria-label="Preview" className="relative overflow-hidden rounded-lg border border-border bg-surface">
      {!ready && !empty && <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-accent" />}
      <div
        ref={box}
        role="img"
        aria-label={empty ? 'Empty preview' : code}
        aria-busy={!ready}
        className={`math relative flex min-h-[var(--lx-preview-min-h)] items-center justify-center overflow-x-auto p-6 text-fg transition-opacity ${
          error ? 'opacity-40' : ''
        }`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {empty ? (
          <p className="text-sm text-muted">Start typing. Your equation shows up here.</p>
        ) : !ready ? (
          <p className="text-sm text-muted">Loading the renderer…</p>
        ) : (
          <>
            <span className={`max-w-full ${png ? 'invisible absolute' : ''}`} dangerouslySetInnerHTML={{ __html: svg ?? '' }} />
            {png && <img src={png.url} width={png.w} height={png.h} alt="" className="max-w-full" />}
          </>
        )}
      </div>
      {raster && png && (
        <p className="px-4 pb-2 text-xs text-muted">Showing the image as it will be exported.</p>
      )}
      <div id={errorId} aria-live="polite">
        {error && !empty && (
          <p role="alert" className="mx-4 mb-4 flex items-start gap-2 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              {error}. {svg ? 'Your last working version stays on screen.' : ''}
            </span>
          </p>
        )}
      </div>
    </section>
  );
});
