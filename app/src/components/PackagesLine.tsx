import { useMemo } from 'react';
import { ClipboardCopy, Info, TriangleAlert } from 'lucide-react';
import { Button } from './ui';
import { analyze } from '../lib/packages';

/** F2: under the preview, what this equation needs in a real LaTeX document. */
export function PackagesLine({ code, onCopy }: { code: string; onCopy: () => void }) {
  const a = useMemo(() => analyze(code), [code]);
  if (!code.trim()) return null;

  return (
    <section aria-label="LaTeX packages" className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Info aria-hidden className="size-4 shrink-0 text-muted" />
        {a.packages.length === 0 ? (
          <span className="text-muted">No extra packages needed in LaTeX.</span>
        ) : (
          <>
            <span className="text-muted">In LaTeX, add:</span>
            <ul className="flex flex-wrap gap-1">
              {a.packages.map((p) => (
                <li key={p.name}>
                  <code
                    title={`Needed for ${p.because.join(', ')}`}
                    className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-fg"
                  >
                    {p.option ? `[${p.option}]` : ''}
                    {p.name}
                  </code>
                  <span className="sr-only"> (for {p.because.join(', ')})</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" icon={<ClipboardCopy aria-hidden className="size-4" />} onClick={onCopy}>
          Copy as LaTeX
        </Button>
      </div>
      {a.warnings.length > 0 && (
        <ul className="grid gap-1">
          {a.warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
              <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
