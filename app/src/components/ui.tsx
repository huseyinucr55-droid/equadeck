import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { setLang, useLang, useT } from '../lib/i18n';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border border-border hover:bg-surface-2',
  ghost: 'bg-transparent text-fg hover:bg-surface-2',
  danger: 'bg-danger text-on-accent hover:opacity-90',
};
const SIZE: Record<Size, string> = { sm: 'h-8 px-3', md: 'h-10 px-4' };

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors duration-[var(--lx-motion-fast)] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

/** Icon-only ghost button with an accessible name and a native tooltip. */
export function IconButton({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 ${rest.className ?? ''}`}
    >
      {children}
    </button>
  );
}

/** Native <dialog>: focus trap, Esc to close and focus return come from the browser. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  // Close on a backdrop click only when the press also started on the
  // backdrop; a click that opened the dialog, or a text-selection drag that
  // ends outside the panel, must not close it.
  const downOnBackdrop = useRef(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === ref.current;
      }}
      onClick={(e) => {
        if (e.target === ref.current && downOnBackdrop.current) onClose();
        downOnBackdrop.current = false;
      }}
      aria-label={title}
      className={`m-auto max-h-[85vh] w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-lg border border-border bg-bg p-0 shadow-pop max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none`}
    >
      <div className="flex max-h-[85vh] flex-col">
        {/* divs, not header/footer: those would add page landmarks (BUG-006) */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label={t('Close')} onClick={onClose}>
            <X aria-hidden className="size-4" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-6 py-3">{footer}</div>}
      </div>
    </dialog>
  );
}

export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  id,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  id: string;
}) {
  const t = useT();
  const invalid = !Number.isFinite(value) || value < min || value > max;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ''}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className={`h-8 w-18 rounded-md border bg-bg px-2 text-sm tabular-nums text-fg ${invalid ? 'border-danger' : 'border-input'}`}
      />
      {invalid && (
        <span id={`${id}-hint`} className="text-xs text-danger">
          {t('{min} to {max}', { min, max })}
        </span>
      )}
    </div>
  );
}

export type ToastState = { message: string; action?: { label: string; run: () => void } } | null;

export function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:justify-end md:px-6">
      {toast && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-md bg-fg px-4 py-2 text-sm text-bg shadow-pop">
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.run();
                onDismiss();
              }}
              className="rounded-sm font-semibold underline underline-offset-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Header switch between English and German. The label says what a click does. */
export function LangSwitch() {
  const lang = useLang();
  const label = lang === 'de' ? 'DE: Sprache: Deutsch. Switch to English' : 'EN: Language: English. Auf Deutsch umschalten';
  return (
    <IconButton label={label} onClick={() => setLang(lang === 'de' ? 'en' : 'de')} className="w-9">
      <span aria-hidden className="text-xs font-semibold">
        {lang === 'de' ? 'DE' : 'EN'}
      </span>
    </IconButton>
  );
}
