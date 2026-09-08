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
 * Ähnlichkeit zweier Wörter, 0 bis 1.
 * Deckt die drei Fälle ab, die im Deutschen zählen: identisch, gebeugt
 * ("bezahle" / "bezahlen"), und vertippt.
 */
export function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;

  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;

  // Beugung und Zusammensetzung: "buero" in "bueros", "reinig" in "reinigung"
  if (short.length >= 4 && long.startsWith(short)) {
    return long.length - short.length <= 4 ? 0.9 : 0.75;
  }
  // Zusammengesetzte Wörter: "fensterputzen" enthält "fenster"
  if (short.length >= 5 && long.includes(short)) return 0.8;

  const dist = levenshtein(a, b, 2);
  if (dist === 1 && short.length >= 5) return 0.75;
  if (dist === 2 && short.length >= 7) return 0.6;
  return 0;
}

export interface ScoreTarget {
  /** Gewichtete Begriffe des Eintrags: Stichwörter schwerer als Fragewörter. */
  terms: Array<{ token: string; weight: number }>;
  /** Vollständige Stichwortphrasen für den Direkttreffer im Satz. */
  phrases: string[];
}

export interface ScoreResult {
  /** Normalisiert auf die Fragelänge, grob 0 bis 1. */
  score: number;
  /** Ungewichtete Summe der Treffer — misst absolute Evidenz. */
  evidence: number;
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
  if (queryTokens.length === 0) return { score: 0, evidence: 0, matchedTokens: 0 };

  let evidence = 0;
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
      matchedTokens++;
    }
  }

  // Mehrwortphrase wörtlich im Satz: starkes Signal ("was kostet", "wie lange")
  for (const phrase of target.phrases) {
    if (phrase.includes(" ") && query.includes(phrase)) evidence += 0.8;
  }

  return { score: evidence / queryTokens.length, evidence, matchedTokens };
}
