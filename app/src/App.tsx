import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen, ClipboardCopy, Download, FileText, FileType, Grid3x3, Image as ImageIcon, LogIn, Moon, Redo2, Sparkles, Sun, SunMoon, Undo2, WrapText,
} from 'lucide-react';
import { PackagesLine } from './components/PackagesLine';
import { mathml } from './lib/mathjax';
import { latexSnippet } from './lib/packages';
import { Editor, type EditorHandle } from './components/Editor';
import { Preview, type PreviewHandle, type PreviewStatus } from './components/Preview';
import { Palette } from './components/Palette';
import { MatrixDialog } from './components/MatrixDialog';
import { ExamplesDialog } from './components/ExamplesDialog';
import { ReferenceDialog } from './components/ReferenceDialog';
import { SnippetsPanel } from './components/SnippetsPanel';
import { Button, Dialog, IconButton, NumberField, Toast, type ToastState } from './components/ui';
import { matrixTemplate, removeLineBreaks } from './lib/insert';
import { download, preloadPdf, svgBlob, toPdf, toPng } from './lib/export';

// Browsers only allow an automatic download shortly after the click
// (transient user activation, ~5 s in Chrome). Past this, ask for a click.
const AUTO_DOWNLOAD_MS = 3000;
import { APP_NAME } from './brand';
import { to } from './lib/paths';

const DRAFT_KEY = 'lx.draft.v1';
const SEED = 'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\, e^{2\\pi i \\xi x}\\, d\\xi';
const FONT_MIN = 8;
const FONT_MAX = 96;

type Draft = { code: string; fontSize: number; raster?: boolean };
function loadDraft(): Required<Draft> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<Draft>;
      if (typeof d.code === 'string')
        return { code: d.code, fontSize: typeof d.fontSize === 'number' ? d.fontSize : 20, raster: d.raster === true };
    }
  } catch {
    /* private mode or bad JSON: start fresh */
  }
  return { code: SEED, fontSize: 20, raster: false };
}

type Theme = 'system' | 'light' | 'dark';
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const t = localStorage.getItem('lx.theme');
      return t === 'light' || t === 'dark' ? t : 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lx.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const next = () => setTheme((t) => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'));
  return { theme, next };
}

type Panel = null | 'matrix' | 'examples' | 'reference' | 'signin';

/** Keep the editor's selection when a toolbar button is pressed with the mouse. */
const keepSelection = (e: React.MouseEvent) => e.preventDefault();

