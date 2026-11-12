import { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { Button, IconButton } from './ui';
import { Math } from './Math';
import { LOCAL_LIMIT, listSnippets, relativeTime, removeSnippet, restoreSnippet, saveSnippet, type Snippet } from '../lib/snippets';

type Props = {
  code: string;
  fontSize: number;
  canSave: boolean;
  onLoad: (s: Snippet) => void;
  notify: (msg: string, action?: { label: string; run: () => void }) => void;
};

/** S12 for guests: equations saved in this browser. */
export function SnippetsPanel({ code, fontSize, canSave, onLoad, notify }: Props) {
  const [list, setList] = useState<Snippet[]>(listSnippets);
  const [filter, setFilter] = useState('');
  const current = list.find((s) => s.code === code)?.id;
  const q = filter.trim().toLowerCase();
  const shown = q ? list.filter((s) => `${s.title ?? ''} ${s.code}`.toLowerCase().includes(q)) : list;

  function save() {
    const r = saveSnippet(code, fontSize, null);
    if (!r.ok) return notify(r.reason);
    setList(r.list);
    notify('Saved in this browser.');
  }

  function remove(s: Snippet) {
    setList(removeSnippet(s.id));
    notify('Deleted.', { label: 'Undo', run: () => setList(restoreSnippet(s)) });
  }

  return (
    <section aria-labelledby="saved-heading" className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="saved-heading" className="text-sm font-semibold">
          Saved <span className="font-normal text-muted">({list.length})</span>
        </h2>
        <Button
          size="sm"
          variant="secondary"
          icon={<Save aria-hidden className="size-4" />}
          disabled={!canSave || !!current}
          title={current ? 'Already saved' : !canSave ? 'Nothing to save yet' : undefined}
          onClick={save}
        >
          Save
        </Button>
      </div>

      {list.length > 4 && (
        <label className="mt-3 block">
          <span className="sr-only">Filter saved equations</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter"
            className="h-8 w-full rounded-md border border-input bg-bg px-2 text-sm text-fg placeholder:text-muted"
          />
        </label>
      )}

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing saved yet. Press Save to keep the equation you’re working on.</p>
      ) : shown.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No saved equation matches “{filter}”.</p>
      ) : (
        <ul className="-mx-2 mt-3 grid gap-1">
          {shown.map((s) => (
            <li key={s.id} className="group relative min-w-0">
              <button
                type="button"
                onClick={() => onLoad(s)}
                aria-current={s.id === current ? 'true' : undefined}
                className={`grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-1 rounded-md px-2 py-2 pr-10 text-left hover:bg-surface-2 ${
                  s.id === current ? 'bg-accent-soft shadow-[inset_3px_0_0_var(--lx-color-accent)]' : ''
                }`}
              >
                <span className="block max-h-12 overflow-hidden text-[13px] text-fg">
                  <Math tex={s.code} />
                </span>
                <span className="flex items-center justify-between gap-2">
                  <code className="min-w-0 truncate font-mono text-xs text-muted">{s.title ?? s.code}</code>
                  <span className="shrink-0 text-xs text-muted">{relativeTime(s.updated_at)}</span>
                </span>
              </button>
              <IconButton
                label={`Delete ${s.title ?? s.code.slice(0, 30)}`}
                onClick={() => remove(s)}
                className="absolute right-1 top-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 aria-hidden className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Kept in this browser only, up to {LOCAL_LIMIT}. Accounts that sync are coming later.</p>
    </section>
  );
}
