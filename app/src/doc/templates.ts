// Ready-made starting points: a worksheet, lecture notes, homework.
// Each fills a new document with headings, name/date lines, task numbers and
// a formula line to start from, on suitable paper.
import type { JSONContent } from '@tiptap/react';
import type { Paper } from './store';

export type TemplateKind = 'worksheet' | 'notes' | 'homework';

const text = (t: string, bold = false): JSONContent => ({ type: 'text', text: t, ...(bold ? { marks: [{ type: 'bold' }] } : {}) });
const p = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', ...(content.length ? { content } : {}) });
const h = (level: 1 | 2, t: string): JSONContent => ({ type: 'heading', attrs: { level }, content: [text(t)] });
const math = (latex: string): JSONContent => ({ type: 'mathBlock', attrs: { latex } });
const bullets = (...items: string[]): JSONContent => ({
  type: 'bulletList',
  content: items.map((i) => ({ type: 'listItem', content: [p(text(i))] })),
});

export function template(kind: TemplateKind, lang: 'de' | 'en'): { title: string; paper: Paper; content: JSONContent } {
  const de = lang === 'de';
  const date = new Date().toLocaleDateString(de ? 'de-DE' : 'en-GB');
  const line = '________________';
  switch (kind) {
    case 'worksheet':
      return {
        title: de ? 'Arbeitsblatt' : 'Worksheet',
        paper: 'squared',
        content: {
          type: 'doc',
          content: [
            p(text('Name: ', true), text(line), text(de ? '    Klasse: ' : '    Class: ', true), text('______'), text(de ? '    Datum: ' : '    Date: ', true), text(date)),
            h(1, de ? 'Arbeitsblatt: Thema' : 'Worksheet: Topic'),
            h(2, de ? 'Aufgabe 1' : 'Task 1'),
            p(text(de ? 'Berechne:' : 'Work out:')),
            math('\\frac{3}{4}+\\frac{1}{6}='),
            h(2, de ? 'Aufgabe 2' : 'Task 2'),
            p(text(de ? 'Löse die Gleichung nach x auf:' : 'Solve for x:')),
            math('2x+5=13'),
            h(2, de ? 'Aufgabe 3' : 'Task 3'),
            p(text(de ? 'Begründe deine Antwort.' : 'Explain your answer.')),
            p(),
          ],
        },
      };
    case 'notes':
      return {
        title: de ? 'Mitschrift' : 'Notes',
        paper: 'lined',
        content: {
          type: 'doc',
          content: [
            p(text(de ? 'Fach: ' : 'Subject: ', true), text(line), text(de ? '    Datum: ' : '    Date: ', true), text(date)),
            h(1, de ? 'Thema' : 'Topic'),
            h(2, 'Definition'),
            p(text(de ? 'Eine Menge ist …' : 'A set is …')),
            h(2, de ? 'Wichtige Formeln' : 'Key formulas'),
            math('a^2+b^2=c^2'),
            h(2, de ? 'Stichpunkte' : 'Key points'),
            bullets(de ? 'Erster Punkt' : 'First point', de ? 'Zweiter Punkt' : 'Second point'),
            h(2, de ? 'Fragen' : 'Questions'),
            p(),
          ],
        },
      };
    case 'homework':
      return {
        title: de ? 'Hausaufgabe' : 'Homework',
        paper: 'squared',
        content: {
          type: 'doc',
          content: [
            p(text('Name: ', true), text(line), text(de ? '    Klasse: ' : '    Class: ', true), text('______'), text(de ? '    Datum: ' : '    Date: ', true), text(date)),
            h(1, de ? 'Hausaufgabe' : 'Homework'),
            h(2, de ? 'Aufgabe a)' : 'Task a)'),
            p(text(de ? 'Gegeben: ' : 'Given: ', true)),
            p(text(de ? 'Gesucht: ' : 'Find: ', true)),
            p(text(de ? 'Lösung:' : 'Solution:', true)),
            math('x='),
            h(2, de ? 'Aufgabe b)' : 'Task b)'),
            p(text(de ? 'Lösung:' : 'Solution:', true)),
            p(),
            p(text(de ? 'Antwort: ' : 'Answer: ', true)),
          ],
        },
      };
  }
}
