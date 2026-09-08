/** Was gereinigt wird. Bestimmt den Trichter und die Zeitschätzung. */
export type ObjectType = "buero" | "wohnung";

/**
 * Tarif. Der einzige Preisunterschied bei gleichem Paket.
 * `standard` ist jederzeit kündbar, `abo12` bindet zwölf Monate.
 */
export type Tariff = "standard" | "abo12";

/**
 * Die drei Pakete. Der Kunde entscheidet sich für eines statt fünfzehn
 * Häkchen zu setzen — das ist der ganze Punkt der Staffelung.
 */
export type PackageId = "essential" | "plus" | "complete";

/**
 * Wie oft im Monat gereinigt wird.
 *
 * Der Paketpreis gilt pro Reinigung. Der Kunde legt danach die Anzahl fest —
 * einmal bis viermal im Monat —, statt zwischen "wöchentlich" und
 * "zweiwöchentlich" übersetzen zu müssen.
 */
export type Frequency = "einmalig" | "m1" | "m2" | "m3" | "m4";

/** Zusatzleistungen, die kein Paket abdeckt. */
export type ExtraId =
  | "fenster-innen"
  | "fenster-beidseitig"
  | "wc-zusatz"
  | "kuechenzeile"
  | "geschirr"
  | "kuehlschrank"
  | "kaffeemaschine"
  | "abfallstation"
  | "oberflaechen-intensiv"
  | "stuehle"
  | "teppich"
  | "desinfektion";

/**
 * Wonach eine Zusatzleistung berechnet wird.
 * `pauschal` braucht keine Menge, die anderen schon.
 */
export type ExtraUnit = "pauschal" | "m2glas" | "stueck";

/** Eine gewählte Zusatzleistung samt Menge. */
export interface ExtraSelection {
  id: ExtraId;
  /** m² Glas, Anzahl Stühle, Anzahl Stationen. Bei `pauschal` immer 1. */
  quantity: number;
}

export interface QuoteInput {
  objectType: ObjectType;
  /** Fläche in m². Treibt als Einziges die Dauer — Zimmerzahl spielt keine Rolle. */
  squareMeters: number;
  packageId: PackageId;
  tariff: Tariff;
  frequency: Frequency;
  extras: ExtraSelection[];
  /** Entfernung ab Kloten in km. */
  distanceKm: number;
}

export interface LineItem {
  label: string;
  /** Betrag in Rappen. Negativ bei Abzug. */
  amountCents: number;
  detail?: string;
}

/** Position, für die es online keinen Preis gibt. */
export interface OpenItem {
  label: string;
  reason: string;
}

/** Zusatzleistung, die das gewählte Paket bereits abdeckt. */
export interface CoveredItem {
  label: string;
  packageLabel: string;
}

export interface Quote {
  input: QuoteInput;
  lines: LineItem[];
  /** Arbeitszeit in Minuten, auf Viertelstunden gerundet. */
  durationMinutes: number;
  /** Fläche über dem Grundpreis. 0, solange 100 m² nicht überschritten sind. */
  extraSqm: number;
  /** Preis eines einzelnen Termins in Rappen, vor Steuer. */
  perVisitCents: number;
  /** Monatspreis. `null` bei einmaliger Reinigung. */
  perMonthCents: number | null;
  /** Termine pro Monat. 0 bei einmaliger Reinigung. */
  visitsPerMonth: number;
  /** Steuer in Rappen. 0, solange nicht MWST-pflichtig. */
  vatCents: number;
  /** Was der Kunde pro Termin zahlt, inklusive Steuer. */
  totalPerVisitCents: number;
  /** Leistungen ohne Onlinepreis — führen zu einer Anfrage statt zu einer Zahl. */
  openItems: OpenItem[];
  /** Gewählte Leistungen, die das Paket schon enthält. Werden nicht berechnet. */
  coveredItems: CoveredItem[];
  notices: string[];
}
