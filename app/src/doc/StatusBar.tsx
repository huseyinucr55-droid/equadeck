// Bottom bar: where you are, how much you wrote, the language, and zoom.
import { Minus, Plus } from 'lucide-react';
import { useLang, useT } from '../lib/i18n';

type Props = { page: number; pages: number; words: number; zoom: number; min: number; max: number; onZoom: (z: number) => void };

export function StatusBar({ page, pages, words, zoom, min, max, onZoom }: Props) {
  const t = useT();
  const lang = useLang();
  return (
    <footer className="doc-statusbar">
      <span>{t('Page {page} of {pages}', { page, pages })}</span>
      <span>{t('{n} words', { n: words })}</span>
      <span className="max-sm:hidden">{lang === 'de' ? 'Deutsch' : 'English'}</span>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" className="doc-zoom-btn" aria-label={t('Zoom out')} onClick={() => onZoom(zoom - 10)}>
          <Minus aria-hidden className="size-3.5" />
        </button>
        <input
          type="range"
          aria-label={t('Zoom')}
          min={min}
          max={max}
          step={5}
          value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          className="doc-zoom-range"
        />
        <button type="button" className="doc-zoom-btn" aria-label={t('Zoom in')} onClick={() => onZoom(zoom + 10)}>
          <Plus aria-hidden className="size-3.5" />
        </button>
        <output className="w-12 text-right tabular-nums" aria-label={t('Zoom level')}>{zoom}%</output>
      </div>
    </footer>
  );
}
