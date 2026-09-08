export type ServiceId =
  | "unterhaltsreinigung"
  | "grundreinigung"
  | "endreinigung"
  | "bueroreinigung"
  | "fensterreinigung";

export type Frequency = "einmalig" | "monatlich" | "zweiwoechentlich" | "woechentlich";

/** Zustand des Objekts — treibt den Aufwandsfaktor. */
export type Condition = "normal" | "stark" | "extrem";

export type ExtraId =
  | "fenster"
  | "backofen"
  | "kuehlschrank"
  | "teppich"
  | "keller"
  | "balkon";

export interface QuoteInput {
  service: ServiceId;
  /** Wohn-/Nutzfläche in m². */
  squareMeters: number;
  bathrooms: number;
  frequency: Frequency;
  condition: Condition;
  extras: ExtraId[];
  /** Entfernung zum Objekt in km (Luftlinie ab Betriebssitz). */
  distanceKm: number;
}

export interface LineItem {
  label: string;
  /** Betrag in Cent, netto. Negativ bei Rabatt. */
  amountCents: number;
  detail?: string;
}

export interface Quote {
  input: QuoteInput;
  lines: LineItem[];
  netCents: number;
  vatCents: number;
  grossCents: number;
  /** Geschätzte Dauer in Minuten — Grundlage für die Terminplanung. */
  durationMinutes: number;
  /** Unschärfe der Schätzung, ± in Prozent. */
  uncertaintyPercent: number;
  /** Hinweise, die dem Kunden angezeigt werden müssen. */
  notices: string[];
}
