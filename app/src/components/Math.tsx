import { memo, useEffect } from 'react';
import { loadExtras, useEngine } from '../lib/mathjax';

/** Renders TeX with the lazy engine; a skeleton until it's loaded. */
export const Math = memo(function Math({ tex, display = false, className = '' }: { tex: string; display?: boolean; className?: string }) {
  const engine = useEngine();
  const block = engine && display ? engine.render(tex) : null;
  const inline = engine && !display ? engine.renderLabel(tex) : '';
  const markup = display ? (block && block.ok ? block.svg : '') : inline;
  const failed = !!engine && !markup;

  // Chemistry and physics macros live in the extras chunk.
  useEffect(() => {
    if (failed && engine && !engine.extrasEnabled()) void loadExtras();
  }, [failed, engine]);

  if (!engine) return <span aria-hidden className={`inline-block h-4 w-12 animate-pulse rounded-sm bg-surface-2 ${className}`} />;
  return <span aria-hidden className={`math ${className}`} dangerouslySetInnerHTML={{ __html: markup }} />;
});
