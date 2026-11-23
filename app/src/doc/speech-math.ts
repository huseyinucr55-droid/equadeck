// Spoken maths -> LaTeX ("x hoch zwei plus eins" -> "x^{2}+1"). Text in, text
// out: no browser needed, so it can be tested on its own.
//
// Rules worth knowing:
// - "a plus b durch c" divides only b by c; "Bruch a plus b durch c" takes all
//   of "a plus b" as the numerator.
// - A fraction, root or power takes one factor after it ("Wurzel aus x plus 1"
//   is √x + 1); say "Ende" to close a longer one ("Wurzel aus x plus 1 Ende").
// - Letters are small unless you say "groß" (the recogniser's capitals are
//   unreliable: a sentence starts with a capital).
export type SpeechLang = 'de' | 'en';
export type Spoken = { latex: string; /** words that are not maths (kept as text) */ unknown: string[] };

type Tok = { t: 'num' | 'atom' | 'rel' | 'add' | 'mul' | 'fn' | 'kw' | 'word'; v: string };

/** "phrase|other phrase" -> token, per language. Longer phrases win. */
type Table = [string, Tok][];
const rel = (v: string): Tok => ({ t: 'rel', v }); // = < ⇔ …: between two sides
const add = (v: string): Tok => ({ t: 'add', v });
const mul = (v: string): Tok => ({ t: 'mul', v });
const atom = (v: string): Tok => ({ t: 'atom', v }); // a letter or symbol that can take a power
const num = (v: string): Tok => ({ t: 'num', v });
const fn = (v: string): Tok => ({ t: 'fn', v });
const kw = (v: string): Tok => ({ t: 'kw', v }); // words with a meaning of their own

const GREEK = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi pi rho sigma tau phi chi psi omega'.split(' ');

const COMMON: Table = [
  ['+|plus', add('+')],
  ['-|−|–|minus', add('-')],
  ['±|plus minus', add('\\pm ')],
  ['*|×|·|⋅', mul('\\cdot ')],
  ['/|:|÷', kw('over')],
  ['=', rel('=')],
  ['≠', rel('\\neq ')],
  ['<', rel('<')],
  ['>', rel('>')],
  ['≤|<=', rel('\\leq ')],
  ['≥|>=', rel('\\geq ')],
  ['≈', rel('\\approx ')],
  ['→|->', rel('\\to ')],
  ['∈', rel('\\in ')],
  ['^', kw('pow')],
  ['_|index', kw('sub')],
  ['²', kw('squared')],
  ['³', kw('cubed')],
  ['√', kw('root')],
  ['(', kw('open')],
  [')', kw('close')],
  ['∞', atom('\\infty ')],
  ['π', atom('\\pi ')],
  ['%', kw('percent')],
  ['!', kw('factorial')],
  [',', rel(',')],
  [';', rel(';')],
  ['sin', fn('\\sin ')],
  ['cos', fn('\\cos ')],
  ['tan', fn('\\tan ')],
  ['ln', fn('\\ln ')],
  ['log', fn('\\log ')],
  ['lim', kw('lim')],
  ['limes', kw('lim')],
  ['integral', kw('int')],
  ...GREEK.map((g): [string, Tok] => [g, atom(g === 'epsilon' ? '\\varepsilon ' : g === 'phi' ? '\\varphi ' : `\\${g} `)]),
];

