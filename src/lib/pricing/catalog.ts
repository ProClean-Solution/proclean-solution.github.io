import type { ExtraId, Frequency, ObjectType, PackageId, Tariff } from "./types";

/**
 * Preise ProClean Solution. Alle Beträge in Rappen.
 *
 * Grundlage sind Florijans Angaben:
 *   Grundpreis bis 100 m² = eine Stunde = CHF 99.–, im 12-Monats-Abo CHF 82.50
 *   Darüber linear nach Fläche: CHF 0.99 pro m², im Abo CHF 0.825 pro m²
 *
 *   100 m²  =  99.–   /  82.50
 *   150 m²  = 149.–   / 123.75
 *   200 m²  = 198.–   / 165.–
 *   250 m²  = 248.–   / 206.25
 *
 * Der Standardtarif wird auf ganze Franken gerundet (Florijans eigene Zahlen:
 * 148.50 -> 149.–, 247.50 -> 248.–), der Abopreis auf fünf Rappen — 123.75
 * soll genau so stehen bleiben, wie er es genannt hat.
 *
 * Zimmerzahl spielt keine Rolle. Fensterreinigung und die übrigen Optionen
 * kosten extra und haben online bewusst keinen Preis.
 */

/** Wie ein Betrag am Ende gerundet wird. */
export type Rounding = "franken" | "rappen5";

export interface TariffDef {
  id: Tariff;
  label: string;
  /** Rappen pro Stunde — identisch mit dem Preis für 100 m². */
  hourlyCents: number;
  /** Rappen pro Quadratmeter. Darf gebrochen sein, gerundet wird am Schluss. */
  perSqmCents: number;
  /** Mindestbetrag pro Termin: der Grundpreis bis 100 m². */
  baseCents: number;
  commitmentMonths: number;
  rounding: Rounding;
  description: string;
}

/** Fläche, die im Grundpreis enthalten ist. Gleichzeitig eine Stunde Arbeit. */
export const BASE_SQM = 100;

export const TARIFFS: Record<Tariff, TariffDef> = {
  standard: {
    id: "standard",
    label: "Standard",
    hourlyCents: 9900,
    perSqmCents: 99,
    baseCents: 9900,
    commitmentMonths: 0,
    rounding: "franken",
    description: "Jederzeit kündbar, keine Mindestlaufzeit.",
  },
  abo12: {
    id: "abo12",
    label: "Abo 12 Monate",
    hourlyCents: 8250,
    perSqmCents: 82.5,
    baseCents: 8250,
    commitmentMonths: 12,
    rounding: "rappen5",
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

/**
 * Was im Grundpreis enthalten ist — wörtlich nach Florijans Leistungsblatt.
 * Diese Liste ist die einzige Quelle; Rechner, Tarife, Paketkarte und
 * Assistent lesen alle hier.
 */
export const INCLUDED_TASKS = [
  "Böden saugen",
  "Hartböden feucht wischen",
  "Freie Schreibtisch- und Arbeitsflächen",
  "Sichtbare Oberflächen",
  "Türgriffe und Lichtschalter",
  "Abfalleimer",
  "Ein Sanitärbereich",
  "Kleine Büroküche / Küchenzeile",
  "Spiegel und zugängliche Glasflächen",
] as const;

/**
 * Der Kleingedruckte-Satz, wörtlich nach Florijan. Steht überall dort, wo eine
 * Zahl steht — der Preis gilt nicht bedingungslos.
 */
export const CONDITIONS_NOTE =
  "Preis gilt für normal verschmutzte und frei zugängliche Büroflächen. Starke Verschmutzungen, Grundreinigungen, Bauendreinigungen und aussergewöhnlicher Mehraufwand werden separat berechnet.";

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
    note: "Für Innen- und Aussenfenster. Der Preis hängt von Anzahl und Erreichbarkeit ab — wir melden uns mit einem Festpreis.",
  },
  teppich: {
    id: "teppich",
    label: "Teppich-Tiefenreinigung",
    priceCents: null,
    minutes: 0,
    note: "Maschinelle Reinigung für textile Flächen. Preis nach Fläche und Verschmutzungsgrad — wir schauen es uns an und nennen einen Festpreis.",
  },
  kueche: {
    id: "kueche",
    label: "Geschirr- & Küchenservice",
    priceCents: null,
    minutes: 0,
    note: "Für Büros mit regelmässigem Küchenbetrieb. Preis nach Aufwand und Häufigkeit — wir klären das im Gespräch.",
  },
};

/**
 * Die drei Pakete.
 *
 * ACHTUNG, Stand offen: Florijan hat die drei Namen und Untertitel genannt,
 * aber nur den Inhalt von "Essential" beziffert. Plus und Complete sind hier
 * aus seinen eigenen Optionen zusammengesetzt und tragen deshalb bewusst
 * keinen Preis — sie führen zur Anfrage, statt eine Zahl zu erfinden.
 * Sobald er Inhalt und Preis bestätigt, hier eintragen; die Karte, der
 * Assistent und der Rechner übernehmen es automatisch.
 */
export interface PackageDef {
  id: PackageId;
  label: string;
  tagline: string;
  /** `bestaetigt` nur, wenn Florijan Inhalt UND Preis genannt hat. */
  status: "bestaetigt" | "entwurf";
  /** Was dieses Paket zusätzlich zum Grundpreis enthält. */
  adds: readonly string[];
  extras: readonly ExtraId[];
}

export const PACKAGES: PackageDef[] = [
  {
    id: "essential",
    label: "Office Essential",
    tagline: "Alles, was ein sauberes Büro braucht.",
    status: "bestaetigt",
    adds: [],
    extras: [],
  },
  {
    id: "plus",
    label: "Office Plus",
    tagline: "Für Büros, die mehr Aufmerksamkeit verdienen.",
    status: "entwurf",
    adds: ["Fenster innen im Turnus", "Teppichflächen maschinell"],
    extras: ["fenster", "teppich"],
  },
  {
    id: "complete",
    label: "Office Complete",
    tagline: "Einfach kommen. Arbeiten. Alles andere ist erledigt.",
    status: "entwurf",
    /*
      Nur die Differenz zu Plus. Die Karte wächst kumulativ — die Zeilen von
      Plus bleiben stehen —, deshalb stünde "Teppichflächen maschinell" hier
      ein zweites Mal in derselben Liste.
    */
    adds: ["Fenster zusätzlich aussen", "Geschirr und Küche im laufenden Betrieb"],
    extras: ["fenster", "teppich", "kueche"],
  },
];

/** Anfahrt ab Kloten. Innerhalb des Kerngebiets kostenlos. */
export const TRAVEL_ZONES = [
  { maxKm: 20, label: "Zürich und Umgebung", surchargeCents: 0 },
  { maxKm: 40, label: "erweitertes Gebiet", surchargeCents: 1500 },
] as const;
