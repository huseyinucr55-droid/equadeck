// The document view (/doc): a white A4 sheet you type on directly, with a
// ribbon above and a status bar below, like a word processor.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type JSONContent } from '@tiptap/react';
import { Calculator, Check, Keyboard, Sparkles } from 'lucide-react';
import { APP_NAME } from '../brand';
import { Dialog, LangSwitch } from '../components/ui';
import { useLang, useT } from '../lib/i18n';
import { to } from '../lib/paths';
import { extensions } from './extensions';
import { isBlank, setMathLanguage } from './math';
import { template } from './templates';
import { setTextSuggestions, textSuggestionsOn } from './text-suggest';
import { autoMathOn, setAutoMath } from './auto-math';
import { layout, onPageCount, repaginate } from './pagination';
import { Ribbon } from './Ribbon';
import { StatusBar } from './StatusBar';
import { MARGIN_MM, backupFile, loadCurrentId, loadDocs, mergeDocs, newDoc, readBackup, saveCurrentId, saveDocs, type Doc } from './store';
import './doc.css';

const MM = 96 / 25.4; // CSS px per mm
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const PAGE_GAP = 24; // grey space between two pages, px

function startDocs(untitled: string): { docs: Doc[]; current: string } {
  let docs = loadDocs();
  if (!docs.length) docs = [newDoc(untitled)];
  const id = loadCurrentId();
  return { docs, current: docs.some((d) => d.id === id) ? id! : docs[0].id };
}