const DE: Table = [
  ['null', num('0')], ['eins', num('1')], ['ein', num('1')], ['eine', num('1')], ['zwei|zwo', num('2')], ['drei', num('3')],
  ['vier', num('4')], ['fünf', num('5')], ['sechs', num('6')], ['sieben', num('7')], ['acht', num('8')], ['neun', num('9')],
  ['zehn', num('10')], ['elf', num('11')], ['zwölf', num('12')],
  ['mal', mul('\\cdot ')], ['kreuz', mul('\\times ')],
  ['durch|geteilt durch|dividiert durch', kw('over')],
  ['gleich|ist gleich', rel('=')],
  ['ungleich|ist ungleich|nicht gleich', rel('\\neq ')],
  ['kleiner|kleiner als|ist kleiner als', rel('<')],
  ['größer|größer als|ist größer als', rel('>')],
  ['kleiner gleich|kleiner oder gleich|kleiner als oder gleich', rel('\\leq ')],
  ['größer gleich|größer oder gleich|größer als oder gleich', rel('\\geq ')],
  ['ungefähr|ungefähr gleich', rel('\\approx ')],
  ['äquivalent|äquivalent zu|genau dann wenn', rel('\\Leftrightarrow ')],
  ['daraus folgt|folgt|impliziert', rel('\\Rightarrow ')],
  ['pfeil|gegen', rel('\\to ')],
  ['element von|ist element von|element', rel('\\in ')],
  ['nicht element von|kein element von', rel('\\notin ')],
  ['teilmenge von|teilmenge', rel('\\subseteq ')],
  ['vereinigt|vereinigt mit', add('\\cup ')],
  ['geschnitten|geschnitten mit', add('\\cap ')],
  ['ohne', add('\\setminus ')],
  ['und', rel('\\land ')],
  ['oder', rel('\\lor ')],
  ['komma', rel(',')],
  ['für alle', atom('\\forall ')],
  ['es existiert|es gibt', atom('\\exists ')],
  ['unendlich', atom('\\infty ')],
  ['leere menge', atom('\\emptyset ')],
  ['reelle zahlen|reellen zahlen', atom('\\mathbb{R}')],
  ['natürliche zahlen|natürlichen zahlen', atom('\\mathbb{N}')],
  ['ganze zahlen|ganzen zahlen', atom('\\mathbb{Z}')],
  ['rationale zahlen|rationalen zahlen', atom('\\mathbb{Q}')],
  ['komplexe zahlen|komplexen zahlen', atom('\\mathbb{C}')],
  ['hoch', kw('pow')], ['quadrat|zum quadrat|im quadrat', kw('squared')],
  ['unten|tief', kw('sub')],
  ['bruch', kw('frac')], ['ende|bruch ende|wurzel ende|ende bruch|ende wurzel', kw('end')],
  ['wurzel|wurzel aus|wurzel von|quadratwurzel|quadratwurzel aus|quadratwurzel von', kw('root')],
  ['dritte wurzel aus|dritte wurzel von|kubikwurzel aus|kubikwurzel von', kw('root3')],
  ['klammer auf|auf klammer', kw('open')], ['klammer zu|zu klammer', kw('close')],
  ['betrag|betrag von', kw('abs')], ['vektor', kw('vec')], ['strich', kw('prime')],
  ['fakultät', kw('factorial')], ['prozent', kw('percent')], ['grad', kw('degree')],
  ['halb|halbe', kw('half')], ['drittel', kw('third')], ['viertel', kw('quarter')],
  ['sinus', fn('\\sin ')], ['kosinus|cosinus', fn('\\cos ')], ['tangens', fn('\\tan ')],
  ['logarithmus', fn('\\log ')], ['natürlicher logarithmus', fn('\\ln ')],
  ['summe', kw('sum')], ['produkt', kw('prod')], ['grenzwert', kw('lim')],
  ['von', kw('of')], ['über', kw('of')], ['bis', kw('to')],
  ['groß|großes', kw('capital')], ['klein|kleines', kw('small')],
  ['ix', atom('x')], ['ypsilon', atom('y')], ['zett|zet', atom('z')], ['zeh|ce', atom('c')], ['eff', atom('f')], ['jot', atom('j')],
  ['pe', atom('p')], ['fau', atom('v')],
];

