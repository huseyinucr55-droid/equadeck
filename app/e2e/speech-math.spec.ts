// Spoken maths -> LaTeX, without a browser (src/doc/speech-math.ts).
import { test, expect } from '@playwright/test';
import { spokenCommand, spokenFormula, spokenToLatex } from '../src/doc/speech-math';

const DE: [string, string][] = [
  ['x hoch zwei plus eins', 'x^{2}+1'],
  ['X² + 1', 'x^{2}+1'],
  ['x ^ 2 = 4', 'x^{2}=4'],
  ['a plus b durch c', 'a+\\frac{b}{c}'],
  ['Bruch a plus b durch c', '\\frac{a+b}{c}'],
  ['Bruch 1 durch x plus 1', '\\frac{1}{x}+1'],
  ['Bruch 1 durch x plus 1 Ende', '\\frac{1}{x+1}'],
  ['x hoch zwei durch drei', '\\frac{x^{2}}{3}'],
  ['1/2', '\\frac{1}{2}'],
  ['Wurzel aus x', '\\sqrt{x}'],
  ['Wurzel aus x plus 1', '\\sqrt{x}+1'],
  ['Wurzel aus x plus 1 Ende mal 2', '\\sqrt{x+1}\\cdot 2'],
  ['dritte Wurzel aus 8', '\\sqrt[3]{8}'],
  ['Klammer auf a plus b Klammer zu zum Quadrat', '\\left(a+b\\right)^{2}'],
  ['e hoch minus x', 'e^{-x}'],
  ['e hoch Klammer auf n plus 1 Klammer zu', 'e^{n+1}'],
  ['x Index n', 'x_{n}'],
  ['a unten eins hoch zwei', 'a_{1}^{2}'],
  ['x kleiner gleich 5', 'x\\leq 5'],
  ['x größer als 0', 'x>0'],
  ['x ungleich y', 'x\\neq y'],
  ['a gleich b äquivalent b gleich a', 'a=b\\Leftrightarrow b=a'],
  ['Summe von k gleich eins bis n', '\\sum_{k=1}^{n}'],
  ['Summe von k gleich eins bis n über k hoch zwei', '\\sum_{k=1}^{n}k^{2}'],
  ['Integral von 0 bis unendlich f von x', '\\int_{0}^{\\infty}f\\left(x\\right)'],
  ['Limes x gegen unendlich', '\\lim_{x\\to \\infty}'],
  ['f von x gleich 2x', 'f\\left(x\\right)=2x'],
  ['f Strich von x', "f'\\left(x\\right)"],
  ['Sinus von x', '\\sin x'],
  ['Sinus Quadrat x', '\\sin^{2} x'],
  ['alpha plus beta', '\\alpha +\\beta'],
  ['groß Delta', '\\Delta'],
  ['groß A Teilmenge von groß B', 'A\\subseteq B'],
  ['x Element von reelle Zahlen', 'x\\in \\mathbb{R}'],
  ['Betrag von x', '\\left|x\\right|'],
  ['3,5 mal 2', '3{,}5\\cdot 2'],
  ['ein halb', '\\frac{1}{2}'],
  ['drei Viertel', '\\frac{3}{4}'],
  ['n Fakultät', 'n!'],
  ['Vektor a', '\\vec{a}'],
  ['minus 3 plus 2', '-3+2'],
  ['x hoch', 'x^{\\placeholder{}}'],
  ['', ''],
];

test.describe('Spoken maths', () => {
  for (const [spoken, latex] of DE) {
    test(`SP-DE "${spoken}"`, () => expect(spokenToLatex(spoken, 'de').latex).toBe(latex));
  }

  for (const [spoken, latex] of [
    ['x squared plus one', 'x^{2}+1'],
    ['fraction a plus b over c', '\\frac{a+b}{c}'],
    ['square root of x', '\\sqrt{x}'],
    ['sum from k equals one to n of k', '\\sum_{k=1}^{n}k'],
    ['limit x goes to infinity', '\\lim_{x\\to \\infty}'],
    ['f of x equals y', 'f\\left(x\\right)=y'],
    ['x less than or equal to 5', 'x\\leq 5'],
  ]) {
    test(`SP-EN "${spoken}"`, () => expect(spokenToLatex(spoken, 'en').latex).toBe(latex));
  }

  test('SP-1 words that are not maths stay readable and are reported', () => {
    const r = spokenToLatex('x gleich Haus', 'de');
    expect(r).toEqual({ latex: 'x=\\text{ Haus }', unknown: ['Haus'] });
    // No LaTeX commands can come in through speech.
    expect(spokenToLatex('\\input{abc}', 'de').latex).not.toContain('\\input');
  });

  test('SP-2 commands count only as the whole phrase; "Formel …" only when it is all maths', () => {
    expect(spokenCommand('Neue Zeile.', 'de')).toBe('newline');
    expect(spokenCommand('eine neue Zeile schreiben', 'de')).toBeNull();
    expect(spokenCommand('constructor', 'en')).toBeNull();
    expect(spokenFormula('Formel x hoch zwei', 'de')).toBe('x^{2}');
    expect(spokenFormula('Formel eins fahren', 'de')).toBeNull();
    expect(spokenFormula('Es gilt x hoch zwei', 'de')).toBeNull();
  });

  test('SP-3 never hangs or throws on odd input', () => {
    const words = 'hoch durch Bruch Ende Klammer auf zu von bis Summe Limes Wurzel aus x 2 plus gleich | ² Haus groß Sinus Strich'.split(' ');
    let seed = 7;
    const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    for (let n = 0; n < 1500; n++) {
      const phrase = Array.from({ length: 1 + (next() % 10) }, () => words[next() % words.length]).join(' ');
      const { latex } = spokenToLatex(phrase, 'de');
      const open = (latex.match(/(?<!\\)\{/g) ?? []).length;
      const close = (latex.match(/(?<!\\)\}/g) ?? []).length;
      expect(open, phrase).toBe(close);
      expect((latex.match(/\\left/g) ?? []).length, phrase).toBe((latex.match(/\\right/g) ?? []).length);
    }
  });
});
