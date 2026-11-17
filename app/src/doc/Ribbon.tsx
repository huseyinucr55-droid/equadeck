// The ribbon: tabs File / Home / Insert / Layout / View, each one row of
// grouped controls. Buttons keep the editor's selection (mousedown is
// prevented) and show their state with aria-pressed.
import { useState, type ReactNode } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Baseline, Bold, Copy, Eraser, FileCode, FileDown, FilePlus, FileText,
  FolderOpen, Grid3x3, Highlighter, Italic, List, ListOrdered, Maximize2, Minus, Moon, Pencil, Printer, RectangleHorizontal,
  RectangleVertical, Redo2, Rows3, SeparatorHorizontal, Sigma, Square, Strikethrough, Sun, Trash2,
  Underline, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useT } from '../lib/i18n';
import type { Doc, Margins, Orientation, Paper } from './store';

export const TEXT_COLOURS = ['#000000', '#c92a2a', '#1864ab', '#2b8a3e', '#e8590c', '#7048e8', '#868e96', '#0b7285'];
export const HIGHLIGHTS = ['#fff3bf', '#d3f9d8', '#d0ebff', '#ffdeeb', '#e9ecef'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const FONTS: [string, string][] = [
  ['Serif', 'Georgia, "Times New Roman", serif'],
  ['Sans', 'Arial, Helvetica, sans-serif'],
  ['Mono', '"Courier New", monospace'],
];

type Tab = 'file' | 'home' | 'insert' | 'layout' | 'view';

export type RibbonProps = {
  editor: Editor;
  doc: Doc;
  docs: Doc[];
  zoom: number;
  dark: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: () => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onDownloadHtml: () => void;
  onLayout: (patch: Partial<Pick<Doc, 'paper' | 'margins' | 'orientation'>>) => void;
  onZoom: (zoom: number) => void;
  onFitWidth: () => void;
  onToggleDark: () => void;
};

const keep = (e: React.MouseEvent) => e.preventDefault();

function Btn({ label, icon, onClick, pressed, disabled, title, wide }: {
  label: string; icon: ReactNode; onClick?: () => void; pressed?: boolean; disabled?: boolean; title?: string; wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={`ribbon-btn ${wide ? 'ribbon-btn-wide' : ''}`}
      aria-label={wide ? undefined : label}
      aria-pressed={pressed}
      title={title ?? label}
      disabled={disabled}
      onMouseDown={keep}
      onClick={onClick}
    >
      {icon}
      {wide && <span>{label}</span>}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="ribbon-group">
      <div className="ribbon-group-row">{children}</div>
      <div className="ribbon-group-label" aria-hidden>{label}</div>
    </div>
  );
}

function Swatches({ label, colours, onPick, onClear, clearLabel }: {
  label: string; colours: string[]; onPick: (c: string) => void; onClear: () => void; clearLabel: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {colours.map((c) => (
        <button key={c} type="button" className="ribbon-swatch" style={{ background: c }} aria-label={`${label} ${c}`} title={c} onMouseDown={keep} onClick={() => onPick(c)} />
      ))}
      <button type="button" className="ribbon-swatch ribbon-swatch-none" aria-label={clearLabel} title={clearLabel} onMouseDown={keep} onClick={onClear} />
    </div>
  );
}

export function Ribbon(p: RibbonProps) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('home');
  const [openList, setOpenList] = useState(false);
  const { editor } = p;
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      heading: ([1, 2, 3] as const).find((l) => e.isActive('heading', { level: l })) ?? 0,
      align: (['left', 'center', 'right', 'justify'] as const).find((a) => e.isActive({ textAlign: a })) ?? 'left',
      size: (e.getAttributes('textStyle').fontSize as string | undefined)?.replace('px', '') ?? '',
      font: (e.getAttributes('textStyle').fontFamily as string | undefined) ?? '',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  const tabs: [Tab, string][] = [
    ['file', t('File')],
    ['home', t('Home')],
    ['insert', t('Insert')],
    ['layout', t('Layout')],
    ['view', t('View')],
  ];

  return (
    <section className="ribbon" aria-label={t('Ribbon')}>
      <div role="tablist" aria-label={t('Ribbon')} className="ribbon-tabs">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className="ribbon-tab"
            onClick={() => setTab(id)}
            onKeyDown={(e) => {
              const i = tabs.findIndex(([k]) => k === id);
              const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1;
              if (next >= 0) {
                setTab(tabs[next][0]);
                document.getElementById(`tab-${tabs[next][0]}`)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="ribbon-panel">
        {tab === 'file' && (
          <>
            <Group label={t('Document')}>
              <Btn wide label={t('New')} icon={<FilePlus aria-hidden className="size-4" />} onClick={p.onNew} />
              <Btn wide label={t('Open')} icon={<FolderOpen aria-hidden className="size-4" />} pressed={openList} onClick={() => setOpenList((o) => !o)} />
              <Btn wide label={t('Rename')} icon={<Pencil aria-hidden className="size-4" />} onClick={p.onRename} />
              <Btn wide label={t('Duplicate')} icon={<Copy aria-hidden className="size-4" />} onClick={p.onDuplicate} />
            </Group>
            <Group label={t('Share')}>
              <Btn wide label={t('Print')} icon={<Printer aria-hidden className="size-4" />} onClick={p.onPrint} />
              <Btn wide label={t('Download HTML')} icon={<FileCode aria-hidden className="size-4" />} onClick={p.onDownloadHtml} />
              <Btn wide label="PDF" icon={<FileDown aria-hidden className="size-4" />} disabled title={t('Coming soon')} />
              <Btn wide label="Word" icon={<FileText aria-hidden className="size-4" />} disabled title={t('Coming soon')} />
            </Group>
          </>
        )}

        {tab === 'home' && (
          <>
            <Group label={t('Undo')}>
              <Btn label={t('Undo (Ctrl+Z)')} icon={<Undo2 aria-hidden className="size-4" />} disabled={!s.canUndo} onClick={() => c().undo().run()} />
              <Btn label={t('Redo (Ctrl+Y)')} icon={<Redo2 aria-hidden className="size-4" />} disabled={!s.canRedo} onClick={() => c().redo().run()} />
            </Group>
            <Group label={t('Font')}>
              <select
                aria-label={t('Font')}
                className="ribbon-select"
                value={s.font}
                onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}
              >
                <option value="">{t('Default')}</option>
                {FONTS.map(([name, css]) => (
                  <option key={name} value={css}>{name}</option>
                ))}
              </select>
              <select
                aria-label={t('Font size')}
                className="ribbon-select w-16"
                value={s.size}
                onChange={(e) => (e.target.value ? c().setFontSize(`${e.target.value}px`).run() : c().unsetFontSize().run())}
              >
                <option value="">–</option>
                {SIZES.map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
              <Btn label={t('Bold (Ctrl+B)')} icon={<Bold aria-hidden className="size-4" />} pressed={s.bold} onClick={() => c().toggleBold().run()} />
              <Btn label={t('Italic (Ctrl+I)')} icon={<Italic aria-hidden className="size-4" />} pressed={s.italic} onClick={() => c().toggleItalic().run()} />
              <Btn label={t('Underline (Ctrl+U)')} icon={<Underline aria-hidden className="size-4" />} pressed={s.underline} onClick={() => c().toggleUnderline().run()} />
              <Btn label={t('Strikethrough')} icon={<Strikethrough aria-hidden className="size-4" />} pressed={s.strike} onClick={() => c().toggleStrike().run()} />
              <Btn label={t('Clear formatting')} icon={<Eraser aria-hidden className="size-4" />} onClick={() => c().unsetAllMarks().clearNodes().run()} />
            </Group>
            <Group label={t('Colour')}>
              <Baseline aria-hidden className="size-4 text-muted" />
              <Swatches label={t('Text colour')} colours={TEXT_COLOURS} onPick={(col) => c().setColor(col).run()} onClear={() => c().unsetColor().run()} clearLabel={t('Automatic colour')} />
              <Highlighter aria-hidden className="ml-2 size-4 text-muted" />
              <Swatches label={t('Highlight')} colours={HIGHLIGHTS} onPick={(col) => c().setHighlight({ color: col }).run()} onClear={() => c().unsetHighlight().run()} clearLabel={t('No highlight')} />
            </Group>
            <Group label={t('Paragraph')}>
              <select
                aria-label={t('Style')}
                className="ribbon-select"
                value={String(s.heading)}
                onChange={(e) => {
                  const l = Number(e.target.value) as 0 | 1 | 2 | 3;
                  if (l) c().setHeading({ level: l }).run();
                  else c().setParagraph().run();
                }}
              >
                <option value="0">{t('Normal')}</option>
                <option value="1">{t('Heading 1')}</option>
                <option value="2">{t('Heading 2')}</option>
                <option value="3">{t('Heading 3')}</option>
              </select>
              <Btn label={t('Bullet list')} icon={<List aria-hidden className="size-4" />} pressed={s.bullet} onClick={() => c().toggleBulletList().run()} />
              <Btn label={t('Numbered list')} icon={<ListOrdered aria-hidden className="size-4" />} pressed={s.ordered} onClick={() => c().toggleOrderedList().run()} />
              <Btn label={t('Align left')} icon={<AlignLeft aria-hidden className="size-4" />} pressed={s.align === 'left'} onClick={() => c().setTextAlign('left').run()} />
              <Btn label={t('Centre')} icon={<AlignCenter aria-hidden className="size-4" />} pressed={s.align === 'center'} onClick={() => c().setTextAlign('center').run()} />
              <Btn label={t('Align right')} icon={<AlignRight aria-hidden className="size-4" />} pressed={s.align === 'right'} onClick={() => c().setTextAlign('right').run()} />
              <Btn label={t('Justify')} icon={<AlignJustify aria-hidden className="size-4" />} pressed={s.align === 'justify'} onClick={() => c().setTextAlign('justify').run()} />
            </Group>
          </>
        )}

        {tab === 'insert' && (
          <Group label={t('Insert')}>
            <Btn wide label={t('Page break')} icon={<SeparatorHorizontal aria-hidden className="size-4" />} onClick={() => c().setPageBreak().run()} />
            <Btn wide label={t('Horizontal line')} icon={<Minus aria-hidden className="size-4" />} onClick={() => c().setHorizontalRule().run()} />
            <Btn wide label={t('Formula')} icon={<Sigma aria-hidden className="size-4" />} disabled title={t('Coming in the next update')} />
          </Group>
        )}

        {tab === 'layout' && (
          <>
            <Group label={t('Paper')}>
              {([
                ['blank', t('Blank'), <Square key="b" aria-hidden className="size-4" />],
                ['squared', t('Squared'), <Grid3x3 key="s" aria-hidden className="size-4" />],
                ['lined', t('Lined'), <Rows3 key="l" aria-hidden className="size-4" />],
              ] as [Paper, string, ReactNode][]).map(([id, label, icon]) => (
                <Btn key={id} wide label={label} icon={icon} pressed={p.doc.paper === id} onClick={() => p.onLayout({ paper: id })} />
              ))}
            </Group>
            <Group label={t('Margins')}>
              {([
                ['normal', t('Normal')],
                ['narrow', t('Narrow')],
                ['wide', t('Wide')],
              ] as [Margins, string][]).map(([id, label]) => (
                <Btn key={id} wide label={label} icon={<span aria-hidden className="ribbon-margin-icon" data-m={id} />} pressed={p.doc.margins === id} onClick={() => p.onLayout({ margins: id })} />
              ))}
            </Group>
            <Group label={t('Orientation')}>
              {([
                ['portrait', t('Portrait'), <RectangleVertical key="p" aria-hidden className="size-4" />],
                ['landscape', t('Landscape'), <RectangleHorizontal key="l" aria-hidden className="size-4" />],
              ] as [Orientation, string, ReactNode][]).map(([id, label, icon]) => (
                <Btn key={id} wide label={label} icon={icon} pressed={p.doc.orientation === id} onClick={() => p.onLayout({ orientation: id })} />
              ))}
            </Group>
          </>
        )}

        {tab === 'view' && (
          <>
            <Group label={t('Zoom')}>
              <Btn label={t('Zoom out')} icon={<ZoomOut aria-hidden className="size-4" />} onClick={() => p.onZoom(p.zoom - 10)} />
              <span className="ribbon-readout" aria-live="polite">{p.zoom}%</span>
              <Btn label={t('Zoom in')} icon={<ZoomIn aria-hidden className="size-4" />} onClick={() => p.onZoom(p.zoom + 10)} />
              <Btn wide label="100 %" icon={<Square aria-hidden className="size-4" />} onClick={() => p.onZoom(100)} />
              <Btn wide label={t('Page width')} icon={<Maximize2 aria-hidden className="size-4" />} onClick={p.onFitWidth} />
            </Group>
            <Group label={t('Appearance')}>
              <Btn
                wide
                label={t('Dark mode')}
                icon={p.dark ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
                pressed={p.dark}
                onClick={p.onToggleDark}
              />
            </Group>
          </>
        )}
      </div>

      {openList && tab === 'file' && (
        <div className="ribbon-doclist" role="region" aria-label={t('Your documents')}>
          <ul className="m-0 list-none p-0">
            {[...p.docs].sort((a, b) => b.updatedAt - a.updatedAt).map((d) => (
              <li key={d.id} className="flex items-center gap-2 border-b border-border py-1 last:border-0">
                <button
                  type="button"
                  className="ribbon-doclink"
                  aria-current={d.id === p.doc.id ? 'true' : undefined}
                  onClick={() => {
                    p.onOpen(d.id);
                    setOpenList(false);
                  }}
                >
                  <span className="truncate font-medium">{d.title || t('Untitled document')}</span>
                  <span className="text-xs text-muted">{new Date(d.updatedAt).toLocaleString()}</span>
                </button>
                <button
                  type="button"
                  className="ribbon-btn"
                  aria-label={t('Delete {name}', { name: d.title || t('Untitled document') })}
                  title={t('Delete')}
                  onClick={() => p.onDelete(d.id)}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