const EN: Table = [
  ['zero', num('0')], ['one', num('1')], ['two', num('2')], ['three', num('3')], ['four', num('4')], ['five', num('5')],
  ['six', num('6')], ['seven', num('7')], ['eight', num('8')], ['nine', num('9')], ['ten', num('10')], ['eleven', num('11')], ['twelve', num('12')],
  ['times', mul('\\cdot ')], ['cross', mul('\\times ')],
  ['over|divided by', kw('over')],
  ['equals|equal|is equal to|equal to', rel('=')],
  ['not equal|not equal to|is not equal to', rel('\\neq ')],
  ['less than|is less than', rel('<')], ['greater than|is greater than', rel('>')],
  ['less or equal|less than or equal to|less than or equal', rel('\\leq ')],
  ['greater or equal|greater than or equal to|greater than or equal', rel('\\geq ')],
  ['approximately|approximately equal to', rel('\\approx ')],
  ['if and only if|equivalent|equivalent to', rel('\\Leftrightarrow ')],
  ['implies', rel('\\Rightarrow ')], ['arrow|goes to|approaches', rel('\\to ')],
  ['element of|is an element of|in', rel('\\in ')], ['not an element of|not in', rel('\\notin ')],
  ['subset of|subset', rel('\\subseteq ')], ['union', add('\\cup ')], ['intersection', add('\\cap ')], ['without', add('\\setminus ')],
  ['and', rel('\\land ')], ['or', rel('\\lor ')], ['comma', rel(',')],
  ['for all', atom('\\forall ')], ['there exists', atom('\\exists ')], ['infinity', atom('\\infty ')], ['empty set', atom('\\emptyset ')],
  ['real numbers', atom('\\mathbb{R}')], ['natural numbers', atom('\\mathbb{N}')], ['integers', atom('\\mathbb{Z}')],
  ['rational numbers', atom('\\mathbb{Q}')], ['complex numbers', atom('\\mathbb{C}')],
  ['to the power of|to the power|power|raised to', kw('pow')], ['squared', kw('squared')], ['cubed', kw('cubed')],
  ['sub|subscript', kw('sub')],
  ['fraction', kw('frac')], ['end|end fraction|end root', kw('end')],
  ['root|root of|square root|square root of|the square root of', kw('root')], ['cube root of|cubic root of', kw('root3')],
  ['open bracket|open parenthesis|open paren', kw('open')], ['close bracket|close parenthesis|close paren', kw('close')],
  ['absolute value|absolute value of', kw('abs')], ['vector', kw('vec')], ['prime', kw('prime')],
  ['factorial', kw('factorial')], ['percent', kw('percent')], ['degrees|degree', kw('degree')],
  ['half', kw('half')], ['third|thirds', kw('third')], ['quarter|quarters', kw('quarter')],
  ['sine', fn('\\sin ')], ['cosine', fn('\\cos ')], ['tangent', fn('\\tan ')], ['logarithm', fn('\\log ')], ['natural logarithm', fn('\\ln ')],
  ['sum', kw('sum')], ['product', kw('prod')], ['limit', kw('lim')],
  ['of', kw('of')], ['to', kw('to')], ['from', kw('from')],
  ['capital|uppercase', kw('capital')], ['lowercase', kw('small')],
  ['why', atom('y')], ['zed|zee', atom('z')], ['ex', atom('x')],
];

const MAX_PHRASE = 6;
function index(table: Table): Map<string, Tok> {
  const map = new Map<string, Tok>();
  for (const [phrases, tok] of table) for (const p of phrases.split('|')) map.set(p, tok);
  map.set('|', kw('bar')); // "|" separates the phrases above, so it is added here
  return map;
}
const INDEX: Record<SpeechLang, Map<string, Tok>> = { de: index([...COMMON, ...DE]), en: index([...COMMON, ...EN]) };

// Numbers, words, two-character signs, then any other sign.
const SPLIT = /\d+(?:[.,]\d+)?|\p{L}+|<=|>=|->|\S/gu;

function tokens(spoken: string, lang: SpeechLang): Tok[] {
  const raw = spoken.normalize('NFC').match(SPLIT) ?? [];
  const low = raw.map((r) => r.toLowerCase());
  const map = INDEX[lang];
  const out: Tok[] = [];
  for (let i = 0; i < raw.length; ) {
    let hit: Tok | undefined;
    let n = Math.min(MAX_PHRASE, raw.length - i);
    for (; n >= 1; n--) {
      hit = map.get(low.slice(i, i + n).join(' '));
      if (hit) break;
    }
    if (hit) {
      out.push(hit);
      i += n;
      continue;
    }
    const w = low[i];
    if (/^\d/.test(w)) out.push(num(w.replace(',', '{,}')));
    // "ab" heard as one word: the variables a and b.
    else if (/^[a-z]{1,2}$/.test(w)) for (const ch of w) out.push(atom(ch));
    else out.push({ t: 'word', v: raw[i] });
    i++;
  }
  return out;
}

