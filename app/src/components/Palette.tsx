import { memo, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { ALL_SYMBOLS, GROUPS, labelOf, type Sym } from '../data/symbols';
import { useEngine } from '../lib/mathjax';
import { useT } from '../lib/i18n';

type Engine = NonNullable<ReturnType<typeof useEngine>>;

const Key = memo(function Key({
  sym,
  onInsert,
  tabIndex,
  engine,
}: {
  sym: Sym;
  onInsert: (tpl: string) => void;
  tabIndex: number;
  engine: Engine | null;
}) {
  const t = useT();
  const name = t(sym.name);
  const html = engine?.renderLabel(labelOf(sym)) ?? '';
  return (
    <button
      type="button"
      data-key
      tabIndex={tabIndex}
      aria-label={name}
      title={`${name}  ${sym.insert.replace('#0', '…').trim()}`}
      // Keep the editor's selection: don't take focus on mouse down.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onInsert(sym.insert)}
      className="math inline-grid h-[var(--lx-key)] min-w-[var(--lx-key)] place-items-center rounded-sm bg-surface px-1 text-[15px] text-fg transition-colors duration-[var(--lx-motion-fast)] hover:bg-surface-2 active:bg-accent-soft active:text-accent"
    >
      {html ? (
        <span aria-hidden dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <span aria-hidden className="block size-4 animate-pulse rounded-sm bg-surface-2" />
      )}
    </button>
  );
});

/** Arrow keys move between keys in the grid (roving tabindex). */
function onGridKey(e: KeyboardEvent<HTMLDivElement>) {
  const keys = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-key]'));
  const i = keys.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: keys.length - 1 }[e.key];
  let target = next;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const top = keys[i].offsetTop;
    const left = keys[i].offsetLeft;
    const rows = keys.filter((k) => (e.key === 'ArrowDown' ? k.offsetTop > top : k.offsetTop < top));
    if (rows.length) {
      const rowTop = e.key === 'ArrowDown' ? Math.min(...rows.map((k) => k.offsetTop)) : Math.max(...rows.map((k) => k.offsetTop));
      const row = rows.filter((k) => k.offsetTop === rowTop);
      const best = row.reduce((a, b) => (Math.abs(b.offsetLeft - left) < Math.abs(a.offsetLeft - left) ? b : a));
      target = keys.indexOf(best);
    }
  }
  if (target === undefined || target < 0 || target >= keys.length) return;
  e.preventDefault();
  keys.forEach((k, j) => (k.tabIndex = j === target ? 0 : -1));
  keys[target].focus();
}

export function Palette({ onInsert }: { onInsert: (tpl: string) => void }) {
  const t = useT();
  const engine = useEngine();
  const [tab, setTab] = useState(GROUPS[0].id);
  const [query, setQuery] = useState('');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!q) return GROUPS.find((g) => g.id === tab)!.symbols;
    return ALL_SYMBOLS.filter((s) => `${s.name} ${t(s.name)} ${s.insert} ${s.keywords ?? ''}`.toLowerCase().includes(q));
  }, [q, tab, t]);

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = GROUPS.findIndex((g) => g.id === tab);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = GROUPS[(i + step + GROUPS.length) % GROUPS.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return (
    <section aria-label={t('Symbols')} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div role="tablist" aria-label={t('Symbol groups')} onKeyDown={onTabKey} className="-mb-px flex min-w-0 flex-1 overflow-x-auto border-b border-border [scrollbar-width:none]">
          {GROUPS.map((g) => {
            const on = g.id === tab && !q;
            return (
              <button
                key={g.id}
                ref={(el) => {
                  tabRefs.current[g.id] = el;
                }}
                role="tab"
                id={`tab-${g.id}`}
                aria-selected={on}
                aria-controls="palette-panel"
                tabIndex={g.id === tab ? 0 : -1}
                onClick={() => {
                  setTab(g.id);
                  setQuery('');
                }}
                className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                  on ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
                }`}
              >
                {t(g.title)}
              </button>
            );
          })}
        </div>
        <label className="relative flex items-center max-sm:order-first max-sm:w-full">
          <span className="sr-only">{t('Search symbols')}</span>
          <Search aria-hidden className="pointer-events-none absolute left-2 size-4 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search symbols')}
            className="h-8 w-full rounded-md border sm:w-44 border-input bg-bg pl-8 pr-2 text-sm text-fg placeholder:text-muted"
          />
        </label>
      </div>

      <div
        id="palette-panel"
        role="tabpanel"
        aria-labelledby={q ? undefined : `tab-${tab}`}
        aria-label={q ? t('Search results for {q}', { q: query }) : undefined}
        onKeyDown={onGridKey}
        className="flex min-h-[calc(var(--lx-key)*2+4px)] flex-wrap content-start gap-1"
      >
        {visible.length ? (
          visible.map((sym, i) => (
            <Key key={`${sym.name}-${sym.insert}`} sym={sym} onInsert={onInsert} tabIndex={i === 0 ? 0 : -1} engine={engine} />
          ))
        ) : (
          <p className="py-2 text-sm text-muted">{t('No symbols match “{q}”.', { q: query })}</p>
        )}
      </div>
    </section>
  );
}
