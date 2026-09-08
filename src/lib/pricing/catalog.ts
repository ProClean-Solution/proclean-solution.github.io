import type { ExtraId, Frequency, ObjectType, Tariff } from "./types";

/**
 * Preise ProClean Solution. Alle Beträge in Rappen.
 *
 * Grundlage sind Florijans Angaben vom 8.9.2026:
 *   100 m² Büro mit 2 Nasszellen in Zürich = 1 Stunde Arbeit = CHF 99.–
 *   monatlich CHF 396.– (vier Termine)
 *   Abo mit 12 Monaten Mindestlaufzeit: CHF 82.50 pro Woche, CHF 330.– im Monat
 *   Zimmerzahl spielt keine Rolle.
 *   Fensterreinigung kostet extra.
 */

export interface TariffDef {
  id: Tariff;
  label: string;
  /** Rappen pro Stunde. */
  hourlyCents: number;
  commitmentMonths: number;
  description: string;
}

export const TARIFFS: Record<Tariff, TariffDef> = {
  standard: {
    id: "standard",
    label: "Standard",
    hourlyCents: 9900,
    commitmentMonths: 0,
    description: "Jederzeit kündbar, keine Mindestlaufzeit.",
  },
  abo12: {
    id: "abo12",
    label: "Abo 12 Monate",
    hourlyCents: 8250,
    commitmentMonths: 12,
    description: "Zwölf Monate Mindestlaufzeit, dafür rund 17 % günstiger.",
  },
};

/**
 * Referenzwert aus Florijans Angabe: 100 m² entsprechen einer Stunde Arbeit.
 * Grössere Flächen werden proportional hochgerechnet.
 *
 * OFFEN: Ob das über 200 m² noch stimmt, muss Florijan bestätigen —
 * grosse Flächen sind pro Quadratmeter meist schneller.
 */
export const SQM_PER_HOUR = 100;

/** Kein Auftrag unter einer Stunde. */
export const MIN_MINUTES = 60;

/** Fläche, bis zu der online gerechnet wird. Darüber: persönliches Angebot. */
export const MAX_SQM_ONLINE = 300;
export const MIN_SQM = 20;

/** Florijans Rechnung: ein Monat sind vier Termine. */
export const WEEKS_PER_MONTH = 4;

export const VISITS_PER_MONTH: Record<Frequency, number> = {
  woechentlich: 4,
  zweiwoechentlich: 2,
  monatlich: 1,
  einmalig: 0,
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  woechentlich: "wöchentlich",
  zweiwoechentlich: "alle zwei Wochen",
  monatlich: "einmal im Monat",
  einmalig: "einmalig",
};

export const OBJECT_LABEL: Record<ObjectType, string> = {
  buero: "Büro / Gewerbe",
  wohnung: "Wohnung / Haus",
};

/** Was im Stundenpreis enthalten ist — wörtlich nach Florijans Angabe. */
export const INCLUDED_TASKS = [
  "Staubsaugen",
  "Wischen",
  "WC und Nasszellen",
  "Abfalleimer entsorgen",
  "Tische abwischen",
  "Türgriffe desinfizieren",
] as const;

export interface ExtraDef {
  id: ExtraId;
  label: string;
  /**
   * Rappen. `null` bedeutet: online kein Preis, führt zur Anfrage.
   * Sobald Florijan einen Preis nennt, hier eintragen und der Rechner
   * weist ihn überall automatisch aus.
   */
  priceCents: number | null;
  minutes: number;
  note: string;
}

export const EXTRAS: Record<ExtraId, ExtraDef> = {
  fenster: {
    id: "fenster",
    label: "Fensterreinigung",
    priceCents: null,
    minutes: 0,
    note: "Preis hängt von Anzahl und Erreichbarkeit der Fenster ab — wir melden uns mit einem Festpreis.",
  },
};

/** Anfahrt ab Kloten. Innerhalb des Kerngebiets kostenlos. */
export const TRAVEL_ZONES = [
  { maxKm: 20, label: "Zürich und Umgebung", surchargeCents: 0 },
  { maxKm: 40, label: "erweitertes Gebiet", surchargeCents: 1500 },
] as const;
