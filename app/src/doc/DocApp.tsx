// The document view (/doc): a white A4 sheet you type on directly, with a
// ribbon above and a status bar below, like a word processor.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Calculator, Check, Sparkles } from 'lucide-react';
import { APP_NAME } from '../brand';
import { LangSwitch } from '../components/ui';
import { useLang, useT } from '../lib/i18n';
import { to } from '../lib/paths';
import { extensions } from './extensions';
import { setMathLanguage } from './math';
import { Ribbon } from './Ribbon';
import { StatusBar } from './StatusBar';
import { MARGIN_MM, loadCurrentId, loadDocs, newDoc, saveCurrentId, saveDocs, type Doc } from './store';
import './doc.css';

const MM = 96 / 25.4; // CSS px per mm
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;

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
    extensions: extensions(t('Start typing…')),
    content: doc.content ?? '',
    editorProps: { attributes: { 'aria-label': t('Document text'), class: 'doc-content', spellcheck: 'true', lang } },
    onUpdate: ({ editor: e }) => {
      setSaved(false);
      window.clearTimeout(saveTimer.current);
      const id = docRef.current.id;
      saveTimer.current = window.setTimeout(() => {
        patchDoc(id, { content: e.getJSON() });
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

  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: { 'aria-label': t('Document text'), class: 'doc-content', spellcheck: 'true', lang } } });
  }, [editor, t, lang]);

  const flush = () => {
    window.clearTimeout(saveTimer.current);
    if (editor) patchDoc(docRef.current.id, { content: editor.getJSON() });
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

  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { words: 0, height: 0, caretTop: 0 };
      const sheet = sheetRef.current;
      let caretTop = 0;
      try {
        if (sheet) caretTop = (e.view.coordsAtPos(e.state.selection.from).top - sheet.getBoundingClientRect().top) / (zoom / 100);
      } catch {
        /* not laid out yet */
      }
      const text = e.state.doc.textBetween(0, e.state.doc.content.size, ' ', ' ');
      const words = text.split(/\s+/).filter(Boolean).length;
      return { words, height: sheet?.scrollHeight ?? 0, caretTop };
    },
  });

  const pageHeightPx = heightMm * MM;
  const pages = Math.max(1, Math.ceil((stats?.height ?? 0) / pageHeightPx - 0.02));
  const page = Math.min(pages, Math.max(1, Math.floor((stats?.caretTop ?? 0) / pageHeightPx) + 1));

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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = `${(doc.title || 'document').replace(/[\\/:*?"<>|]+/g, '_')}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  };

  const sheetStyle = useMemo(
    () => ({
      width: `${widthMm}mm`,
      minHeight: `${heightMm}mm`,
      padding: `${marginMm}mm`,
      zoom: zoom / 100,
    }),
    [widthMm, heightMm, marginMm, zoom],
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
          {saved ? <><Check aria-hidden className="size-3.5" /> {t('Saved in this browser')}</> : t('Saving…')}
        </span>
        <nav aria-label={t('Main')} className="ml-auto flex items-center gap-2">
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
            onLayout={(patch) => patchDoc(doc.id, patch)}
            onZoom={setZoom}
            onFitWidth={fitWidth}
            onToggleDark={toggleDark}
          />
        </div>
      )}

      <main className="doc-canvas" ref={canvasRef} aria-label={t('Page')}>
        <div className="doc-sheet" data-paper={doc.paper} ref={sheetRef} style={sheetStyle}>
          <EditorContent editor={editor} />
        </div>
      </main>

      <div className="doc-chrome">
        <StatusBar page={page} pages={pages} words={stats?.words ?? 0} zoom={zoom} onZoom={setZoom} min={ZOOM_MIN} max={ZOOM_MAX} />
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
