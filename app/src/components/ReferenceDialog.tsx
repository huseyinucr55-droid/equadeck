import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { Dialog } from './ui';
import { Math } from './Math';
import { SHEETS } from '../data/reference';
import { loadExtras } from '../lib/mathjax';
import { useLang, useT } from '../lib/i18n';

/** S04–S08 in one dialog: a tab per sheet; every row inserts its code. */
export function ReferenceDialog({ open, onClose, onInsert }: { open: boolean; onClose: () => void; onInsert: (code: string) => void }) {
  const t = useT();
  const lang = useLang();
  const [tab, setTab] = useState(SHEETS[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sheet = SHEETS.find((s) => s.id === tab)!;

  useEffect(() => {
    if (open && (tab === 'chemistry' || tab === 'physics')) void loadExtras();
  }, [open, tab]);

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = SHEETS.findIndex((s) => s.id === tab);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = SHEETS[(i + step + SHEETS.length) % SHEETS.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('Reference')} wide>
      <div role="tablist" aria-label={t('Reference sheets')} onKeyDown={onTabKey} className="-mx-6 -mt-5 mb-4 flex overflow-x-auto border-b border-border px-4 [scrollbar-width:none]">
        {SHEETS.map((s) => (
          <button
            key={s.id}
            ref={(el) => {
              tabRefs.current[s.id] = el;
            }}
            role="tab"
            id={`ref-tab-${s.id}`}
            aria-selected={s.id === tab}
            aria-controls="ref-panel"
            tabIndex={s.id === tab ? 0 : -1}
            onClick={() => setTab(s.id)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${
              s.id === tab ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            {t(s.title)}
          </button>
        ))}
      </div>

      <div id="ref-panel" role="tabpanel" aria-labelledby={`ref-tab-${tab}`}>
        <p className="text-sm text-muted">
          {t(sheet.intro)} {t('Click any line to insert it.')}
          {sheet.link && (
            <>
              {' '}
              <a href={sheet.link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent underline">
                {t(sheet.link.label)}
                <ExternalLink aria-hidden className="size-3" />
              </a>
            </>
          )}
        </p>
        {sheet.sections.map((sec) => (
          <section key={sec.title} className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{lang === 'de' && sec.title === 'Cancel' ? 'Durchstreichen' : t(sec.title)}</h3>
            <ul className="grid gap-1">
              {sec.rows.map((row) => (
                <li key={row.code}>
                  <button
                    type="button"
                    onClick={() => onInsert(row.code)}
                    aria-label={row.note ? t('Insert {code}, {note}', { code: row.code, note: t(row.note) }) : t('Insert {code}', { code: row.code })}
                    className="grid w-full grid-cols-1 items-center gap-1 rounded-md px-3 py-2 text-left hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
                  >
                    <span className="min-w-0">
                      <code className="block break-all font-mono text-xs text-accent">{row.code}</code>
                      {row.note && <span className="text-xs text-muted">{t(row.note)}</span>}
                    </span>
                    <span className="min-w-0 overflow-x-auto text-[15px] text-fg">
                      <Math tex={row.render ?? row.code} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