type Stop = (t: Tok) => boolean;
const kwStop = (...v: string[]): Stop => (t) => t.t === 'kw' && v.includes(t.v);
const isSign = (t: Tok) => t.t === 'rel' || t.t === 'add' || t.t === 'mul';
const box = '\\placeholder{}';

class Parser {
  i = 0;
  unknown: string[] = [];
  constructor(private toks: Tok[]) {}

  private isKw(v: string) {
    const t = this.toks[this.i];
    return t?.t === 'kw' && t.v === v;
  }
  private eat(v: string) {
    if (!this.isKw(v)) return false;
    this.i++;
    return true;
  }
  private back(i: number, unknown: number) {
    this.i = i;
    this.unknown.length = unknown;
  }

  /** After a fraction, root …: up to a spoken "Ende" if there is one, else one factor. */
  private argument(stop: Stop): string {
    const start = this.i;
    const lost = this.unknown.length;
    // Only look for the long form when an "Ende" follows at all.
    if (this.toks.slice(start).some(kwStop('end'))) {
      const long = this.expr((t) => kwStop('end')(t) || stop(t));
      if (this.eat('end')) return long || box;
      this.back(start, lost);
    }
    return this.factor(stop).trim() || box;
  }

  /** One factor with its powers and indices: "x", "x hoch 2", "Klammer auf … zu". */
  private factor(stop: Stop): string {
    let sign = '';
    while (this.toks[this.i]?.t === 'add' && !stop(this.toks[this.i])) sign += this.toks[this.i++].v;
    const base = this.primary(stop);
    return base === null ? sign : sign + this.postfix(base, stop);
  }

  private postfix(start: string, stop: Stop): string {
    let base = start;
    let sup = '';
    let sub = '';
    let primes = '';
    const close = () => {
      const marks = primes + (sub ? `_{${sub}}` : '') + (sup ? `^{${sup}}` : '');
      base = marks ? base.trimEnd() + marks : base;
      primes = sub = sup = '';
      return base;
    };
    for (;;) {
      const t = this.toks[this.i];
      if (!t || t.t !== 'kw' || stop(t)) return close();
      if (t.v === 'pow' || t.v === 'sub') {
        if (t.v === 'pow' ? sup : sub) return close(); // "x hoch 2 hoch 3": left as it is
        this.i++;
        if (t.v === 'pow') sup = this.script(stop);
        else sub = this.script(stop);
      } else if (t.v === 'squared' || t.v === 'cubed' || t.v === 'degree') {
        if (sup) return close();
        this.i++;
        sup = { squared: '2', cubed: '3', degree: '\\circ' }[t.v];
      } else if (t.v === 'prime') {
        this.i++;
        primes += "'";
      } else if (t.v === 'factorial' || t.v === 'percent') {
        this.i++;
        base = close().trimEnd() + (t.v === 'percent' ? '\\%' : '!');
      } else if (t.v === 'of' && /^(?:[a-zA-Z]|\\[a-zA-Z]+ )$/.test(base) && base !== '\\infty ' && this.i + 1 < this.toks.length) {
        // "f von x" -> f(x)
        this.i++;
        const arg = this.isKw('open') ? this.factor(stop) : `\\left(${this.factor(stop).trim() || box}\\right)`;
        base = close().trimEnd() + arg;
      } else return close();
    }
  }

  /** "hoch 2", "hoch minus n", "hoch Klammer auf n plus 1 Klammer zu" (there the brackets only group). */
  private script(stop: Stop): string {
    if (this.eat('open')) {
      const inner = this.expr(kwStop('close'));
      this.eat('close');
      return inner || box;
    }
    let sign = '';
    while (this.toks[this.i]?.t === 'add' && !stop(this.toks[this.i])) sign += this.toks[this.i++].v;
    const t = this.toks[this.i];
    if (!t || stop(t) || isSign(t)) return sign ? sign + box : box;
    return (sign + (this.primary(stop) ?? '')).trim() || box;
  }

