import { useState } from 'react';
import { Button, Dialog, NumberField } from './ui';
import { useEngine } from '../lib/mathjax';
import type { MatrixKind } from '../lib/insert';

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
  const engine = useEngine();
  const [kind, setKind] = useState<MatrixKind>('pmatrix');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const valid = [rows, cols].every((n) => Number.isFinite(n) && n >= 1 && n <= 12);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Insert matrix"
      footer={
        <>
          <Button size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" disabled={!valid} onClick={() => onInsert(kind, rows, cols)}>
            Insert
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Brackets</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label
              key={k.kind}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2 text-fg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                kind === k.kind ? 'border-2 border-accent bg-accent-soft' : 'border-border hover:bg-surface-2'
              }`}
            >
              <input type="radio" name="matrix-kind" aria-label={k.name} value={k.kind} checked={kind === k.kind} onChange={() => setKind(k.kind)} className="sr-only" />
              <span aria-hidden className="math text-[15px]" dangerouslySetInnerHTML={{ __html: engine?.renderLabel(sample(k.kind)) ?? '' }} />
              <span className="text-xs text-muted">{k.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-6">
        <NumberField id="matrix-rows" label="Rows" value={rows} min={1} max={12} onChange={setRows} />
        <NumberField id="matrix-cols" label="Columns" value={cols} min={1} max={12} onChange={setCols} />
      </div>
    </Dialog>
  );
}
