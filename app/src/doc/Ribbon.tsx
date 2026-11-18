// The ribbon: tabs File / Home / Insert / Layout / View, each one row of
// grouped controls. Buttons keep the editor's selection (mousedown is
// prevented) and show their state with aria-pressed.
import { useRef, useState, type ReactNode } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useEditorState, type Editor } from '@tiptap/react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Archive, ArchiveRestore, Baseline, BetweenHorizontalEnd, BetweenVerticalEnd, ChevronDown, ChevronUp, Columns2, LayoutTemplate, Rows2, Superscript, Table, Bold, Copy, Eraser, FileCode, FileDown, FilePlus, FileText,
  FolderOpen, Grid3x3, Highlighter, Italic, List, ListOrdered, Maximize2, Minus, Moon, Pencil, Printer, RectangleHorizontal,
  RectangleVertical, Redo2, Rows3, SeparatorHorizontal, Sigma, Square, Strikethrough, Sun, Trash2,
  Underline, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useT } from '../lib/i18n';
import type { Doc, Margins, Orientation, Paper } from './store';
import { TEMPLATES, activeMathField, matrixLatex } from './math';
import type { TemplateKind } from './templates';

export const TEXT_COLOURS = ['#000000', '#c92a2a', '#1864ab', '#2b8a3e', '#e8590c', '#7048e8', '#868e96', '#0b7285'];
export const HIGHLIGHTS = ['#fff3bf', '#d3f9d8', '#d0ebff', '#ffdeeb', '#e9ecef'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const FONTS: [string, string][] = [
  ['Serif', 'Georgia, "Times New Roman", serif'],
  ['Sans', 'Arial, Helvetica, sans-serif'],
  ['Mono', '"Courier New", monospace'],
];

type Tab = 'file' | 'home' | 'insert' | 'layout' | 'view';

const STRUCTURES: [keyof typeof TEMPLATES, string, string][] = [
  ['fraction', 'Fraction', '½'],
  ['root', 'Root', '√'],
  ['power', 'Power', 'xⁿ'],
  ['index', 'Index', 'xₙ'],
  ['integral', 'Integral', '∫'],
  ['sum', 'Sum', 'Σ'],
  ['limit', 'Limit', 'lim'],
  ['cases', 'Cases', '{'],
];

/** Brackets that grow with what is inside; { } is awkward on a German keyboard. */
const BRACKET_BUTTONS: [string, string, string][] = [
  ['\\left(#?\\right)', '( )', 'parentheses'],
  ['\\left[#?\\right]', '[ ]', 'square brackets'],
  ['\\left\\{#?\\right\\}', '{ }', 'curly braces'],
  ['\\left|#?\\right|', '| |', 'absolute value'],
  ['\\left\\lVert#?\\right\\rVert', '‖ ‖', 'norm'],
  ['\\left\\langle#?\\right\\rangle', '⟨ ⟩', 'angle brackets'],
];

const SYMBOLS: [string, string, string][] = [
  ['\\infty', '∞', 'infinity'],
  ['\\pi', 'π', 'pi'],
  ['\\pm', '±', 'plus minus'],
  ['\\cdot', '·', 'dot'],
  ['\\leq', '≤', 'less or equal'],
  ['\\geq', '≥', 'greater or equal'],
  ['\\neq', '≠', 'not equal'],
  ['\\approx', '≈', 'approximately equal'],
  ['\\in', '∈', 'element of'],
  ['\\notin', '∉', 'not an element of'],
  ['\\subseteq', '⊆', 'subset or equal'],
  ['\\cup', '∪', 'union'],
  ['\\cap', '∩', 'intersection'],
  ['\\emptyset', '∅', 'empty set'],
  ['\\forall', '∀', 'for all'],
  ['\\exists', '∃', 'there exists'],
  ['\\Rightarrow', '⇒', 'implies'],
  ['\\Leftrightarrow', '⇔', 'if and only if'],
  ['\\mathbb{R}', 'ℝ', 'real numbers'],
  ['\\mathbb{N}', 'ℕ', 'natural numbers'],
  ['\\alpha', 'α', 'alpha'],
  ['\\beta', 'β', 'beta'],
  ['\\Delta', 'Δ', 'Delta'],
  ['\\lambda', 'λ', 'lambda'],
];

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
  onPdf: () => void;
  onBackup: () => void;
  onTemplate: (kind: TemplateKind) => void;
  onRestore: () => void;
  onDocx: () => void;
  onLayout: (patch: Partial<Pick<Doc, 'paper' | 'margins' | 'orientation' | 'numbered'>>) => void;
  onZoom: (zoom: number) => void;
  onFitWidth: () => void;
  onToggleDark: () => void;
  textSuggest: boolean;
  onToggleTextSuggest: () => void;
  autoMath: boolean;
  onToggleAutoMath: () => void;
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

type MatrixKind = 'pmatrix' | 'bmatrix' | 'vmatrix';

/** Pick a matrix size on a grid, like a table in a word processor, and its brackets. */
function MatrixPicker({ onPick }: { onPick: (rows: number, cols: number, kind: MatrixKind) => void }) {
  const t = useT();
  const [hover, setHover] = useState<[number, number]>([2, 2]);
  const [kind, setKind] = useState<MatrixKind>('pmatrix');
  const N = 6;
  return (
    <div className="ribbon-matrix" role="dialog" aria-label={t('Matrix size')}>
      <div className="mb-2 flex gap-1" role="group" aria-label={t('Brackets')}>
        {([
          ['pmatrix', '( )'],
          ['bmatrix', '[ ]'],
          ['vmatrix', '| |'],
        ] as [MatrixKind, string][]).map(([k, label]) => (
          <button key={k} type="button" className="ribbon-btn ribbon-symbol" aria-pressed={kind === k} onMouseDown={keep} onClick={() => setKind(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="ribbon-matrix-grid" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {Array.from({ length: N * N }, (_, i) => {
          const r = Math.floor(i / N) + 1;
          const c = (i % N) + 1;
          const on = r <= hover[0] && c <= hover[1];
          return (
            <button
              key={i}
              type="button"
              className={`ribbon-matrix-cell ${on ? 'is-on' : ''}`}
              aria-label={`${r} × ${c}`}
              onMouseDown={keep}
              onMouseEnter={() => setHover([r, c])}
              onFocus={() => setHover([r, c])}
              onClick={() => onPick(r, c, kind)}
            />
          );
        })}
      </div>
      <div className="mt-1 text-center text-xs text-muted" aria-live="polite">
        {t('{rows} rows × {cols} columns', { rows: hover[0], cols: hover[1] })}
      </div>
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
      inTable: e.isActive('table'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();
  // The formula that had focus when a ribbon button was pressed (pressing it
  // can move focus away before the click arrives).
  const fieldAtPress = useRef<MathfieldElement | null>(null);
  const [matrixOpen, setMatrixOpen] = useState(false);
  // Hide the ribbon for more room on the page (remembered in this browser).
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('lx.doc.ribbon') === 'collapsed';
    } catch {
      return false;
    }
  });
  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem('lx.doc.ribbon', next ? 'collapsed' : 'open');
    } catch {
      /* ignore */
    }
  };
  /** Rows and columns of the matrix or cases you are typing in. */
  const cell = (command: 'addRowAfter' | 'addColumnAfter' | 'removeRow' | 'removeColumn') => {
    const mf = fieldAtPress.current?.isConnected ? fieldAtPress.current : activeMathField();
    fieldAtPress.current = null;
    if (!mf) return;
    mf.focus();
    mf.executeCommand(command);
  };
  /** Into the formula you are typing in, or as a new formula at the cursor. */
  const math = (latex: string, block = false) => {
    const mf = fieldAtPress.current?.isConnected ? fieldAtPress.current : activeMathField();
    fieldAtPress.current = null;
    if (mf && latex) {
      mf.focus();
      // Always as maths: after a word the formula may still be in text mode,
      // which would put the LaTeX in as plain text.
      mf.insert(latex, { mode: 'math', format: 'latex', selectionMode: 'placeholder', focus: true });
      return;
    }
    editor.chain().focus().insertMath(latex, block).run();
  };

  const tabs: [Tab, string][] = [
    ['file', t('File')],
    ['home', t('Home')],
    ['insert', t('Insert')],
    ['layout', t('Layout')],
    ['view', t('View')],
  ];

  return (
    <section className="ribbon" aria-label={t('Ribbon')} onPointerDownCapture={() => (fieldAtPress.current = activeMathField())}>
      <div className="ribbon-tabs-row">
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
            // Switching tabs keeps the cursor where you were typing (text or formula).
            onMouseDown={keep}
            onClick={() => {
              setTab(id);
              if (collapsed) toggleCollapsed(false); // a tab brings the ribbon back
            }}
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
        {/* Outside the tablist: a tablist may only hold tabs. */}
        <button
          type="button"
          className="ribbon-collapse"
          aria-expanded={!collapsed}
          aria-controls={`panel-${tab}`}
          title={collapsed ? t('Show the ribbon') : t('Hide the ribbon (more room for the page)')}
          aria-label={collapsed ? t('Show the ribbon') : t('Hide the ribbon (more room for the page)')}
          onMouseDown={keep}
          onClick={() => toggleCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown aria-hidden className="size-4" /> : <ChevronUp aria-hidden className="size-4" />}
        </button>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="ribbon-panel" hidden={collapsed}>
        {tab === 'file' && (
          <>
            <Group label={t('Document')}>
              <Btn wide label={t('New')} icon={<FilePlus aria-hidden className="size-4" />} onClick={p.onNew} />
              <Btn wide label={t('Open')} icon={<FolderOpen aria-hidden className="size-4" />} pressed={openList} onClick={() => setOpenList((o) => !o)} />
              <Btn wide label={t('Rename')} icon={<Pencil aria-hidden className="size-4" />} onClick={p.onRename} />
              <Btn wide label={t('Duplicate')} icon={<Copy aria-hidden className="size-4" />} onClick={p.onDuplicate} />
            </Group>
            <Group label={t('Templates')}>
              <Btn wide label={t('Worksheet')} icon={<LayoutTemplate aria-hidden className="size-4" />} onClick={() => p.onTemplate('worksheet')} />
              <Btn wide label={t('Notes')} icon={<LayoutTemplate aria-hidden className="size-4" />} onClick={() => p.onTemplate('notes')} />
              <Btn wide label={t('Homework')} icon={<LayoutTemplate aria-hidden className="size-4" />} onClick={() => p.onTemplate('homework')} />
            </Group>
            <Group label={t('Backup')}>
              <Btn wide label={t('Save backup')} icon={<Archive aria-hidden className="size-4" />} title={t('All documents in one file, to keep safe or move to another device')} onClick={p.onBackup} />
              <Btn wide label={t('Load backup')} icon={<ArchiveRestore aria-hidden className="size-4" />} onClick={p.onRestore} />
            </Group>
            <Group label={t('Share')}>
              <Btn wide label={t('Print')} icon={<Printer aria-hidden className="size-4" />} onClick={p.onPrint} />
              <Btn wide label={t('Download HTML')} icon={<FileCode aria-hidden className="size-4" />} onClick={p.onDownloadHtml} />
              <Btn wide label={t('Save as PDF')} icon={<FileDown aria-hidden className="size-4" />} onClick={p.onPdf} />
              <Btn wide label={t('Download for Word')} icon={<FileText aria-hidden className="size-4" />} onClick={p.onDocx} />
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
          <>
            <Group label={t('Structures')}>
              {STRUCTURES.map(([key, label, preview]) => (
                <Btn key={key} wide label={t(label)} icon={<span aria-hidden className="ribbon-math-preview">{preview}</span>} onClick={() => math(TEMPLATES[key])} />
              ))}
            </Group>
            <Group label={t('Matrix')}>
              <div className="relative">
                <Btn wide label={t('Matrix')} icon={<Grid3x3 aria-hidden className="size-4" />} pressed={matrixOpen} onClick={() => setMatrixOpen((o) => !o)} />
                {matrixOpen && (
                  <MatrixPicker
                    onPick={(rows, cols, kind) => {
                      setMatrixOpen(false);
                      math(matrixLatex(rows, cols, kind));
                    }}
                  />
                )}
              </div>
              <Btn label={t('Row below')} icon={<BetweenHorizontalEnd aria-hidden className="size-4" />} title={t('Row below (matrix, cases)')} onClick={() => cell('addRowAfter')} />
              <Btn label={t('Column to the right')} icon={<BetweenVerticalEnd aria-hidden className="size-4" />} onClick={() => cell('addColumnAfter')} />
              <Btn label={t('Delete row')} icon={<Rows2 aria-hidden className="size-4" />} onClick={() => cell('removeRow')} />
              <Btn label={t('Delete column')} icon={<Columns2 aria-hidden className="size-4" />} onClick={() => cell('removeColumn')} />
            </Group>
            <Group label={t('Brackets')}>
              {BRACKET_BUTTONS.map(([latex, glyph, name]) => (
                <button key={latex} type="button" className="ribbon-btn ribbon-symbol" aria-label={t(name)} title={t(name)} onMouseDown={keep} onClick={() => math(latex)}>
                  {glyph}
                </button>
              ))}
            </Group>
            <Group label={t('Symbols')}>
              {SYMBOLS.map(([latex, glyph, name]) => (
                <button key={latex} type="button" className="ribbon-btn ribbon-symbol" aria-label={t(name)} title={t(name)} onMouseDown={keep} onClick={() => math(latex)}>
                  {glyph}
                </button>
              ))}
            </Group>
            <Group label={t('Table')}>
              <Btn wide label={t('Table')} icon={<Table aria-hidden className="size-4" />} title={t('Table with 3 rows and 3 columns')} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
              <Btn label={t('Row below')} icon={<BetweenHorizontalEnd aria-hidden className="size-4" />} disabled={!s.inTable} onClick={() => c().addRowAfter().run()} />
              <Btn label={t('Column to the right')} icon={<BetweenVerticalEnd aria-hidden className="size-4" />} disabled={!s.inTable} onClick={() => c().addColumnAfter().run()} />
              <Btn label={t('Delete row')} icon={<Rows2 aria-hidden className="size-4" />} disabled={!s.inTable} onClick={() => c().deleteRow().run()} />
              <Btn label={t('Delete column')} icon={<Columns2 aria-hidden className="size-4" />} disabled={!s.inTable} onClick={() => c().deleteColumn().run()} />
              <Btn label={t('Delete table')} icon={<Trash2 aria-hidden className="size-4" />} disabled={!s.inTable} onClick={() => c().deleteTable().run()} />
            </Group>
            <Group label={t('Page')}>
              <Btn wide label={t('Page break')} icon={<SeparatorHorizontal aria-hidden className="size-4" />} onClick={() => c().setPageBreak().run()} />
              <Btn wide label={t('Horizontal line')} icon={<Minus aria-hidden className="size-4" />} onClick={() => c().setHorizontalRule().run()} />
            </Group>
          </>
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
            <Group label={t('Formula')}>
              <Btn
                wide
                label={t('Number formulas')}
                icon={<ListOrdered aria-hidden className="size-4" />}
                title={t('Formulas on their own line get (1), (2) …')}
                pressed={!!p.doc.numbered}
                onClick={() => p.onLayout({ numbered: !p.doc.numbered })}
              />
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
            <Group label={t('Typing')}>
              <Btn
                wide
                label={t('Suggestions in the text')}
                icon={<Sigma aria-hidden className="size-4" />}
                title={t('Typing a word like "summe" or "äquivalent" offers the symbol')}
                pressed={p.textSuggest}
                onClick={p.onToggleTextSuggest}
              />
              <Btn
                wide
                label={t('Recognise maths')}
                icon={<Superscript aria-hidden className="size-4" />}
                title={t('x^2, a_n, 1/2 and => typed in the text become formulas')}
                pressed={p.autoMath}
                onClick={p.onToggleAutoMath}
              />
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