  private primary(stop: Stop): string | null {
    const t = this.toks[this.i];
    if (!t || stop(t) || isSign(t)) return null;
    this.i++;
    if (t.t === 'num') {
      for (const [k, n] of [['half', 2], ['third', 3], ['quarter', 4]] as const) if (this.eat(k)) return `\\frac{${t.v}}{${n}}`;
      return t.v;
    }
    if (t.t === 'atom') return t.v;
    if (t.t === 'word') {
      this.unknown.push(t.v);
      const text = t.v.replace(/[\\{}$&#^_%~]/g, '');
      return text ? `\\text{ ${text} }` : '';
    }
    if (t.t === 'fn') {
      // Powers right after the name belong to it: "Sinus Quadrat x".
      const name = this.isKw('of') ? t.v : `${this.postfix(t.v, kwStop('of')).trimEnd()} `;
      this.eat('of');
      return name + this.factor(stop);
    }
    switch (t.v) {
      case 'capital':
      case 'small':
        return this.letter(t.v === 'capital', t.v);
      case 'open': {
        const inner = this.expr(kwStop('close'));
        this.eat('close');
        return `\\left(${inner || box}\\right)`;
      }
      case 'bar': {
        const inner = this.expr(kwStop('bar'));
        this.eat('bar');
        return `\\left|${inner || box}\\right|`;
      }
      case 'abs':
        return `\\left|${this.argument(stop)}\\right|`;
      case 'root':
        return `\\sqrt{${this.argument(stop)}}`;
      case 'root3':
        return `\\sqrt[3]{${this.argument(stop)}}`;
      case 'vec': {
        const n = this.toks[this.i];
        return `\\vec{${(n && !stop(n) ? this.primary(stop) : null)?.trim() || box}}`;
      }
      case 'half':
        return '\\frac{1}{2}';
      case 'third':
        return '\\frac{1}{3}';
      case 'quarter':
        return '\\frac{1}{4}';
      case 'frac': {
        const top = this.expr((x) => kwStop('over')(x) || stop(x));
        const bottom = this.eat('over') ? this.argument(stop) : box;
        return `\\frac{${top || box}}{${bottom}}`;
      }
      case 'sum':
      case 'prod':
      case 'int':
        return this.big({ sum: '\\sum', prod: '\\prod', int: '\\int' }[t.v], stop);
      case 'lim': {
        this.eat('of');
        const start = this.i;
        const lost = this.unknown.length;
        const v = this.factor((x) => kwStop('to')(x) || stop(x)).trim();
        const next = this.toks[this.i];
        if (v && next && ((next.t === 'rel' && next.v === '\\to ') || this.isKw('to'))) {
          this.i++;
          const goal = this.factor((x) => kwStop('of')(x) || stop(x)).trim() || box;
          this.eat('of');
          return `\\lim_{${v}\\to ${goal}} `;
        }
        this.back(start, lost);
        return '\\lim ';
      }
      case 'pow':
        return `${box}^{${this.script(stop)}}`;
      case 'sub':
        return `${box}_{${this.script(stop)}}`;
      case 'squared':
      case 'cubed':
        return `${box}^{${t.v === 'squared' ? 2 : 3}}`;
      case 'over':
        return `\\frac{${box}}{${this.argument(stop)}}`;
      default:
        // "von", "bis", "Ende", "Strich" … with nothing to belong to.
        this.unknown.push(t.v);
        return '';
    }
  }

  /** "Summe von k gleich 1 bis n": limits only if there is a "bis". */
  private big(sign: string, stop: Stop): string {
    const start = this.i;
    const lost = this.unknown.length;
    if (!this.eat('of')) this.eat('from');
    const low = this.expr((x) => kwStop('to', 'of')(x) || stop(x));
    if (low && this.eat('to')) {
      const high = this.factor((x) => kwStop('of')(x) || stop(x)).trim() || box;
      this.eat('of');
      return `${sign}_{${low}}^{${high}}`;
    }
    this.back(start, lost);
    this.eat('of');
    return `${sign} `;
  }

  /** "groß A", "groß Delta". */
  private letter(capital: boolean, word: string): string {
    const n = this.toks[this.i];
    if (n?.t !== 'atom') {
      this.unknown.push(word);
      return '';
    }
    this.i++;
    if (!capital) return n.v;
    if (/^[a-z]$/.test(n.v)) return n.v.toUpperCase();
    const g = /^\\(?:var)?([a-z])([a-z]+) $/.exec(n.v);
    const name = g ? g[1].toUpperCase() + g[2] : '';
    // Only Greek capitals that differ from a Latin letter have a command.
    return /^(Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega)$/.test(name) ? `\\${name} ` : n.v;
  }

  expr(stop: Stop): string {
    const parts: { v: string; sign: boolean }[] = [];
    for (;;) {
      const t = this.toks[this.i];
      if (!t || stop(t)) break;
      if (isSign(t)) {
        this.i++;
        parts.push({ v: t.v, sign: true });
      } else if (t.t === 'kw' && t.v === 'over') {
        // The one factor before is divided by the one after.
        this.i++;
        const last = parts[parts.length - 1];
        const top = last && !last.sign ? parts.pop()!.v.trim() : box;
        parts.push({ v: `\\frac{${top}}{${this.argument(stop)}}`, sign: false });
      } else {
        const v = this.factor(stop);
        if (v) parts.push({ v, sign: false });
      }
    }
    return parts.map((p) => p.v).join('').replace(/ {2,}/g, ' ').trim();
  }
}

export function spokenToLatex(spoken: string, lang: SpeechLang): Spoken {
  const p = new Parser(tokens(spoken, lang));
  const latex = p.expr(() => false);
  return { latex, unknown: p.unknown };
}

export type Command = 'newline' | 'formula' | 'text' | 'undo' | 'stop';
const COMMANDS: Record<SpeechLang, Map<string, Command>> = {
  de: new Map<string, Command>([
    ['neue zeile', 'newline'], ['nächste zeile', 'newline'], ['absatz', 'newline'], ['neuer absatz', 'newline'],
    ['formel', 'formula'], ['neue formel', 'formula'], ['formel anfang', 'formula'],
    ['formel ende', 'text'], ['ende formel', 'text'], ['formel fertig', 'text'], ['zurück zum text', 'text'],
    ['rückgängig', 'undo'],
    ['spracheingabe aus', 'stop'], ['diktat beenden', 'stop'], ['spracheingabe beenden', 'stop'],
  ]),
  en: new Map<string, Command>([
    ['new line', 'newline'], ['next line', 'newline'], ['new paragraph', 'newline'],
    ['formula', 'formula'], ['new formula', 'formula'],
    ['end formula', 'text'], ['formula done', 'text'], ['back to text', 'text'],
    ['undo', 'undo'],
    ['stop dictation', 'stop'], ['stop voice input', 'stop'],
  ]),
};

/** A command, only when it is the whole phrase ("neue Zeile"). */
export function spokenCommand(spoken: string, lang: SpeechLang): Command | null {
  const key = spoken.normalize('NFC').toLowerCase().replace(/[.,!?]+\s*$/, '').replace(/\s+/g, ' ').trim();
  return COMMANDS[lang].get(key) ?? null;
}

/** "Formel x hoch zwei" said in the text: the formula, if all of it is maths ("Formel eins fahren" stays text). */
export function spokenFormula(spoken: string, lang: SpeechLang): string | null {
  const m = (lang === 'de' ? /^\s*formel[\s:,]+(.+)$/i : /^\s*formula[\s:,]+(.+)$/i).exec(spoken);
  if (!m) return null;
  const { latex, unknown } = spokenToLatex(m[1].replace(/[.?]+\s*$/, ''), lang);
  return latex && !unknown.length ? latex : null;
}
