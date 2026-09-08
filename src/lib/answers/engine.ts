import { business } from "@/config/business";
import { KNOWLEDGE, type AnswerAction, type KnowledgeEntry } from "./knowledge";
import { rarity, scoreEntry, tokenize, type ScoreTarget } from "./match";

export type AnswerKind = "antwort" | "rueckfrage" | "weiterleitung";

export interface AnswerResult {
  kind: AnswerKind;
  /** Der Text, der dem Kunden angezeigt wird. Nie leer. */
  text: string;
  /** Genutzter Wissenseintrag, falls es einen klaren Treffer gab. */
  matched?: KnowledgeEntry;
  /** Weitere passende Fragen zum Anklicken. */
  suggestions: KnowledgeEntry[];
  /** Handlungsangebote — mindestens eines ist immer dabei. */
  actions: AnswerAction[];
  /** 0–1, nur für interne Auswertung. */
  confidence: number;
}

/** Umlaute falten und Satzzeichen entfernen, damit "Wieviel?" und "wie viel" gleich treffen. */
export function normalize(input: string): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Suchindex einmalig beim Laden aufbauen — danach ist jede Anfrage reine Rechenarbeit. */
interface IndexedEntry {
  entry: KnowledgeEntry;
  target: ScoreTarget;
}

/** Erster Durchgang: Begriffe je Eintrag sammeln. */
const RAW = KNOWLEDGE.map((entry) => {
  const terms = new Map<string, number>();
  const phrases: string[] = [];

  const add = (token: string, weight: number) => {
    if (token.length < 3) return;
    terms.set(token, Math.max(terms.get(token) ?? 0, weight));
  };

  for (const keyword of entry.keywords) {
    const norm = normalize(keyword);
    phrases.push(norm);
    for (const token of norm.split(" ")) add(token, 1);
  }
  // Wörter aus der Musterfrage zählen mit, aber schwächer.
  for (const token of tokenize(normalize(entry.question))) add(token, 0.55);

  return { entry, terms, phrases };
});

/** Zweiter Durchgang: in wie vielen Einträgen kommt jedes Wort vor? */
const DOC_FREQUENCY = new Map<string, number>();
for (const { terms } of RAW) {
  for (const token of terms.keys()) {
    DOC_FREQUENCY.set(token, (DOC_FREQUENCY.get(token) ?? 0) + 1);
  }
}

const weightOf = (token: string) => rarity(DOC_FREQUENCY.get(token) ?? 1, RAW.length);

/**
 * Dritter Durchgang: Gewichte mit der Seltenheit multiplizieren.
 *
 * Dadurch schlägt "fensterreinigung" (ein Eintrag) das Wort "kostet"
 * (viele Einträge) — ohne diese Stufe beantwortet die Engine die Frage
 * "was kostet Fensterreinigung" mit dem allgemeinen Stundenpreis, obwohl
 * Fenster darin gerade nicht enthalten sind.
 */
const INDEX: IndexedEntry[] = RAW.map(({ entry, terms, phrases }) => ({
  entry,
  target: {
    terms: [...terms].map(([token, weight]) => ({ token, weight: weight * weightOf(token) })),
    phrases: phrases.map((text) => ({
      text,
      // Eine Phrase ist höchstens so aussagekräftig wie ihr häufigstes Wort.
      weight:
        0.8 *
        Math.min(...text.split(" ").filter((w) => w.length >= 3).map(weightOf).concat(1)),
    })),
  },
}));

/** Schwellen, kalibriert gegen die Fragensammlung in engine.test.ts. */
const DIRECT_SCORE = 0.42;
const DIRECT_EVIDENCE = 1.6;
const WEAK_SCORE = 0.2;
const WEAK_EVIDENCE = 0.7;