export default function App() {
  const initial = useRef(loadDraft()).current;
  const [code, setCode] = useState(initial.code);
  const [fontSize, setFontSize] = useState(initial.fontSize);
  const [raster, setRaster] = useState(initial.raster);
  const [hist, setHist] = useState({ canUndo: false, canRedo: false });
  const [status, setStatus] = useState<PreviewStatus>({ empty: !initial.code.trim(), error: false, ready: false, fresh: false });
  const [scale, setScale] = useState(2);
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [busy, setBusy] = useState<null | 'png' | 'pdf'>(null);
  const editor = useRef<EditorHandle>(null);
  const preview = useRef<PreviewHandle>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const { theme, next: nextTheme } = useTheme();

  const validSize = Number.isFinite(fontSize) && fontSize >= FONT_MIN && fontSize <= FONT_MAX;
  const shownSize = validSize ? fontSize : 20;

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ code, fontSize: shownSize, raster }));
      } catch {
        /* storage full or blocked: the draft just isn't kept */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [code, shownSize, raster]);

  const say = useCallback((message: string, action?: { label: string; run: () => void }, ms?: number) => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, action });
    toastTimer.current = window.setTimeout(() => setToast(null), ms ?? (action ? 6000 : 4000));
  }, []);

  const onStatus = useCallback((s: PreviewStatus) => setStatus(s), []);
  const insert = useCallback((tpl: string) => editor.current?.insertTemplate(tpl), []);
  const close = useCallback(() => setPanel(null), []);
  /** Run an editor change after a dialog has closed (closing returns focus to its trigger). */
  const afterClose = (fn: () => void) => {
    setPanel(null);
    setTimeout(fn, 0);
  };

  const exportBlocked = status.empty
    ? 'Nothing to export yet'
    : !status.ready
      ? 'The renderer is still loading'
      : status.error
        ? 'Fix the error first'
        : !status.fresh
          ? 'Still updating the preview'
          : null;

  async function downloadPng() {
    const el = preview.current?.svg();
    if (!el) return;
    setBusy('png');
    try {
      const { blob, scale: used, clamped } = await toPng(el, scale);
      download(blob, 'equation.png');
      say(clamped ? `Too large for this device, saved at ${used}×.` : 'Saved as PNG.');
    } catch (e) {
      say(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    const el = preview.current?.svg();
    if (!el) return;
    setBusy('pdf');
    const started = performance.now();
    try {
      const blob = await toPdf(el);
      if (performance.now() - started < AUTO_DOWNLOAD_MS) {
        download(blob, 'equation.pdf');
        say('Saved as PDF.');
      } else {
        // Too slow for the browser to treat the save as part of the click (BUG-007).
        say('Your PDF is ready.', { label: 'Save PDF', run: () => download(blob, 'equation.pdf') }, 30_000);
      }
    } catch {
      say('Could not create the PDF. Try PNG or SVG.');
    } finally {
      setBusy(null);
    }
  }

  function downloadSvg() {
    const el = preview.current?.svg();
    if (!el) return;
    download(svgBlob(el), 'equation.svg');
    say('Saved as SVG.');
  }

  async function copyLatex() {
    try {
      await navigator.clipboard.writeText(code);
      say('LaTeX copied to your clipboard.');
    } catch {
      say('Copying is blocked in this browser.');
    }
  }

  /** F1: MathML as plain text; Word and PowerPoint turn it into an editable equation on paste. */
  async function copyForWord() {
    try {
      const text = await mathml(code);
      await navigator.clipboard.writeText(text);
      say('Ready. Paste into Word or PowerPoint for an equation you can edit.');
    } catch {
      say('Could not copy for Word. Try Copy image instead.');
    }
  }

  /** F2: preamble lines + the equation, ready for a .tex file. */
  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(latexSnippet(code));
      say('LaTeX with its packages copied.');
    } catch {
      say('Copying is blocked in this browser.');
    }
  }

  async function copyImage() {
    const el = preview.current?.svg();
    if (!el) return;
    try {
      const { blob } = await toPng(el, scale);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      say('Image copied.');
    } catch {
      say('This browser cannot copy images. Use Download instead.');
    }
  }

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : SunMoon;

  return (
    <div className="flex min-h-full flex-col">
      <a href="#editor" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-bg focus:px-3 focus:py-2">
        Skip to editor
      </a>

      <header className="sticky top-0 z-20 border-b border-border bg-bg">
        <div className="mx-auto flex h-14 max-w-[var(--lx-layout-max)] items-center gap-2 px-4 lg:px-6">
          <h1 className="m-0 flex min-w-0 items-center gap-2 text-base font-semibold">
            <Sparkles aria-hidden className="size-5 shrink-0 text-accent" />
            <span className="truncate">{APP_NAME}</span>
          </h1>
          <nav aria-label="Main" className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" icon={<BookOpen aria-hidden className="size-4" />} aria-label="Reference" onClick={() => setPanel('reference')}>
              <span className="max-sm:hidden">Reference</span>
            </Button>
            <IconButton label={`Theme: ${theme}. Switch theme`} onClick={nextTheme}>
              <ThemeIcon aria-hidden className="size-4" />
            </IconButton>
            <Button size="sm" icon={<LogIn aria-hidden className="size-4" />} aria-label="Sign in" onClick={() => setPanel('signin')}>
              <span className="max-sm:hidden">Sign in</span>
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[var(--lx-layout-max)] flex-1 gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_var(--lx-sidebar-w)] lg:px-6 lg:py-6">
        <main className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1 max-md:order-1" role="toolbar" aria-label="Editing">
            <IconButton label="Undo (Ctrl+Z)" disabled={!hist.canUndo} onClick={() => editor.current?.undo()}>
              <Undo2 aria-hidden className="size-4" />
            </IconButton>
            <IconButton label="Redo (Ctrl+Shift+Z)" disabled={!hist.canRedo} onClick={() => editor.current?.redo()}>
              <Redo2 aria-hidden className="size-4" />
            </IconButton>
            <span aria-hidden className="mx-1 h-5 w-px bg-border" />
            <Button variant="ghost" size="sm" onMouseDown={keepSelection} onClick={() => insert('\\text{#0}')}>Text</Button>
            <Button variant="ghost" size="sm" onMouseDown={keepSelection} onClick={() => insert('\\mathbf{#0}')}>Bold</Button>
            <Button variant="ghost" size="sm" onMouseDown={keepSelection} onClick={() => insert('\\displaystyle ')}>Display</Button>
            <Button variant="ghost" size="sm" icon={<Grid3x3 aria-hidden className="size-4" />} onClick={() => setPanel('matrix')}>Matrix</Button>
            <Button variant="ghost" size="sm" icon={<Sparkles aria-hidden className="size-4" />} onClick={() => setPanel('examples')}>Examples</Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<WrapText aria-hidden className="size-4" />}
              disabled={!/\\\\|\n/.test(code)}
              title="Put everything on one line"
              onClick={() => editor.current?.replaceAll(removeLineBreaks(code))}
            >
              Join lines
            </Button>
            <div className="ml-auto">
              <NumberField id="font-size" label="Size" value={fontSize} min={FONT_MIN} max={FONT_MAX} onChange={setFontSize} />
            </div>
          </div>

          {/* DOM order = desktop order = Tab order (BUG-005). On phones only the
              non-focusable preview and the palette move, via CSS order. */}
          <div className="max-md:order-4">
            <Palette onInsert={insert} />
          </div>

          <div className="max-md:order-3">
            <Editor
              ref={editor}
              initialValue={initial.code}
              onChange={setCode}
              onHistory={setHist}
              describedBy={status.error ? 'render-error' : undefined}
            />
          </div>

          {/* Phones: preview sticks under the header while you type below it. */}
          <div className="max-md:sticky max-md:top-14 max-md:z-10 max-md:order-2 max-md:-mx-4 max-md:bg-bg max-md:px-4 max-md:py-2">
            <Preview ref={preview} code={code} fontSize={shownSize} raster={raster} errorId="render-error" onStatus={onStatus} />
          </div>

          <div className="-mt-2 max-md:order-5">
            <PackagesLine code={code} onCopy={copySnippet} />
          </div>

          <div className="flex flex-wrap items-center gap-2 max-md:order-6" role="group" aria-label="Export">
            <Button
              variant="primary"
              icon={<Download aria-hidden className="size-4" />}
              disabled={!!exportBlocked || !!busy}
              title={exportBlocked ?? undefined}
              aria-busy={busy === 'png'}
              onClick={downloadPng}
            >
              {busy === 'png' ? 'Saving…' : 'Download PNG'}
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Scale</span>
              <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className="h-10 rounded-md border border-input bg-bg px-2 text-sm text-fg">
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={4}>4×</option>
              </select>
            </label>
            <Button icon={<Download aria-hidden className="size-4" />} disabled={!!exportBlocked} title={exportBlocked ?? undefined} onClick={downloadSvg}>
              SVG
            </Button>
            <Button
              icon={<FileText aria-hidden className="size-4" />}
              disabled={!!exportBlocked || !!busy}
              title={exportBlocked ?? undefined}
              aria-busy={busy === 'pdf'}
              onPointerEnter={() => void preloadPdf()}
              onFocus={() => void preloadPdf()}
              onClick={downloadPdf}
            >
              {busy === 'pdf' ? 'Making PDF…' : 'PDF'}
            </Button>
            <Button icon={<ImageIcon aria-hidden className="size-4" />} disabled={!!exportBlocked} title={exportBlocked ?? undefined} onClick={copyImage}>
              Copy image
            </Button>
            <Button
              icon={<FileType aria-hidden className="size-4" />}
              disabled={!!exportBlocked}
              title={exportBlocked ?? 'Paste into Word or PowerPoint as an editable equation'}
              onClick={copyForWord}
            >
              Copy for Word
            </Button>
            <Button icon={<ClipboardCopy aria-hidden className="size-4" />} disabled={status.empty} onClick={copyLatex}>
              Copy LaTeX
            </Button>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                role="switch"
                aria-checked={raster}
                checked={raster}
                onChange={(e) => setRaster(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-5 w-9 rounded-full border border-input bg-bg transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus after:absolute after:left-0.5 after:top-0.5 after:size-3.5 after:rounded-full after:bg-input after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-on-accent"
              />
              Preview as image
            </label>
          </div>
        </main>

        <aside aria-label="Saved equations">
          <SnippetsPanel
            code={code}
            fontSize={shownSize}
            canSave={!status.empty && !status.error && status.fresh}
            notify={say}
            onLoad={(s) => {
              editor.current?.replaceAll(s.code);
              if (s.settings?.font_size) setFontSize(s.settings.font_size);
              say('Opened. Undo brings your last equation back.');
            }}
          />
        </aside>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[var(--lx-layout-max)] gap-4 px-4 py-4 text-xs text-muted lg:px-6">
          <span>Rendered with MathJax</span>
          <a href={to('/about')} className="underline hover:text-fg">
            About
          </a>
          <a href={to('/privacy')} className="underline hover:text-fg">
            Privacy
          </a>
          <a href={to('/terms')} className="underline hover:text-fg">
            Terms
          </a>
        </div>
      </footer>

      <MatrixDialog
        open={panel === 'matrix'}
        onClose={close}
        onInsert={(kind, rows, cols) => {
          const { text, cursor } = matrixTemplate(kind, rows, cols);
          afterClose(() => editor.current?.insertAtCursor(text, cursor));
        }}
      />
      <ExamplesDialog
        open={panel === 'examples'}
        onClose={close}
        onPick={(ex, append) =>
          afterClose(() => {
            if (append && code.trim()) editor.current?.replaceAll(`${code} \\\\\n${ex}`);
            else editor.current?.replaceAll(ex);
            say(append ? 'Example added below.' : 'Example in place. Undo brings your equation back.');
          })
        }
      />
      <ReferenceDialog
        open={panel === 'reference'}
        onClose={close}
        onInsert={(snippet) =>
          afterClose(() => {
            editor.current?.insertTemplate(snippet);
            say('Inserted.');
          })
        }
      />
      <Dialog open={panel === 'signin'} onClose={close} title="Sign in" footer={<Button size="sm" onClick={close}>Close</Button>}>
        <p className="text-sm text-muted">
          Accounts are on the way. Until then, your work and everything you save stay in this browser.
        </p>
      </Dialog>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
