// English / German UI text. English strings are the keys: the source keeps
// reading naturally, and anything missing from DE simply stays English.
// LaTeX code, the brand name and example equations are never translated.

import { useCallback, useSyncExternalStore } from 'react';

export type Lang = 'en' | 'de';
export type Vars = Record<string, string | number>;

const DE: Record<string, string> = {
  // Header, toolbar, export
  'Skip to editor': 'Zum Editor springen',
  'Main': 'Hauptmenü',
  'Reference': 'Referenz',
  'Theme: {theme}. Switch theme': 'Darstellung: {theme}. Darstellung wechseln',
  'system': 'System',
  'light': 'Hell',
  'dark': 'Dunkel',
  'Sign in': 'Anmelden',
  'Close': 'Schließen',
  'Editing': 'Bearbeiten',
  'Undo (Ctrl+Z)': 'Rückgängig (Strg+Z)',
  'Redo (Ctrl+Shift+Z)': 'Wiederholen (Strg+Umschalt+Z)',
  'Text': 'Text',
  'Bold': 'Fett',
  'Display': 'Anzeigestil',
  'Matrix': 'Matrix',
  'Examples': 'Beispiele',
  'Join lines': 'Zeilen verbinden',
  'Put everything on one line': 'Alles in eine Zeile setzen',
  'Size': 'Größe',
  'Typing': 'Eingabe',
  'Shortcuts (=> becomes ⇒, != becomes ≠)': 'Kürzel (=> wird zu ⇒, != wird zu ≠)',
  'Keep my spaces': 'Meine Leerzeichen behalten',
  'Nothing to export yet': 'Noch nichts zu exportieren',
  'The renderer is still loading': 'Die Darstellung wird noch geladen',
  'Fix the error first': 'Behebe zuerst den Fehler',
  'Still updating the preview': 'Die Vorschau wird noch aktualisiert',
  'Too large for this device, saved at {n}×.': 'Für dieses Gerät zu groß, mit {n}× gespeichert.',
  'Saved as PNG.': 'Als PNG gespeichert.',
  'Export failed.': 'Export fehlgeschlagen.',
  'Canvas is not available in this browser.': 'Canvas ist in diesem Browser nicht verfügbar.',
  'Could not create the image.': 'Das Bild konnte nicht erstellt werden.',
  'Saved as PDF.': 'Als PDF gespeichert.',
  'Your PDF is ready.': 'Dein PDF ist fertig.',
  'Save PDF': 'PDF speichern',
  'Could not create the PDF. Try PNG or SVG.': 'Das PDF konnte nicht erstellt werden. Versuche PNG oder SVG.',
  'Saved as SVG.': 'Als SVG gespeichert.',
  'LaTeX copied to your clipboard.': 'LaTeX in die Zwischenablage kopiert.',
  'Copying is blocked in this browser.': 'Kopieren ist in diesem Browser blockiert.',
  'Ready. Paste into Word or PowerPoint for an equation you can edit.': 'Fertig. Füge es in Word oder PowerPoint ein, um eine bearbeitbare Formel zu erhalten.',
  'Could not copy for Word. Try Copy image instead.': 'Kopieren für Word hat nicht geklappt. Versuche stattdessen „Bild kopieren“.',
  'LaTeX with its packages copied.': 'LaTeX mit Paketen kopiert.',
  'Image copied.': 'Bild kopiert.',
  'This browser cannot copy images. Use Download instead.': 'Dieser Browser kann keine Bilder kopieren. Nutze stattdessen den Download.',
  'Saving…': 'Speichere…',
  'Download PNG': 'PNG herunterladen',
  'Scale': 'Maßstab',
  'Making PDF…': 'PDF wird erstellt…',
  'Copy image': 'Bild kopieren',
  'Copy for Word': 'Für Word kopieren',
  'Copy LaTeX': 'LaTeX kopieren',
  'Paste into Word or PowerPoint as an editable equation': 'Als bearbeitbare Formel in Word oder PowerPoint einfügen',
  'Preview as image': 'Vorschau als Bild',
  'Export': 'Exportieren',
  'Saved equations': 'Gespeicherte Formeln',
  'Opened. Undo brings your last equation back.': 'Geöffnet. Mit „Rückgängig“ ist deine letzte Formel wieder da.',
  'Rendered with MathJax': 'Dargestellt mit MathJax',
  'About': 'Über',
  'Privacy': 'Datenschutz',
  'Terms': 'Nutzungsbedingungen',
  'Example added below.': 'Beispiel unten hinzugefügt.',
  'Example in place. Undo brings your equation back.': 'Beispiel eingefügt. Mit „Rückgängig“ ist deine Formel wieder da.',
  'Inserted.': 'Eingefügt.',
  'Accounts are on the way. Until then, your work and everything you save stay in this browser.':
    'Konten kommen bald. Bis dahin bleibt alles, was du schreibst und speicherst, in diesem Browser.',
  '{min} to {max}': '{min} bis {max}',

  // Editor, preview
  'Type LaTeX here, like \\frac{a}{b}': 'Gib hier LaTeX ein, z. B. \\frac{a}{b}',
  'LaTeX source': 'LaTeX-Quelltext',
  'Preview': 'Vorschau',
  'Empty preview': 'Leere Vorschau',
  'Start typing. Your equation shows up here.': 'Fang an zu tippen. Deine Formel erscheint hier.',
  'Loading the renderer…': 'Darstellung wird geladen…',
  'Showing the image as it will be exported.': 'Zeigt das Bild so, wie es exportiert wird.',
  'Your last working version stays on screen.': 'Deine letzte funktionierende Version bleibt sichtbar.',
  'Something in this equation could not be drawn': 'Etwas in dieser Formel konnte nicht gezeichnet werden',

  // Packages line
  'LaTeX packages': 'LaTeX-Pakete',
  'No extra packages needed in LaTeX.': 'In LaTeX sind keine zusätzlichen Pakete nötig.',
  'In LaTeX, add:': 'Füge in LaTeX hinzu:',
  'Needed for {list}': 'Benötigt für {list}',
  '(for {list})': '(für {list})',
  'Copy as LaTeX': 'Als LaTeX kopieren',
  'several lines (gather*)': 'mehrere Zeilen (gather*)',
  '{name} environment': '{name}-Umgebung',
  'colour {name}': 'Farbe {name}',
  '\\bbox is MathJax-only; in LaTeX use \\colorbox or \\fcolorbox (xcolor).':
    '\\bbox gibt es nur in MathJax; in LaTeX nimm \\colorbox oder \\fcolorbox (xcolor).',
  '\\style is MathJax-only and has no LaTeX equivalent.': '\\style gibt es nur in MathJax und hat kein LaTeX-Gegenstück.',
  '\\class is MathJax-only and has no LaTeX equivalent.': '\\class gibt es nur in MathJax und hat kein LaTeX-Gegenstück.',
  '\\cssId is MathJax-only and has no LaTeX equivalent.': '\\cssId gibt es nur in MathJax und hat kein LaTeX-Gegenstück.',
  '\\unicode is MathJax-only; type the character and compile with XeLaTeX or LuaLaTeX.':
    '\\unicode gibt es nur in MathJax; tippe das Zeichen direkt und kompiliere mit XeLaTeX oder LuaLaTeX.',
  '\\require is MathJax-only; use \\usepackage in the preamble instead.':
    '\\require gibt es nur in MathJax; nutze stattdessen \\usepackage in der Präambel.',
  "\\{cmd} doesn't work inside LaTeX maths; use \\text{\\{cmd} …} or \\scalebox (graphicx).":
    '\\{cmd} funktioniert in LaTeX-Formeln nicht; nutze \\text{\\{cmd} …} oder \\scalebox (graphicx).',
  'Unicode characters ({chars}) need XeLaTeX or LuaLaTeX; with pdfLaTeX use commands instead (e.g. \\div for ÷).':
    'Unicode-Zeichen ({chars}) brauchen XeLaTeX oder LuaLaTeX; bei pdfLaTeX nutze stattdessen Befehle (z. B. \\div für ÷).',

  // Palette
  'Symbols': 'Symbole',
  'Symbol groups': 'Symbolgruppen',
  'Search symbols': 'Symbole suchen',
  'Search results for {q}': 'Suchergebnisse für {q}',
  'No symbols match “{q}”.': 'Keine Symbole passen zu „{q}“.',
  'Basics': 'Grundlagen',
  'Relations': 'Relationen',
  'Operators': 'Operatoren',
  'Arrows': 'Pfeile',
  'Greek': 'Griechisch',
  'Sets & logic': 'Mengen & Logik',
  'Brackets': 'Klammern',
  'Accents': 'Akzente',
  'Functions': 'Funktionen',
  'Style': 'Stil',

  // Matrix dialog
  'Insert matrix': 'Matrix einfügen',
  'Cancel': 'Abbrechen',
  'Insert': 'Einfügen',
  'No brackets': 'Keine Klammern',
  'Parentheses': 'Runde Klammern',
  'Square brackets': 'Eckige Klammern',
  'Determinant bars': 'Determinantenstriche',
  'Double bars': 'Doppelstriche',
  'Braces': 'Geschweifte Klammern',
  'Rows': 'Zeilen',
  'Columns': 'Spalten',

  // Examples dialog
  'Pick one to start from. Hold Shift to add it below your current equation instead.':
    'Wähle eines als Ausgangspunkt. Halte Umschalt gedrückt, um es stattdessen unter deine aktuelle Formel zu setzen.',
  'Quadratic formula': 'Mitternachtsformel',
  "Euler's identity": 'Eulersche Identität',
  'Gaussian integral': 'Gaußsches Integral',
  'Taylor series': 'Taylorreihe',
  'Derivative as a limit': 'Ableitung als Grenzwert',
  "Bayes' theorem": 'Satz von Bayes',
  'Piecewise function': 'Stückweise Funktion',
  '2×2 determinant': '2×2-Determinante',
  'Step-by-step derivation': 'Schrittweise Herleitung',
  'Binomial theorem': 'Binomischer Lehrsatz',
  'Maxwell–Faraday law': 'Maxwell-Faraday-Gesetz',
  'Photosynthesis': 'Photosynthese',

  // Reference dialog
  'Reference sheets': 'Referenzblätter',
  'Insert {code}': 'Einfügen: {code}',
  'Insert {code}, {note}': 'Einfügen: {code}, {note}',
  'Click any line to insert it.': 'Klicke auf eine Zeile, um sie einzufügen.',
  'LaTeX basics': 'LaTeX-Grundlagen',
  'Colours': 'Farben',
  'Boxes & backgrounds': 'Rahmen & Hintergründe',
  'Chemistry': 'Chemie',
  'Physics': 'Physik',
  'Spacing, special characters and sizing that the palette doesn’t cover.':
    'Abstände, Sonderzeichen und Größen, die die Palette nicht abdeckt.',
  'Named colours work with \\color and \\textcolor. For any other colour, use a hex code like \\color{#E4572E} or RGB values.':
    'Benannte Farben funktionieren mit \\color und \\textcolor. Für jede andere Farbe nimm einen Hex-Code wie \\color{#E4572E} oder RGB-Werte.',
  'Frames, highlights and strike-throughs.': 'Rahmen, Hervorhebungen und Durchstreichungen.',
  'Formulas and reactions with \\ce{…} (mhchem). Numbers are subscripted, charges superscripted automatically.':
    'Formeln und Reaktionen mit \\ce{…} (mhchem). Zahlen werden automatisch tiefgestellt, Ladungen hochgestellt.',
  'Shorthand from the physics package: derivatives, vectors, brackets and quantum notation.':
    'Kurzschreibweisen aus dem physics-Paket: Ableitungen, Vektoren, Klammern und Quantenschreibweise.',
  'Full mhchem manual': 'Vollständiges mhchem-Handbuch',
  'physics package documentation': 'Dokumentation des physics-Pakets',
  'Spacing': 'Abstände',
  'Characters that need a backslash': 'Zeichen mit Backslash',
  'Growing brackets': 'Mitwachsende Klammern',
  'Fractions': 'Brüche',
  'Text and fonts inside maths': 'Text und Schriften in Formeln',
  'Aligning lines': 'Zeilen ausrichten',
  'Using colour': 'Farben verwenden',
  'Named colours': 'Benannte Farben',
  'Highlight': 'Hervorheben',
  // Right-click formatting menu
  'Formatting': 'Formatierung',
  'Italic': 'Kursiv',
  'Underline': 'Unterstrichen',
  'Font size': 'Schriftgröße',
  'Small': 'Klein',
  'Normal': 'Normal',
  'Large': 'Groß',
  'Very large': 'Sehr groß',
  'Huge': 'Riesig',
  'Text colour': 'Schriftfarbe',
  'Black': 'Schwarz',
  'Red': 'Rot',
  'Blue': 'Blau',
  'Green': 'Grün',
  'Orange': 'Orange',
  'Purple': 'Violett',
  'Grey': 'Grau',
  'Teal': 'Türkis',
  'Yellow': 'Gelb',
  'Light green': 'Hellgrün',
  'Light blue': 'Hellblau',
  'Pink': 'Rosa',
  'Light grey': 'Hellgrau',
  'Font': 'Schriftart',
  'Normal (serif)': 'Normal (Serife)',
  'Sans serif': 'Ohne Serifen',
  'Typewriter': 'Schreibmaschine',
  'Bullet point': 'Aufzählungspunkt',
  'Clear formatting': 'Formatierung entfernen',
  'Frames': 'Rahmen',
  'Formulas and ions': 'Formeln und Ionen',
  'Reactions': 'Reaktionen',
  'States and units': 'Zustände und Einheiten',
  'Derivatives': 'Ableitungen',
  'Vectors and operators': 'Vektoren und Operatoren',
  'Quantum': 'Quanten',
  'negative thin space': 'negativer schmaler Abstand',
  'thin space': 'schmaler Abstand',
  'medium space': 'mittlerer Abstand',
  'thick space': 'großer Abstand',
  'keep \\% outside \\text': '\\% außerhalb von \\text lassen',
  'fixed sizes': 'feste Größen',
  'grow to fit': 'wachsen mit',
  'one side only': 'nur eine Seite',
  'text size': 'Textgröße',
  'display size': 'Anzeigegröße',
  'continued': 'fortgesetzt',
  'slanted': 'schräg',
  'upright d': 'aufrechtes d',
  'align at &': 'an & ausrichten',
  'centred': 'zentriert',
  'colour a group': 'eine Gruppe einfärben',
  'colour one item': 'ein Element einfärben',
  'hex colour': 'Hex-Farbe',
  'RGB, 0–255': 'RGB, 0–255',
  'hex colour + padding': 'Hex-Farbe + Innenabstand',
  'border': 'Rand',
  'frame + fill': 'Rahmen + Füllung',
  'isotope': 'Isotop',
  'equilibrium': 'Gleichgewicht',
  'heat, gas': 'Wärme, Gas',
  'precipitate': 'Niederschlag',
  'units': 'Einheiten',
  'auto-sized': 'automatische Größe',

  // Saved equations
  'Saved': 'Gespeichert',
  'Save': 'Speichern',
  'Already saved': 'Bereits gespeichert',
  'Nothing to save yet': 'Noch nichts zu speichern',
  'Filter saved equations': 'Gespeicherte Formeln filtern',
  'Filter': 'Filtern',
  'No saved equations yet. Press Save to keep this one for later.':
    'Noch keine gespeicherten Formeln. Drücke „Speichern“, um diese für später aufzubewahren.',
  'No saved equation matches “{q}”.': 'Keine gespeicherte Formel passt zu „{q}“.',
  'Delete {name}': '{name} löschen',
  'Kept in this browser only, up to {n}. Accounts that sync are coming later.':
    'Nur in diesem Browser gespeichert, bis zu {n}. Konten mit Synchronisierung kommen später.',
  'Saved in this browser.': 'In diesem Browser gespeichert.',
  'Deleted.': 'Gelöscht.',
  'Undo': 'Rückgängig',
  'This browser holds up to {n} equations. Delete one to make room.':
    'Dieser Browser speichert bis zu {n} Formeln. Lösche eine, um Platz zu schaffen.',
  'This browser is not letting us save right now.': 'Dieser Browser lässt das Speichern gerade nicht zu.',
  'just now': 'gerade eben',
  '{n} min ago': 'vor {n} Min.',
  '{n} h ago': 'vor {n} Std.',
  'yesterday': 'gestern',
  '{n} days ago': 'vor {n} Tagen',

  // Symbol palette names: basics
  'superscript': 'hochgestellt',
  'subscript': 'tiefgestellt',
  'superscript and subscript': 'hoch- und tiefgestellt',
  'fraction': 'Bruch',
  'small fraction': 'kleiner Bruch',
  'square root': 'Quadratwurzel',
  'nth root': 'n-te Wurzel',
  'sum': 'Summe',
  'product': 'Produkt',
  'integral': 'Integral',
  'double integral': 'Doppelintegral',
  'contour integral': 'Kurvenintegral',
  'limit': 'Grenzwert',
  'binomial': 'Binomialkoeffizient',
  'infinity': 'unendlich',
  'partial': 'partiell',
  'nabla': 'Nabla',
  'dots': 'Punkte',
  'centred dots': 'mittige Punkte',
  'wide space': 'breiter Abstand',
  // relations
  'less than': 'kleiner als',
  'greater than': 'größer als',
  'less or equal': 'kleiner gleich',
  'greater or equal': 'größer gleich',
  'much less': 'viel kleiner',
  'much greater': 'viel größer',
  'not equal': 'ungleich',
  'equivalent': 'äquivalent',
  'approximately': 'ungefähr',
  'similar': 'ähnlich',
  'similar or equal': 'ähnlich oder gleich',
  'congruent': 'kongruent',
  'proportional': 'proportional',
  'asymptotic': 'asymptotisch',
  'precedes': 'geht voraus',
  'succeeds': 'folgt auf (Ordnung)',
  'parallel': 'parallel',
  'perpendicular': 'senkrecht',
  'divides': 'teilt',
  'defined as': 'definiert als',
  // operators
  'plus minus': 'plus minus',
  'minus plus': 'minus plus',
  'times': 'mal',
  'divide': 'geteilt',
  'dot': 'Punkt',
  'star': 'Stern',
  'circle': 'Kreis',
  'bullet': 'Aufzählungspunkt',
  'circled plus': 'Kreis-Plus',
  'circled times': 'Kreis-Mal',
  'wedge': 'Keil',
  'vee': 'umgekehrter Keil',
  'big union': 'große Vereinigung',
  'big intersection': 'großer Schnitt',
  'coproduct': 'Koprodukt',
  'big circled plus': 'großes Kreis-Plus',
  // arrows
  'left arrow': 'Pfeil links',
  'right arrow': 'Pfeil rechts',
  'left right arrow': 'Pfeil links-rechts',
  'long right arrow': 'langer Pfeil rechts',
  'long left arrow': 'langer Pfeil links',
  'maps to': 'wird abgebildet auf',
  'implied by': 'folgt aus',
  'implies': 'impliziert',
  'if and only if': 'genau dann, wenn',
  'long implies': 'lang impliziert',
  'up arrow': 'Pfeil nach oben',
  'down arrow': 'Pfeil nach unten',
  'north east arrow': 'Pfeil nach oben rechts',
  'south east arrow': 'Pfeil nach unten rechts',
  'hook right arrow': 'Hakenpfeil rechts',
  'right harpoons': 'Harpunen',
  'arrow with text': 'Pfeil mit Text',
  'tends to': 'strebt gegen',
  // greek
  'capital gamma': 'großes Gamma',
  'capital delta': 'großes Delta',
  'capital theta': 'großes Theta',
  'capital lambda': 'großes Lambda',
  'capital xi': 'großes Xi',
  'capital pi': 'großes Pi',
  'capital sigma': 'großes Sigma',
  'capital phi': 'großes Phi',
  'capital psi': 'großes Psi',
  'capital omega': 'großes Omega',
  // sets & logic
  'element of': 'Element von',
  'not element of': 'kein Element von',
  'contains': 'enthält',
  'subset': 'Teilmenge',
  'subset or equal': 'Teilmenge oder gleich',
  'superset': 'Obermenge',
  'superset or equal': 'Obermenge oder gleich',
  'union': 'Vereinigung',
  'intersection': 'Schnitt',
  'set minus': 'Mengendifferenz',
  'empty set': 'leere Menge',
  'for all': 'für alle',
  'exists': 'es existiert',
  'not exists': 'es existiert nicht',
  'not': 'nicht',
  'and': 'und',
  'or': 'oder',
  'therefore': 'also',
  'because': 'weil',
  'natural numbers': 'natürliche Zahlen',
  'integers': 'ganze Zahlen',
  'rationals': 'rationale Zahlen',
  'reals': 'reelle Zahlen',
  'complex numbers': 'komplexe Zahlen',
  'blackboard letter': 'Doppelstrich-Buchstabe',
  'calligraphic letter': 'Schreibschrift-Buchstabe',
  // brackets
  'parentheses': 'runde Klammern',
  'curly braces': 'geschweifte Klammern',
  'square brackets': 'eckige Klammern',
  'braces': 'geschweifte Klammern',
  'angle brackets': 'spitze Klammern',
  'absolute value': 'Betrag',
  'norm': 'Norm',
  'floor': 'abrunden',
  'ceiling': 'aufrunden',
  'cases': 'Fallunterscheidung',
  'overbrace': 'obere Klammer',
  'underbrace': 'untere Klammer',
  // accents
  'hat': 'Dach',
  'wide hat': 'breites Dach',
  'bar': 'Querstrich',
  'overline': 'Überstrich',
  'vector': 'Vektor',
  'arrow over': 'Pfeil darüber',
  'double dot': 'zwei Punkte',
  'tilde': 'Tilde',
  'underline': 'Unterstrich',
  'prime': 'Strich',
  'cancel': 'durchstreichen',
  // functions, style
  'log base': 'Logarithmus zur Basis',
  'custom operator': 'eigener Operator',
  'text': 'Text',
  'bold': 'fett',
  'bold symbol': 'fettes Symbol',
  'italic': 'kursiv',
  'roman': 'aufrecht',
  'display style': 'Anzeigestil',
  'boxed': 'umrahmt',
  'red': 'rot',
  'blue': 'blau',
  'green': 'grün',
  'orange': 'orange',
  'purple': 'lila',
  'teal': 'türkis',
  'gray': 'grau',
  'highlight': 'Hervorhebung',
  'size tiny': 'Größe winzig',
  'size small': 'Größe klein',
  'size large': 'Größe groß',
  'size Large': 'Größe größer',
  'size huge': 'Größe riesig',

  // Landing page
  'Skip to content': 'Zum Inhalt springen',
  'Open the editor': 'Zum Editor',
  'The Equadeck editor: a symbol palette, the LaTeX for the quadratic formula, its rendered preview, and export buttons.':
    'Der Equadeck-Editor: eine Symbolpalette, das LaTeX der Mitternachtsformel, die Vorschau und Export-Schaltflächen.',
  'Equations for your slides and documents': 'Formeln für deine Folien und Dokumente',
  'Type LaTeX, see it instantly, and paste a crisp, editable equation into Word, PowerPoint, Keynote or Google Slides. Free, no sign-up.':
    'Tippe LaTeX, sieh es sofort und füge eine gestochen scharfe, bearbeitbare Formel in Word, PowerPoint, Keynote oder Google Slides ein. Kostenlos, ohne Anmeldung.',
  'Equation tools make you fight them': 'Formel-Tools machen es dir schwer',
  'Getting maths into a deck or a document is a fight.': 'Mathe in eine Präsentation oder ein Dokument zu bekommen, ist mühsam.',
  'You end up with screenshots, blurry images or an add-in you didn’t want.':
    'Am Ende hast du Screenshots, unscharfe Bilder oder ein Add-in, das du nicht wolltest.',
  'Many want something from you first.': 'Viele wollen erst etwas von dir.',
  'An account before you can save, a weekly limit, or ads around your work.':
    'Ein Konto, bevor du speichern kannst, ein Wochenlimit oder Werbung rund um deine Arbeit.',
  'How it works': 'So funktioniert es',
  'Type or click': 'Tippen oder klicken',
  'LaTeX with autocomplete, a palette you can search, or start from an example.':
    'LaTeX mit Autovervollständigung, eine durchsuchbare Palette oder der Start mit einem Beispiel.',
  'See it instantly': 'Sofort sehen',
  'A live preview, and a plain explanation when something is off.':
    'Eine Live-Vorschau und eine verständliche Erklärung, wenn etwas nicht stimmt.',
  'Paste it anywhere': 'Überall einfügen',
  'Copy for Word or PowerPoint as an editable equation, or save a PNG, SVG or PDF.':
    'Für Word oder PowerPoint als bearbeitbare Formel kopieren oder als PNG, SVG oder PDF speichern.',
  'What you get': 'Das bekommst du',
  'Copy for Word and PowerPoint': 'Kopieren für Word und PowerPoint',
  'Pastes as a real equation you can still edit, not a picture.': 'Wird als echte, bearbeitbare Formel eingefügt, nicht als Bild.',
  'Know what LaTeX needs': 'Wissen, was LaTeX braucht',
  'See which packages your equation uses, and copy it with the \\usepackage lines.':
    'Sieh, welche Pakete deine Formel nutzt, und kopiere sie mit den \\usepackage-Zeilen.',
  'No account, no ads, no limits': 'Kein Konto, keine Werbung, keine Limits',
  'Save up to 50 equations in your browser without signing up.': 'Speichere bis zu 50 Formeln im Browser, ganz ohne Anmeldung.',
  'Crisp exports': 'Gestochen scharfe Exporte',
  'PNG at up to 4×, SVG and PDF, in dark ink even if you work in dark mode.':
    'PNG mit bis zu 4×, SVG und PDF, in dunkler Schrift, auch wenn du im Dunkelmodus arbeitest.',
  'Faster typing': 'Schneller tippen',
  'Autocomplete for about 200 commands and a symbol palette you can search.':
    'Autovervollständigung für rund 200 Befehle und eine durchsuchbare Symbolpalette.',
  'Works on your phone': 'Funktioniert auf dem Handy',
  'A real mobile layout, not a shrunken desktop page.': 'Ein echtes Mobil-Layout, keine verkleinerte Desktop-Seite.',
  'Also included: a matrix builder, examples, and reference sheets for spacing, colours, boxes, chemistry and physics.':
    'Außerdem dabei: ein Matrix-Baukasten, Beispiele und Referenzblätter für Abstände, Farben, Rahmen, Chemie und Physik.',
  'Pricing': 'Preise',
  'Free': 'Kostenlos',
  'For anyone writing an equation': 'Für alle, die eine Formel schreiben',
  'Everything above: editor, every export, Copy for Word': 'Alles oben Genannte: Editor, jeder Export, Für Word kopieren',
  'Up to 50 equations saved in your browser': 'Bis zu 50 Formeln im Browser gespeichert',
  'No account, no ads, no weekly limits': 'Kein Konto, keine Werbung, keine Wochenlimits',
  'Pro': 'Pro',
  'For people who use it every week, on more than one device': 'Für alle, die es jede Woche nutzen, auf mehr als einem Gerät',
  'a month, or $30 a year': 'im Monat oder 30 $ im Jahr',
  'Your saved equations on every device': 'Deine gespeicherten Formeln auf jedem Gerät',
  'Full history, unlimited saves': 'Vollständiger Verlauf, unbegrenztes Speichern',
  'Not available yet': 'Noch nicht verfügbar',
  'Questions': 'Fragen',
  'Does it cost anything?': 'Kostet es etwas?',
  'No. Everything on this page is free. If we add paid sync later, nothing free goes away.':
    'Nein. Alles auf dieser Seite ist kostenlos. Falls wir später kostenpflichtige Synchronisierung hinzufügen, fällt nichts Kostenloses weg.',
  'Do I need an account?': 'Brauche ich ein Konto?',
  'No. Your current equation and up to 50 saved ones stay in this browser.':
    'Nein. Deine aktuelle Formel und bis zu 50 gespeicherte bleiben in diesem Browser.',
  'Is my work sent anywhere?': 'Wird meine Arbeit irgendwohin gesendet?',
  'No. Equations are drawn in your browser; nothing you type leaves your device.':
    'Nein. Formeln werden in deinem Browser gezeichnet; nichts, was du tippst, verlässt dein Gerät.',
  'Does “Copy for Word” really give an editable equation?': 'Ergibt „Für Word kopieren“ wirklich eine bearbeitbare Formel?',
  'It puts MathML on your clipboard, which Word and PowerPoint turn into their own equations when you paste. For Google Docs and Slides, use Copy image.':
    'Es legt MathML in die Zwischenablage, das Word und PowerPoint beim Einfügen in eigene Formeln umwandeln. Für Google Docs und Slides nimm „Bild kopieren“.',
  'Which LaTeX does it understand?': 'Welches LaTeX versteht es?',
  'The maths most people write: amsmath, symbols, matrices, colours and boxes, plus chemistry (mhchem) and physics notation.':
    'Die Mathe, die die meisten schreiben: amsmath, Symbole, Matrizen, Farben und Rahmen, dazu Chemie (mhchem) und Physik-Schreibweise.',
  'Can I bring equations from other tools?': 'Kann ich Formeln aus anderen Tools mitbringen?',
  'Yes. Most equation tools can give you their LaTeX; paste it in.':
    'Ja. Die meisten Formel-Tools können dir ihr LaTeX geben; füge es einfach ein.',
  'Your next equation is one paste away': 'Deine nächste Formel ist nur einen Einfügevorgang entfernt',

  // Command names (palette tooltips, symbol search, autocomplete)
  'alpha': 'Alpha', 'beta': 'Beta', 'gamma': 'Gamma', 'delta': 'Delta', 'epsilon': 'Epsilon',
  'varepsilon': 'Epsilon (Variante)', 'zeta': 'Zeta', 'eta': 'Eta', 'theta': 'Theta', 'vartheta': 'Theta (Variante)',
  'iota': 'Jota', 'kappa': 'Kappa', 'lambda': 'Lambda', 'mu': 'My', 'nu': 'Ny', 'xi': 'Xi', 'pi': 'Pi', 'rho': 'Rho',
  'sigma': 'Sigma', 'tau': 'Tau', 'upsilon': 'Ypsilon', 'phi': 'Phi', 'varphi': 'Phi (Variante)', 'chi': 'Chi',
  'psi': 'Psi', 'omega': 'Omega',
  'sin': 'Sinus', 'cos': 'Kosinus', 'tan': 'Tangens', 'cot': 'Kotangens', 'sec': 'Sekans', 'csc': 'Kosekans',
  'arcsin': 'Arkussinus', 'arccos': 'Arkuskosinus', 'arctan': 'Arkustangens',
  'sinh': 'Sinus hyperbolicus', 'cosh': 'Kosinus hyperbolicus', 'tanh': 'Tangens hyperbolicus', 'coth': 'Kotangens hyperbolicus',
  'ln': 'natürlicher Logarithmus', 'log': 'Logarithmus', 'lg': 'Zehnerlogarithmus', 'exp': 'Exponentialfunktion',
  'det': 'Determinante', 'dim': 'Dimension', 'ker': 'Kern', 'deg': 'Grad', 'gcd': 'ggT (größter gemeinsamer Teiler)',
  'arg': 'Argument', 'Pr': 'Wahrscheinlichkeit', 'max': 'Maximum', 'min': 'Minimum', 'sup': 'Supremum', 'inf': 'Infimum',
  'limsup': 'Limes superior', 'liminf': 'Limes inferior',
  'aligned lines': 'ausgerichtete Zeilen', 'matrix': 'Matrix', 'growing parentheses': 'mitwachsende Klammern',
  'display fraction': 'großer Bruch', 'upright': 'aufrecht', 'colour': 'Farbe', 'chemistry': 'Chemie',
  'derivative': 'Ableitung', 'partial derivative': 'partielle Ableitung', 'bold vector': 'fetter Vektor',
  'ket': 'Ket', 'bra': 'Bra',

  'Formula: type a word for symbols · Tab next box · Esc back to text': 'Formel: Wort tippen für Zeichen · Tab nächstes Kästchen · Esc zurück zum Text',

  'Show the ribbon': 'Menüband einblenden', 'Hide the ribbon (more room for the page)': 'Menüband ausblenden (mehr Platz fürs Blatt)',
  'Keyboard shortcuts (F1)': 'Tastenkürzel (F1)', 'Keyboard shortcuts': 'Tastenkürzel',
  'Type a word': 'Wort tippen', 'opens the list of symbols (summe, äquivalent, bruch …)': 'öffnet die Liste der Zeichen (summe, äquivalent, bruch …)',
  'Enter / Tab': 'Enter / Tab', 'takes the chosen symbol': 'übernimmt das gewählte Zeichen', 'picks another suggestion': 'wählt einen anderen Vorschlag',
  'typed in the text become a formula by themselves': 'im Text getippt, werden von selbst zur Formel',
  'Alt+= or Ctrl+M': 'Alt+= oder Strg+M', 'starts an empty formula': 'startet eine leere Formel',
  'in a formula: fraction, power, index': 'in einer Formel: Bruch, Hochzahl, Index', 'in a formula: next box': 'in einer Formel: nächstes Kästchen',
  'closes the list, or leaves the formula': 'schließt die Liste oder verlässt die Formel',
  'removes a formula next to the cursor at once': 'löscht eine Formel neben dem Cursor auf einmal',
  'Ctrl+B / I / U': 'Strg+B / I / U', 'bold, italic, underline': 'fett, kursiv, unterstrichen', 'Ctrl+Z / Ctrl+Y': 'Strg+Z / Strg+Y',
  'undo, redo': 'rückgängig, wiederholen', 'Ctrl+P': 'Strg+P', 'print or save as PDF': 'drucken oder als PDF speichern',
  'Voice input': 'Spracheingabe', 'Voice input (F8)': 'Spracheingabe (F8)', 'Stop': 'Stopp', 'Allow and start': 'Erlauben und starten',
  'Listening… Say "formula" to dictate maths.': 'Ich höre zu… Sag „Formel“ für Mathematik.',
  'on this device': 'auf diesem Gerät', 'via your browser': 'über deinen Browser',
  'Your browser turns your speech into text. It may send the sound to its maker for this (Chrome: Google, Safari: Apple). Equadeck itself gets and stores no sound.':
    'Dein Browser macht aus Sprache Text. Dafür kann er die Aufnahme an seinen Hersteller senden (Chrome: Google, Safari: Apple). Equadeck selbst bekommt und speichert keine Aufnahme.',
  'This browser can also do it on your device, after downloading a language pack once.': 'Dieser Browser kann das auch auf deinem Gerät, nachdem einmal ein Sprachpaket geladen wurde.',
  'Only on this device': 'Nur auf diesem Gerät', 'Downloading…': 'Wird geladen…', 'The language pack could not be downloaded.': 'Das Sprachpaket konnte nicht geladen werden.',
  'The microphone is blocked. Allow it in the address bar of your browser.': 'Das Mikrofon ist gesperrt. Erlaube es in der Adressleiste deines Browsers.',
  'No microphone found.': 'Kein Mikrofon gefunden.', 'Voice input needs an internet connection.': 'Die Spracheingabe braucht eine Internetverbindung.',
  'This browser cannot recognise this language.': 'Dieser Browser erkennt diese Sprache nicht.',
  'Voice input stopped. Please try again.': 'Die Spracheingabe wurde beendet. Bitte versuch es noch einmal.',
  'Voice input is off: nothing was said for a minute.': 'Spracheingabe aus: eine Minute lang wurde nichts gesagt.',
  'voice input on or off': 'Spracheingabe ein oder aus', 'Say: formula …': 'Sag: Formel …',
  'a formula, e.g. “formula x squared plus one”; “end” closes a long fraction or root': 'eine Formel, z. B. „Formel x hoch zwei plus eins“; „Ende“ schließt einen langen Bruch oder eine Wurzel',
  'Say: new line, undo': 'Sag: neue Zeile, rückgängig', 'also: formula, end formula, stop dictation': 'auch: Formel, Formel Ende, Diktat beenden',
  'Number formulas': 'Formeln nummerieren', 'Formulas on their own line get (1), (2) …': 'Formeln in eigener Zeile bekommen (1), (2) …',
  'Recognise maths': 'Mathe erkennen', 'x^2, a_n, 1/2 and => typed in the text become formulas': 'x^2, a_n, 1/2 und => im Text werden zu Formeln',
  'Matrix size': 'Matrixgröße', 'Row below (matrix, cases)': 'Zeile darunter (Matrix, Fallunterscheidung)',
  '{rows} rows × {cols} columns': '{rows} Zeilen × {cols} Spalten', 'Index': 'Index',
  'Suggestions in the text': 'Vorschläge im Text',
  'Typing a word like "summe" or "äquivalent" offers the symbol': 'Ein Wort wie „summe" oder „äquivalent" bietet das Zeichen an',
  'Templates': 'Vorlagen', 'Worksheet': 'Arbeitsblatt', 'Notes': 'Mitschrift', 'Homework': 'Hausaufgabe',
  'Table': 'Tabelle', 'Table with 3 rows and 3 columns': 'Tabelle mit 3 Zeilen und 3 Spalten', 'Row below': 'Zeile darunter',
  'Column to the right': 'Spalte rechts', 'Delete row': 'Zeile löschen', 'Delete column': 'Spalte löschen', 'Delete table': 'Tabelle löschen',
  'Backup': 'Sicherung', 'Save backup': 'Sicherung speichern', 'Load backup': 'Sicherung laden',
  'All documents in one file, to keep safe or move to another device': 'Alle Dokumente in einer Datei, zum Aufbewahren oder für ein anderes Gerät',
  'Backup saved. Keep the file somewhere safe.': 'Sicherung gespeichert. Bewahre die Datei gut auf.',
  'This is not an Equadeck backup file.': 'Das ist keine Equadeck-Sicherung.',
  'Backup loaded: {added} new, {updated} updated.': 'Sicherung geladen: {added} neu, {updated} aktualisiert.',

  // Export (/doc, phase 3)
  'Save as PDF': 'Als PDF speichern', 'Download for Word': 'Für Word herunterladen',
  'In the print window choose "Save as PDF".': 'Wähle im Druckfenster „Als PDF speichern".',
  'Making the Word file…': 'Word-Datei wird erstellt…', 'Saved for Word. Formulas stay editable there.': 'Für Word gespeichert. Die Formeln bleiben dort bearbeitbar.',
  'Could not make the Word file.': 'Die Word-Datei konnte nicht erstellt werden.',

  // Formulas on the page (/doc, phase 2)
  'Formula in the text (Alt+=)': 'Formel im Text (Alt+=)', 'On its own line': 'Eigene Zeile', 'Structures': 'Strukturen',
  'Fraction': 'Bruch', 'Root': 'Wurzel', 'Power': 'Hochzahl', 'Integral': 'Integral', 'Sum': 'Summe', 'Limit': 'Grenzwert',
  'Cases': 'Fallunterscheidung', 'approximately equal': 'ungefähr gleich', 'not an element of': 'kein Element von',
  'there exists': 'es existiert', 'real numbers': 'reelle Zahlen', 'Delta': 'Delta (groß)',

  // Document view (/doc)
  'Document': 'Dokument', 'Single formula': 'Einzelne Formel', 'Ribbon': 'Menüband',
  'File': 'Datei', 'Home': 'Start', 'Layout': 'Layout', 'View': 'Ansicht',
  'New': 'Neu', 'Open': 'Öffnen', 'Rename': 'Umbenennen', 'Duplicate': 'Duplizieren', 'Share': 'Weitergeben',
  'Print': 'Drucken', 'Download HTML': 'Als HTML herunterladen', 'Coming soon': 'Kommt bald',
  'Redo (Ctrl+Y)': 'Wiederholen (Strg+Y)', 'Default': 'Standard',
  'Bold (Ctrl+B)': 'Fett (Strg+B)', 'Italic (Ctrl+I)': 'Kursiv (Strg+I)', 'Underline (Ctrl+U)': 'Unterstrichen (Strg+U)',
  'Strikethrough': 'Durchgestrichen', 'Colour': 'Farbe', 'Automatic colour': 'Automatische Farbe', 'No highlight': 'Keine Hervorhebung',
  'Paragraph': 'Absatz', 'Heading 1': 'Überschrift 1', 'Heading 2': 'Überschrift 2', 'Heading 3': 'Überschrift 3',
  'Bullet list': 'Aufzählung', 'Numbered list': 'Nummerierung', 'Align left': 'Linksbündig', 'Centre': 'Zentriert',
  'Align right': 'Rechtsbündig', 'Justify': 'Blocksatz', 'Page break': 'Seitenumbruch', 'Horizontal line': 'Horizontale Linie',
  'Formula': 'Formel', 'Coming in the next update': 'Kommt im nächsten Update', 'Paper': 'Papier', 'Blank': 'Leer',
  'Squared': 'Kariert', 'Lined': 'Liniert', 'Margins': 'Seitenränder', 'Narrow': 'Schmal', 'Wide': 'Breit',
  'Orientation': 'Ausrichtung', 'Portrait': 'Hochformat', 'Landscape': 'Querformat', 'Zoom': 'Zoom', 'Zoom out': 'Verkleinern',
  'Zoom in': 'Vergrößern', 'Page width': 'Seitenbreite', 'Appearance': 'Darstellung', 'Dark mode': 'Dunkler Modus',
  'Your documents': 'Deine Dokumente', 'Untitled document': 'Unbenanntes Dokument',
  'Start typing…': 'Schreib einfach los…', 'Document text': 'Dokumenttext', 'Document title': 'Dokumenttitel',
  'Saved in this browser': 'In diesem Browser gespeichert', 'Page': 'Seite',
  'Delete "{name}"? This cannot be undone.': '„{name}" löschen? Das kann nicht rückgängig gemacht werden.', 'copy': 'Kopie',
  'Page {page} of {pages}': 'Seite {page} von {pages}', '{n} words': '{n} Wörter', 'Zoom level': 'Zoomstufe',
  'dot accent': 'Punkt darüber', 'colour from here': 'Farbe ab hier',
  'Readable commands (\\ElementOf instead of \\in)': 'Lesbare Befehle (\\ElementVon statt \\in)',
  'Words as text (no \\text needed)': 'Wörter als Text (ohne \\text)',
};

const KEY = 'lx.lang';

function initialLang(): Lang {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'de' || s === 'en') return s;
  } catch {
    /* private mode: fall through to the browser language */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

let current: Lang = initialLang();
const listeners = new Set<() => void>();

function applyToDocument() {
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}
applyToDocument();

export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
  applyToDocument();
  listeners.forEach((l) => l());
}

export function getLang(): Lang {
  return current;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function fill(text: string, vars?: Vars): string {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}

/** Translate `text` (an English string) into `lang`, filling {placeholders}. */
export function tr(text: string, lang: Lang, vars?: Vars): string {
  return fill(lang === 'de' ? (DE[text] ?? text) : text, vars);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

export type TFn = (text: string, vars?: Vars) => string;

export function useT(): TFn {
  const lang = useLang();
  return useCallback((text, vars) => tr(text, lang, vars), [lang]);
}
