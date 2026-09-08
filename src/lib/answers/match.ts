/**
 * Wortbasierte Ähnlichkeitssuche für deutsche Kundenfragen.
 *
 * Bewusst ohne Bibliothek: Zeichenketten-Suche (Fuse.js und Verwandte) scheitert
 * hier systematisch, weil "was kostet das" und das Stichwort "preis" keinen
 * einzigen Buchstaben teilen. Gebraucht wird Wortabgleich mit Tippfehlertoleranz,
 * und das sind ein paar Dutzend Zeilen.
 */

/** Füllwörter, die nichts über das Anliegen aussagen. */
const STOPWORDS = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
  "und", "oder", "aber", "auch", "noch", "schon", "denn", "doch", "mal", "so", "wie", "was",
  "wer", "wo", "ist", "sind", "war", "waren", "bin", "bist", "seid", "hat", "habe", "haben",
  "hab", "kann", "koennen", "koennte", "muss", "muessen", "soll", "sollen", "will", "wollen",
  "wird", "werden", "wurde", "ich", "du", "sie", "er", "es", "wir", "ihr", "mich", "mir",
  "mein", "meine", "meinem", "meinen", "ihre", "ihren", "euer", "eure", "man", "sich",
  "in", "im", "an", "am", "auf", "aus", "bei", "mit", "nach", "von", "vom", "zu", "zum",
  "zur", "fuer", "ueber", "unter", "vor", "durch", "gibt", "geht", "bitte", "danke", "hallo",
  "guten", "tag", "eigentlich", "denn", "etwa", "nicht", "kein", "keine", "nur", "dann",
  "wenn", "dass", "als", "wieder", "sehr", "viel", "mehr", "gut", "ok", "okay",
]);

export function tokenize(normalized: string): string[] {
  return normalized
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** Levenshtein-Distanz mit früher Abbruchgrenze. */
export function levenshtein(a: string, b: string, max = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Ähnlichkeit zwischen einem Fragewort und einem Begriff des Eintrags, 0 bis 1.
 *
 * Die Richtung zählt, deshalb ist die Funktion NICHT symmetrisch:
 * Ist das Fragewort das speziellere ("fensterreinigung" enthält "reinigung"),
 * hat der Kunde nach etwas Engerem gefragt als der Eintrag abdeckt — ein
 * schwaches Signal. Umgekehrt ("fenster" trifft "fensterreinigung") hat er das
 * Thema des Eintrags benannt, nur kürzer — ein starkes Signal.
 *
 * @param queryWord Wort aus der Kundenfrage
 * @param term Begriff aus der Wissensbasis
 */
export function wordSimilarity(queryWord: string, term: string): number {
  if (queryWord === term) return 1;

  const short = queryWord.length <= term.length ? queryWord : term;
  const long = queryWord.length <= term.length ? term : queryWord;

  // Beugung: "buero" / "bueros", "bezahle" / "bezahlen"
  if (short.length >= 4 && long.startsWith(short)) {
    const gedehnt = long.length - short.length <= 4;
    // Frageseite länger heisst spezifischer: "fensterputzen" gegen "fenster"
    if (long === queryWord) return gedehnt ? 0.75 : 0.5;
    return gedehnt ? 0.9 : 0.75;
  }

  // Zusammensetzung mitten im Wort
  if (short.length >= 5 && long.includes(short)) {
    return long === queryWord ? 0.45 : 0.8;
  }

  const dist = levenshtein(queryWord, term, 2);
  if (dist === 1 && short.length >= 5) return 0.75;
  if (dist === 2 && short.length >= 7) return 0.6;
  return 0;
}

export interface ScoreTarget {
  /** Gewichtete Begriffe des Eintrags: Stichwörter schwerer als Fragewörter. */
  terms: Array<{ token: string; weight: number }>;
  /** Stichwortphrasen für den Direkttreffer im Satz, mit eigenem Gewicht. */
  phrases: Array<{ text: string; weight: number }>;
}

/**
 * Seltenheitsgewicht eines Wortes (inverse Dokumentfrequenz).
 *
 * Ohne das gewinnt "kostet" gegen "fensterreinigung", weil beide gleich zählen —
 * und die Frage "was kostet Fensterreinigung" bekommt die allgemeine
 * Preisauskunft statt der richtigen. Ein Wort, das in einem einzigen Eintrag
 * vorkommt, ist aussagekräftiger als eines, das überall steht.
 *
 * @param documentFrequency in wie vielen Einträgen das Wort vorkommt
 * @param total Anzahl Einträge insgesamt
 * @returns Faktor zwischen 0 und 1; 1 für ein einzigartiges Wort
 */
export function rarity(documentFrequency: number, total: number): number {
  if (total <= 1) return 1;
  return Math.log(1 + total / Math.max(1, documentFrequency)) / Math.log(1 + total);
}

export interface ScoreResult {
  /** Normalisiert auf die Fragelänge, grob 0 bis 1. */
  score: number;
  /** Summe aller Treffer — misst absolute Evidenz. */
  evidence: number;
  /**
   * Stärkster Einzeltreffer. Entscheidet die Rangfolge vor der Summe:
   * Wer dem Kunden ein seltenes Wort wörtlich zurückgibt, gewinnt gegen
   * einen Eintrag, der nur viele Allerweltswörter einsammelt.
   */
  peak: number;
  /** Wie viele Fragewörter überhaupt etwas getroffen haben. */
  matchedTokens: number;
}

/**
 * Bewertet, wie gut ein Eintrag zu den Fragewörtern passt.
 *
 * Zwei Maße statt einem: `score` bestraft lange Fragen mit wenig Treffern,
 * `evidence` erkennt trotzdem den Fall "zwei sehr starke Treffer in einem
 * langen Satz". Ein Eintrag gilt als Treffer, wenn eines von beiden reicht.
 */
export function scoreEntry(queryTokens: string[], target: ScoreTarget, query: string): ScoreResult {
  if (queryTokens.length === 0) return { score: 0, evidence: 0, peak: 0, matchedTokens: 0 };

  let evidence = 0;
  let peak = 0;
  let matchedTokens = 0;

  for (const qt of queryTokens) {
    let best = 0;
    for (const term of target.terms) {
      const sim = wordSimilarity(qt, term.token) * term.weight;
      if (sim > best) best = sim;
      if (best >= 1) break;
    }
    if (best > 0) {
      evidence += best;
      if (best > peak) peak = best;
      matchedTokens++;
    }
  }

  // Mehrwortphrase wörtlich im Satz: starkes Signal ("wie lange", "zu hause").
  // Auch hier zählt Seltenheit — "was kostet" steht in halben Wissensbasis.
  for (const phrase of target.phrases) {
    if (phrase.text.includes(" ") && query.includes(phrase.text)) evidence += phrase.weight;
  }

  return { score: evidence / queryTokens.length, evidence, peak, matchedTokens };
}
