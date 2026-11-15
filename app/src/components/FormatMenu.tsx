import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Eraser, Italic, List, Underline } from 'lucide-react';
import { useT } from '../lib/i18n';
import { FONTS, HIGHLIGHTS, SIZES, TEXT_COLORS, type Format } from '../lib/format';

type Props = {
  x: number;
  y: number;
  onPick: (f: Format) => void;
  onClose: () => void;
};

const ITEM = 'flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-fg hover:bg-surface-2 focus:bg-surface-2';
const CHIP = 'inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border px-2 text-xs text-fg hover:bg-surface-2 focus:bg-surface-2';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="px-1 py-1">
      <div className="px-2 pb-1 text-xs text-muted" aria-hidden="true">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

/** Word-style right-click menu for the editor selection. */
export function FormatMenu({ x, y, onPick, onClose }: Props) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);

  // Keep the menu inside the window.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const m = 8;
    el.style.left = `${Math.max(m, Math.min(x, window.innerWidth - width - m))}px`;
    el.style.top = `${Math.max(m, Math.min(y, window.innerHeight - height - m))}px`;
  }, [x, y]);

  useEffect(() => {
    box.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const away = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', away, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('pointerdown', away, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      onClose();
      return;
    }
    const items = [...(box.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (at + 1) % items.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (at - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      items[next].focus();
    }
  };

  const pick = (f: Format) => () => onPick(f);

  return createPortal(
    <div
      ref={box}
      role="menu"
      aria-label={t('Formatting')}
      onKeyDown={onKey}
      onContextMenu={(e) => e.preventDefault()}
      style={{ left: x, top: y, maxHeight: 'calc(100vh - 16px)' }}
      className="fixed z-50 w-[22rem] max-w-[calc(100vw-16px)] overflow-y-auto rounded-lg border border-border bg-surface p-1 text-fg shadow-pop"
    >
      <button type="button" role="menuitem" tabIndex={-1} className={ITEM + ' w-full'} onClick={pick({ kind: 'bold' })}>
        <Bold size={16} aria-hidden="true" /> {t('Bold')}
      </button>
      <button type="button" role="menuitem" tabIndex={-1} className={ITEM + ' w-full'} onClick={pick({ kind: 'italic' })}>
        <Italic size={16} aria-hidden="true" /> {t('Italic')}
      </button>
      <button type="button" role="menuitem" tabIndex={-1} className={ITEM + ' w-full'} onClick={pick({ kind: 'underline' })}>
        <Underline size={16} aria-hidden="true" /> {t('Underline')}
      </button>
      <div role="separator" className="my-1 h-px bg-border" />
      <Row label={t('Font size')}>
        {SIZES.map((s) => (
          <button key={s.id} type="button" role="menuitem" tabIndex={-1} className={CHIP} onClick={pick({ kind: 'size', size: s.id })}>
            {t(s.label)}
          </button>
        ))}
      </Row>
      <Row label={t('Text colour')}>
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-label={`${t('Text colour')}: ${t(c.label)}`}
            title={t(c.label)}
            className="size-10 rounded-md border border-border"
            style={{ background: c.value }}
            onClick={pick({ kind: 'color', color: c.value })}
          />
        ))}
      </Row>
      <Row label={t('Highlight')}>
        {HIGHLIGHTS.map((c) => (
          <button
            key={c.value}
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-label={`${t('Highlight')}: ${t(c.label)}`}
            title={t(c.label)}
            className="size-10 rounded-md border border-border"
            style={{ background: c.value }}
            onClick={pick({ kind: 'highlight', color: c.value })}
          />
        ))}
      </Row>
      <Row label={t('Font')}>
        {FONTS.map((f) => (
          <button key={f.id} type="button" role="menuitem" tabIndex={-1} className={CHIP} onClick={pick({ kind: 'font', font: f.id })}>
            {t(f.label)}
          </button>
        ))}
      </Row>
      <div role="separator" className="my-1 h-px bg-border" />
      <button type="button" role="menuitem" tabIndex={-1} className={ITEM + ' w-full'} onClick={pick({ kind: 'bullet' })}>
        <List size={16} aria-hidden="true" /> {t('Bullet point')}
      </button>
      <button type="button" role="menuitem" tabIndex={-1} className={ITEM + ' w-full'} onClick={pick({ kind: 'clear' })}>
        <Eraser size={16} aria-hidden="true" /> {t('Clear formatting')}
      </button>
    </div>,
    document.body,
  );
}
