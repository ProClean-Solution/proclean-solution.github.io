/** Was gereinigt wird. Bestimmt den Trichter und die Zeitschätzung. */
export type ObjectType = "buero" | "wohnung";

/**
 * Tarif. Der einzige Preisunterschied im Angebot.
 * `standard` ist jederzeit kündbar, `abo12` bindet zwölf Monate.
 */
export type Tariff = "standard" | "abo12";

export type Frequency = "woechentlich" | "zweiwoechentlich" | "monatlich" | "einmalig";

/** Zusatzleistungen, die nicht im Stundenpreis enthalten sind. */
export type ExtraId = "fenster";

export interface QuoteInput {
  objectType: ObjectType;
  /** Fläche in m². Treibt als Einziges die Dauer — Zimmerzahl spielt keine Rolle. */
  squareMeters: number;
  tariff: Tariff;
  frequency: Frequency;
  extras: ExtraId[];
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

export interface Quote {
  input: QuoteInput;
  lines: LineItem[];
  /** Arbeitszeit in Minuten, auf Viertelstunden gerundet. */
  durationMinutes: number;
  /** Preis eines einzelnen Termins in Rappen, vor Steuer. */
  perVisitCents: number;
  /** Monatspreis nach deiner Rechnung (4 Termine bei wöchentlich). */
  perMonthCents: number | null;
  /** Termine pro Monat, nach der Vier-Wochen-Rechnung. */
  visitsPerMonth: number;
  /** Steuer in Rappen. 0, solange nicht MWST-pflichtig. */
  vatCents: number;
  /** Was der Kunde pro Termin zahlt, inklusive Steuer. */
  totalPerVisitCents: number;
  /** Leistungen ohne Onlinepreis — führen zu einer Anfrage statt zu einer Zahl. */
  openItems: OpenItem[];
  notices: string[];
}