/** Diese Kanäle stehen immer zur Verfügung — sie sind die Antwortgarantie. */
function fallbackActions(): AnswerAction[] {
  // Das Rückrufformular funktioniert immer. Telefon und WhatsApp kommen erst
  // dazu, sobald die Nummern hinterlegt sind — ein leerer tel:-Link wäre eine
  // tote Schaltfläche und würde die Antwortgarantie aushöhlen.
  const actions: AnswerAction[] = [{ label: "Rückruf anfordern", href: "/kontakt" }];
  if (business.contact.phone) {
    actions.push({
      label: `Anrufen ${business.contact.phone}`,
      href: `tel:${business.contact.phone.replace(/\s/g, "")}`,
    });
  }
  if (business.contact.whatsapp) {
    actions.push({ label: "WhatsApp", href: `https://wa.me/${business.contact.whatsapp}` });
  }
  return actions;
}

/** Häufigste Fragen — Startzustand des Assistenten und Notnagel bei leerer Eingabe. */
export function topQuestions(limit = 5): KnowledgeEntry[] {
  const order = [
    "preis-allgemein",
    "preis-abo",
    "leistung-inklusive",
    "termin-gebiet",
    "preis-fenster",
  ];
  return order
    .map((id) => KNOWLEDGE.find((e) => e.id === id))
    .filter((e): e is KnowledgeEntry => Boolean(e))
    .slice(0, limit);
}

/**
 * Beantwortet eine Kundenfrage.
 *
 * Vertrag: Diese Funktion gibt IMMER ein Ergebnis mit nicht-leerem Text und
 * mindestens einer Handlungsoption zurück. Sie wirft nicht und antwortet nie
 * mit einem blossen "weiss ich nicht" — im schlechtesten Fall leitet sie an
 * einen Menschen weiter. Kein Netzwerkaufruf, kein Sprachmodell, keine Kosten,
 * kein Rate-Limit, keine Halluzination.
 */
export function answer(rawQuestion: string): AnswerResult {
  const query = normalize(rawQuestion);
  const tokens = tokenize(query);

  if (query.length < 2 || tokens.length === 0) {
    return {
      kind: "rueckfrage",
      text: "Fragen Sie einfach los — zum Beispiel nach Preis, Ablauf oder freien Terminen.",
      suggestions: topQuestions(),
      actions: fallbackActions(),
      confidence: 0,
    };
  }

  const ranked = INDEX.map(({ entry, target }) => ({
    entry,
    ...scoreEntry(tokens, target, query),
  }))
    .filter((r) => r.evidence > 0)
    .sort((a, b) => b.peak - a.peak || b.evidence - a.evidence || b.score - a.score);

  const best = ranked[0];

  // Klarer Treffer: hohe relative Passung oder starke absolute Evidenz.
  if (best && (best.score >= DIRECT_SCORE || best.evidence >= DIRECT_EVIDENCE)) {
    const entry = best.entry;
    const actions = entry.action ? [entry.action] : [];
    return {
      kind: "antwort",
      text: entry.answer,
      matched: entry,
      suggestions: ranked.slice(1, 4).map((r) => r.entry),
      actions: [...actions, ...fallbackActions()].slice(0, 3),
      confidence: Math.min(1, best.score),
    };
  }

  // Unsicher: nicht raten, sondern die passenden Fragen zur Auswahl stellen.
  const weak = ranked.filter((r) => r.score >= WEAK_SCORE || r.evidence >= WEAK_EVIDENCE);
  if (weak.length > 0) {
    return {
      kind: "rueckfrage",
      text:
        weak.length === 1
          ? "Meinen Sie diese Frage?"
          : "Dazu habe ich mehrere passende Antworten — welche davon meinen Sie?",
      suggestions: weak.slice(0, 4).map((r) => r.entry),
      actions: fallbackActions(),
      confidence: Math.min(1, best?.score ?? 0),
    };
  }

  // Kein Treffer: garantierte Weiterleitung an einen Menschen, niemals eine Sackgasse.
  return {
    kind: "weiterleitung",
    text: `Diese Frage kann ich nicht sicher beantworten, und raten möchte ich nicht. Schreiben Sie sie uns kurz auf — ${business.responsePromise}.`,
    suggestions: topQuestions(3),
    actions: fallbackActions(),
    confidence: 0,
  };
}
