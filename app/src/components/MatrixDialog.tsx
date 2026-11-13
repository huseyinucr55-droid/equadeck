import { useState } from 'react';
import { Button, Dialog, NumberField } from './ui';
import { useEngine } from '../lib/mathjax';
import type { MatrixKind } from '../lib/insert';
import { useT } from '../lib/i18n';

const KINDS: { kind: MatrixKind; name: string }[] = [
  { kind: 'matrix', name: 'No brackets' },
  { kind: 'pmatrix', name: 'Parentheses' },
  { kind: 'bmatrix', name: 'Square brackets' },
  { kind: 'vmatrix', name: 'Determinant bars' },
  { kind: 'Vmatrix', name: 'Double bars' },
  { kind: 'Bmatrix', name: 'Braces' },
];

const sample = (k: MatrixKind) => `\\begin{${k}}a&b\\\\c&d\\end{${k}}`;

export function MatrixDialog({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (kind: MatrixKind, rows: number, cols: number) => void;
}) {
  const t = useT();
  const engine = useEngine();
  const [kind, setKind] = useState<MatrixKind>('pmatrix');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const valid = [rows, cols].every((n) => Number.isFinite(n) && n >= 1 && n <= 12);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('Insert matrix')}
      footer={
        <>
          <Button size="sm" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button size="sm" variant="primary" disabled={!valid} onClick={() => onInsert(kind, rows, cols)}>
            {t('Insert')}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t('Brackets')}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label
              key={k.kind}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2 text-fg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                kind === k.kind ? 'border-2 border-accent bg-accent-soft' : 'border-border hover:bg-surface-2'
              }`}
            >
              <input type="radio" name="matrix-kind" aria-label={t(k.name)} value={k.kind} checked={kind === k.kind} onChange={() => setKind(k.kind)} className="sr-only" />
              <span aria-hidden className="math text-[15px]" dangerouslySetInnerHTML={{ __html: engine?.renderLabel(sample(k.kind)) ?? '' }} />
              <span className="text-xs text-muted">{t(k.name)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-6">
        <NumberField id="matrix-rows" label={t('Rows')} value={rows} min={1} max={12} onChange={setRows} />
        <NumberField id="matrix-cols" label={t('Columns')} value={cols} min={1} max={12} onChange={setCols} />
      </div>
    </Dialog>
  );
}
