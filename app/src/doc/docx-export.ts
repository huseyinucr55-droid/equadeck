// Word export (phase 3): the document as a .docx with real Word equations.
// Text keeps its formatting (bold, colours, sizes, headings, lists,
// alignment); formulas become OMML, so they stay editable in Word.
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, ImportedXmlComponent, LevelFormat, PageBreak, PageOrientation, Packer, Paragraph,
  ShadingType, TextRun, convertMillimetersToTwip, type ParagraphChild,
} from 'docx';
import type { JSONContent } from '@tiptap/react';
import { latexToOmml } from './omml';
import { MARGIN_MM, type Doc } from './store';

type Mark = { type: string; attrs?: Record<string, unknown> };

const ALIGN: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};
const HEADING = [undefined, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3] as const;

const hex = (c: unknown) => (typeof c === 'string' && /^#?[0-9a-f]{6}$/i.test(c) ? c.replace('#', '').toUpperCase() : undefined);
/** "16px" -> half-points (Word's unit): 16 px = 12 pt = 24. */
const halfPoints = (size: unknown) => {
  const px = typeof size === 'string' ? parseFloat(size) : NaN;
  return Number.isFinite(px) ? Math.round(px * 0.75 * 2) : undefined;
};
const firstFont = (f: unknown) => (typeof f === 'string' ? f.split(',')[0].replace(/["']/g, '').trim() : undefined);

function textRun(text: string, marks: Mark[] = []): TextRun {
  const m = Object.fromEntries(marks.map((x) => [x.type, x.attrs ?? {}])) as Record<string, Record<string, unknown>>;
  const style = m.textStyle ?? {};
  const highlight = hex(m.highlight?.color);
  return new TextRun({
    text,
    bold: 'bold' in m,
    italics: 'italic' in m,
    underline: 'underline' in m ? {} : undefined,
    strike: 'strike' in m,
    color: hex(style.color),
    size: halfPoints(style.fontSize),
    font: firstFont(style.fontFamily),
    shading: highlight ? { type: ShadingType.CLEAR, color: 'auto', fill: highlight } : undefined,
  });
}

function math(latex: string, display: boolean): ParagraphChild {
  return ImportedXmlComponent.fromXmlString(latexToOmml(latex, display)) as unknown as ParagraphChild;
}

function inline(content: JSONContent[] = []): ParagraphChild[] {
  const out: ParagraphChild[] = [];
  for (const n of content) {
    if (n.type === 'text') out.push(textRun(n.text ?? '', n.marks as Mark[]));
    else if (n.type === 'hardBreak') out.push(new TextRun({ break: 1 }));
    else if (n.type === 'mathInline') out.push(math(String(n.attrs?.latex ?? ''), false));
  }
  return out;
}

function blocks(content: JSONContent[] = [], list?: { ref: string; level: number }): Paragraph[] {
  const out: Paragraph[] = [];
  for (const n of content) {
    const align = ALIGN[String(n.attrs?.textAlign ?? '')];
    switch (n.type) {
      case 'paragraph':
        out.push(new Paragraph({ children: inline(n.content), alignment: align, numbering: list && { reference: list.ref, level: list.level } }));
        break;
      case 'heading':
        out.push(new Paragraph({ children: inline(n.content), heading: HEADING[Number(n.attrs?.level) || 1], alignment: align }));
        break;
      case 'bulletList':
      case 'orderedList': {
        const ref = n.type === 'bulletList' ? 'bullets' : 'numbers';
        const level = list ? list.level + 1 : 0;
        for (const item of n.content ?? []) {
          // The item's first paragraph carries the bullet; nested lists go one level deeper.
          let first = true;
          for (const child of item.content ?? []) {
            if (child.type === 'bulletList' || child.type === 'orderedList') out.push(...blocks([child], { ref, level }));
            else {
              out.push(...blocks([child], first ? { ref, level } : undefined));
              first = false;
            }
          }
        }
        break;
      }
      case 'mathBlock':
        out.push(new Paragraph({ children: [math(String(n.attrs?.latex ?? ''), true)], alignment: AlignmentType.CENTER }));
        break;
      case 'horizontalRule':
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'A0A7B1', space: 1 } } }));
        break;
      case 'pageBreak':
        out.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      case 'blockquote':
        out.push(...blocks(n.content, list));
        break;
      default:
        if (n.content) out.push(new Paragraph({ children: inline(n.content) }));
    }
  }
  return out;
}

export async function toDocx(content: JSONContent, doc: Doc): Promise<Blob> {
  const margin = convertMillimetersToTwip(MARGIN_MM[doc.margins]);
  const landscape = doc.orientation === 'landscape';
  const word = new Document({
    creator: 'Equadeck',
    title: doc.title,
    styles: { default: { document: { run: { font: 'Georgia', size: 24 } } } },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [0, 1, 2, 3].map((level) => ({
            level,
            format: LevelFormat.BULLET,
            text: ['•', '◦', '▪', '•'][level],
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
        {
          reference: 'numbers',
          levels: [0, 1, 2, 3].map((level) => ({
            level,
            format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN, LevelFormat.DECIMAL][level],
            text: `%${level + 1}.`,
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297), orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
            margin: { top: margin, bottom: margin, left: margin, right: margin },
          },
        },
        children: blocks(content.content),
      },
    ],
  });
  return Packer.toBlob(word);
}
