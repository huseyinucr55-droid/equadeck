import { Dialog } from './ui';
import { Math } from './Math';
import { EXAMPLES } from '../data/examples';
import { useT } from '../lib/i18n';

/** S03: click replaces the editor content, Shift+click appends on a new line. */
export function ExamplesDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (code: string, append: boolean) => void;
}) {
  const t = useT();
  return (
    <Dialog open={open} onClose={onClose} title={t('Examples')} wide>
      <p className="mb-4 text-sm text-muted">{t('Pick one to start from. Hold Shift to add it below your current equation instead.')}</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <li key={ex.name}>
            <button
              type="button"
              onClick={(e) => onPick(ex.code, e.shiftKey)}
              className="flex h-full w-full flex-col items-center gap-2 rounded-md border border-border bg-bg p-3 text-fg hover:bg-surface-2"
            >
              <span className="flex min-h-14 max-w-full items-center overflow-x-auto text-[15px]">
                <Math tex={ex.code} display />
              </span>
              <span className="text-xs font-medium text-muted">{t(ex.name)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