function useDarkMode() {
  const read = () => document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  const [dark, setDark] = useState(read);
  const toggle = () => {
    const next = !dark;
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try {
      localStorage.setItem('lx.theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setDark(next);
  };
  return { dark, toggle };
}

export default function DocApp() {
  const t = useT();
  const lang = useLang();
  const initial = useRef(startDocs(t('Untitled document'))).current;
  const [docs, setDocs] = useState<Doc[]>(initial.docs);
  const [currentId, setCurrentId] = useState(initial.current);
  const [zoom, setZoomState] = useState(100);
  const [saved, setSaved] = useState(true);
  const titleRef = useRef<HTMLInputElement>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const [textSuggest, setTextSuggest] = useState(textSuggestionsOn);
  const [helpOpen, setHelpOpen] = useState(false);
  const [autoMath, setAutoMathState] = useState(autoMathOn);
  // F1 opens the keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const { dark, toggle: toggleDark } = useDarkMode();

  const doc = docs.find((d) => d.id === currentId) ?? docs[0];
  const docRef = useRef(doc);
  docRef.current = doc;

  // Keep storage in step with the list (layout, titles, new and deleted documents).
  useEffect(() => {
    saveDocs(docs);
    saveCurrentId(currentId);
  }, [docs, currentId]);

  const patchDoc = useCallback((id: string, patch: Partial<Doc>) => {
    setDocs((list) => list.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)));
  }, []);

  const editor = useEditor({
    extensions: extensions('Start typing…'), // translated on display (follows the language switch)
    content: doc.content ?? '',
    editorProps: { attributes: { 'aria-label': t('Document text'), class: 'doc-content', spellcheck: 'true', lang } },
    onUpdate: ({ editor: e }) => {
      setSaved(false);
      window.clearTimeout(saveTimer.current);
      const id = docRef.current.id;
      saveTimer.current = window.setTimeout(() => {
        patchDoc(id, { content: withoutEmptyFormulas(e.getJSON()) });
        setSaved(true);
      }, 500);
    },
  });

  // Switching documents loads that document's text.
  const loaded = useRef(currentId);
  useEffect(() => {
    if (!editor || loaded.current === currentId) return;
    loaded.current = currentId;
    editor.commands.setContent(docRef.current.content ?? '', { emitUpdate: false });
    editor.commands.focus('start');
  }, [editor, currentId]);

  useEffect(() => setMathLanguage(lang), [lang]);

  // Typing in a formula: the status bar says so and how to get out.
  const [inFormula, setInFormula] = useState(false);
  useEffect(() => {
    const check = () => setInFormula(document.activeElement?.tagName === 'MATH-FIELD');
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', () => setTimeout(check, 0));
    return () => {
      document.removeEventListener('focusin', check);
    };
  }, []);

  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: { 'aria-label': t('Document text'), class: 'doc-content', spellcheck: 'true', lang } } });
  }, [editor, t, lang]);

  const flush = () => {
    window.clearTimeout(saveTimer.current);
    if (editor) patchDoc(docRef.current.id, { content: withoutEmptyFormulas(editor.getJSON()) });
    setSaved(true);
  };

  const setZoom = (z: number) => setZoomState(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z))));

  const widthMm = doc.orientation === 'portrait' ? 210 : 297;
  const heightMm = doc.orientation === 'portrait' ? 297 : 210;
  const marginMm = MARGIN_MM[doc.margins];

  const fitWidth = () => {
    const avail = (canvasRef.current?.clientWidth ?? 800) - 48;
    setZoom((avail / (widthMm * MM)) * 100);
  };

  // Fit the page to narrow screens (phones, iPad portrait) on first load.
  useEffect(() => {
    const avail = (canvasRef.current?.clientWidth ?? 1200) - 48;
    if (avail < widthMm * MM) setZoom((avail / (widthMm * MM)) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real pages: the pagination plugin (pagination.ts) pushes blocks that would
  // cross a page edge onto the next page and reports how many pages there are.
  const pageHeightPx = heightMm * MM;
  const marginPx = marginMm * MM;
  const stride = pageHeightPx + PAGE_GAP;
  const [pages, setPages] = useState(1);
  useEffect(() => onPageCount(setPages), []);
  useEffect(() => {
    layout.pageHeight = pageHeightPx;
    layout.margin = marginPx;
    layout.gap = PAGE_GAP;
    layout.zoom = zoom / 100;
    if (editor && !editor.isDestroyed) repaginate(editor.view);
  }, [editor, pageHeightPx, marginPx, zoom]);

  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { words: 0, caretTop: 0 };
      let caretTop = 0;
      try {
        caretTop = (e.view.coordsAtPos(e.state.selection.from).top - e.view.dom.getBoundingClientRect().top) / (zoom / 100);
      } catch {
        /* not laid out yet */
      }
      const text = e.state.doc.textBetween(0, e.state.doc.content.size, ' ', ' ');
      const words = text.split(/\s+/).filter(Boolean).length;
      return { words, caretTop };
    },
  });

  const page = Math.min(pages, Math.max(1, Math.floor((stats?.caretTop ?? 0) / stride) + 1));

  const onNew = () => {
    flush();
    const d = newDoc(t('Untitled document'));
    setDocs((list) => [...list, d]);
    setCurrentId(d.id);
  };
  const onOpen = (id: string) => {
    flush();
    setCurrentId(id);
  };
  const onDelete = (id: string) => {
    const d = docs.find((x) => x.id === id);
    if (!window.confirm(t('Delete "{name}"? This cannot be undone.', { name: d?.title || t('Untitled document') }))) return;
    const rest = docs.filter((x) => x.id !== id);
    const list = rest.length ? rest : [newDoc(t('Untitled document'))];
    setDocs(list);
    if (id === currentId) setCurrentId(list[0].id);
  };
  const onDuplicate = () => {
    flush();
    const copy = { ...newDoc(`${doc.title} (${t('copy')})`), content: editor?.getJSON() ?? null, paper: doc.paper, margins: doc.margins, orientation: doc.orientation };
    setDocs((list) => [...list, copy]);
    setCurrentId(copy.id);
  };
  const onDownloadHtml = () => {
    if (!editor) return;
    const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title></head><body>${editor.getHTML()}</body></html>`;
    download(new Blob([html], { type: 'text/html' }), `${fileName(doc.title)}.html`);
  };

  // A short message next to the title ("Saved for Word …").
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<number | undefined>(undefined);
  const say = (msg: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 6000);
  };

  const sheetStyle = useMemo(
    () => ({ width: `${widthMm}mm`, minHeight: pages * stride - PAGE_GAP, zoom: zoom / 100 }),
    [widthMm, pages, stride, zoom],
  );

  return (
    <div className="doc-app">
      <style>{`@page { size: A4 ${doc.orientation}; margin: ${marginMm}mm; }`}</style>
      <header className="doc-chrome doc-titlebar">
        <Sparkles aria-hidden className="size-5 shrink-0 text-accent" />
        <h1 className="m-0 text-base font-semibold max-sm:sr-only">{APP_NAME}</h1>
        <label className="sr-only" htmlFor="doc-title">{t('Document title')}</label>
        <input
          id="doc-title"
          ref={titleRef}
          className="doc-title-input"
          value={doc.title}
          onChange={(e) => patchDoc(doc.id, { title: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && editor?.commands.focus()}
        />
        <span className="flex items-center gap-1 text-xs text-muted" aria-live="polite">
          {notice || (saved ? <><Check aria-hidden className="size-3.5" /> {t('Saved in this browser')}</> : t('Saving…'))}
        </span>
        <nav aria-label={t('Main')} className="ml-auto flex items-center gap-2">
          <button type="button" className="doc-link" aria-label={t('Keyboard shortcuts (F1)')} title={t('Keyboard shortcuts (F1)')} onClick={() => setHelpOpen(true)}>
            <Keyboard aria-hidden className="size-4" />
          </button>
          <a href={to('/')} className="doc-link">
            <Calculator aria-hidden className="size-4" />
            <span className="max-sm:hidden">{t('Single formula')}</span>
          </a>
          <LangSwitch />
        </nav>
      </header>

      {editor && (
        <div className="doc-chrome">
          <Ribbon
            editor={editor}
            doc={doc}
            docs={docs}
            zoom={zoom}
            dark={dark}
            onNew={onNew}
            onOpen={onOpen}
            onDelete={onDelete}
            onRename={() => {
              titleRef.current?.focus();
              titleRef.current?.select();
            }}
            onDuplicate={onDuplicate}
            onPrint={() => {
              flush();
              window.print();
            }}
            onDownloadHtml={onDownloadHtml}
            onBackup={() => {
              flush();
              // The open document with its latest text, plus all the others.
              const all = docs.map((d) => (d.id === doc.id && editor ? { ...d, content: editor.getJSON() } : d));
              download(backupFile(all), `equadeck-backup-${new Date().toISOString().slice(0, 10)}.json`);
              say(t('Backup saved. Keep the file somewhere safe.'));
            }}
            onRestore={() => restoreInput.current?.click()}
            onTemplate={(kind) => {
              flush();
              const tpl = template(kind, lang);
              const d = { ...newDoc(tpl.title), content: tpl.content, paper: tpl.paper };
              setDocs((list) => [...list, d]);
              setCurrentId(d.id);
            }}
            onPdf={() => {
              flush();
              say(t('In the print window choose "Save as PDF".'));
              // Let the hint paint before the print window blocks the page.
              setTimeout(() => window.print(), 50);
            }}
            onDocx={async () => {
              if (!editor) return;
              flush();
              say(t('Making the Word file…'));
              try {
                const { toDocx } = await import('./docx-export');
                const blob = await toDocx(editor.getJSON(), doc);
                download(blob, `${fileName(doc.title)}.docx`);
                say(t('Saved for Word. Formulas stay editable there.'));
              } catch {
                say(t('Could not make the Word file.'));
              }
            }}
            onLayout={(patch) => patchDoc(doc.id, patch)}
            onZoom={setZoom}
            onFitWidth={fitWidth}
            onToggleDark={toggleDark}
            autoMath={autoMath}
            onToggleAutoMath={() => {
              setAutoMath(!autoMath);
              setAutoMathState(!autoMath);
            }}
            textSuggest={textSuggest}
            onToggleTextSuggest={() => {
              setTextSuggestions(!textSuggest);
              setTextSuggest(!textSuggest);
            }}
          />
        </div>
      )}

      <input
        ref={restoreInput}
        type="file"
        accept="application/json,.json"
        // Opened by the "Load backup" button; not a control of its own.
        hidden
        aria-label={t('Load backup')}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const incoming = readBackup(await file.text());
          if (!incoming) {
            say(t('This is not an Equadeck backup file.'));
            return;
          }
          flush();
          const { docs: merged, added, updated } = mergeDocs(loadDocs(), incoming);
          setDocs(merged);
          if (editor && merged.some((d) => d.id === currentId)) {
            editor.commands.setContent(merged.find((d) => d.id === currentId)?.content ?? '', { emitUpdate: false });
          }
          say(t('Backup loaded: {added} new, {updated} updated.', { added, updated }));
        }}
      />

      <main className="doc-canvas" ref={canvasRef} aria-label={t('Page')}>
        <div className="doc-sheet" data-paper={doc.paper} data-numbered={doc.numbered ? 'true' : undefined} ref={sheetRef} style={sheetStyle}>
          {/* The white pages behind the text, each with its paper pattern inside the margins. */}
          <div className="doc-pages" aria-hidden>
            {Array.from({ length: pages }, (_, i) => (
              <div key={i} className="doc-page" style={{ top: i * stride, height: pageHeightPx }}>
                <div className="doc-page-paper" style={{ inset: marginPx }} />
              </div>
            ))}
          </div>
          <div className="doc-flow" style={{ padding: `${marginPx}px ${marginPx}px 0`, minHeight: pageHeightPx - marginPx }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      <div className="doc-chrome">
        <StatusBar inFormula={inFormula} page={page} pages={pages} words={stats?.words ?? 0} zoom={zoom} onZoom={setZoom} min={ZOOM_MIN} max={ZOOM_MAX} />
      </div>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title={t('Keyboard shortcuts')}>
        <dl className="doc-help">
          {HELP.map(([keys, what]) => (
            <div key={keys} className="doc-help-row">
              <dt><kbd>{t(keys)}</kbd></dt>
              <dd>{t(what)}</dd>
            </div>
          ))}
        </dl>
      </Dialog>
    </div>
  );
}

/** The keys worth knowing, shown by the "?" button and F1. */
const HELP: [string, string][] = [
  ['Type a word', 'opens the list of symbols (summe, äquivalent, bruch …)'],
  ['Enter / Tab', 'takes the chosen symbol'],
  ['↑ ↓', 'picks another suggestion'],
  ['x^2, a_n, 1/2', 'typed in the text become a formula by themselves'],
  ['Alt+= or Ctrl+M', 'starts an empty formula'],
  ['/  ^  _', 'in a formula: fraction, power, index'],
  ['Tab', 'in a formula: next box'],
  ['Esc', 'closes the list, or leaves the formula'],
  ['Backspace', 'removes a formula next to the cursor at once'],
  ['Ctrl+B / I / U', 'bold, italic, underline'],
  ['Ctrl+Z / Ctrl+Y', 'undo, redo'],
  ['Ctrl+P', 'print or save as PDF'],
];

/** An empty formula you never filled in isn't saved (it would come back after a reload). */
function withoutEmptyFormulas(node: JSONContent): JSONContent {
  if (!node.content) return node;
  return {
    ...node,
    content: node.content
      .filter((n) => !((n.type === 'mathInline' || n.type === 'mathBlock') && isBlank(String(n.attrs?.latex ?? ''))))
      .map(withoutEmptyFormulas),
  };
}

const fileName = (title: string) => (title || 'document').replace(/[\\/:*?"<>|]+/g, '_');

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(a.href);
  }, 60_000);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
