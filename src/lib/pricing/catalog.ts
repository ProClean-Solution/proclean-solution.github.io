import type { Condition, ExtraId, Frequency, ServiceId } from "./types";

/**
 * PLATZHALTERPREISE. Alle Beträge netto in Cent.
 * Diese Datei ist die einzige Stelle, an der Preise stehen — Rechner, Chat
 * und Angebots-Tool lesen alle hier. Vor dem Livegang durch echte Werte ersetzen.
 */

export interface ServiceDef {
  id: ServiceId;
  label: string;
  /** Netto-Cent pro m². */
  perSquareMeterCents: number;
  /** Grundpauschale netto in Cent (An-/Abfahrt, Rüstzeit, Material). */
  baseCents: number;
  /** Minuten Arbeitszeit pro m² — Grundlage der Dauerschätzung. */
  minutesPerSquareMeter: number;
  /** Mindestauftragswert netto in Cent. */
  minimumCents: number;
  /** Für Geschäftskunden? Bestimmt den Trichter (B2B vs. B2C). */
  segment: "b2c" | "b2b";
  description: string;
}

export const SERVICES: Record<ServiceId, ServiceDef> = {
  unterhaltsreinigung: {
    id: "unterhaltsreinigung",
    label: "Unterhaltsreinigung",
    perSquareMeterCents: 95,
    baseCents: 2500,
    minutesPerSquareMeter: 1.1,
    minimumCents: 7500,
    segment: "b2c",
    description: "Regelmäßige Reinigung von Wohnräumen, Bad und Küche.",
  },
  grundreinigung: {
    id: "grundreinigung",
    label: "Grundreinigung",
    perSquareMeterCents: 210,
    baseCents: 4000,
    minutesPerSquareMeter: 2.4,
    minimumCents: 18000,
    segment: "b2c",
    description: "Intensive Tiefenreinigung inklusive schwer zugänglicher Stellen.",
  },
  endreinigung: {
    id: "endreinigung",
    label: "Endreinigung bei Auszug",
    perSquareMeterCents: 260,
    baseCents: 5000,
    minutesPerSquareMeter: 2.8,
    minimumCents: 24000,
    segment: "b2c",
    description: "Besenreine Übergabe mit Abnahmegarantie gegenüber dem Vermieter.",
  },
  bueroreinigung: {
    id: "bueroreinigung",
    label: "Büroreinigung",
    perSquareMeterCents: 70,
    baseCents: 3000,
    minutesPerSquareMeter: 0.8,
    minimumCents: 9000,
    segment: "b2b",
    description: "Regelmäßige Reinigung von Büro- und Gewerbeflächen.",
  },
  fensterreinigung: {
    id: "fensterreinigung",
    label: "Fensterreinigung",
    perSquareMeterCents: 45,
    baseCents: 3500,
    minutesPerSquareMeter: 0.5,
    minimumCents: 8000,
    segment: "b2c",
    description: "Fenster, Rahmen und Fensterbänke innen und außen.",
  },
};

/** Aufschlag pro Bad über das erste hinaus (netto Cent) und Zusatzminuten. */
export const BATHROOM_SURCHARGE_CENTS = 1800;
export const BATHROOM_MINUTES = 25;

/** Aufwandsfaktor nach Zustand. Wirkt auf Preis und Dauer. */
export const CONDITION_FACTOR: Record<Condition, number> = {
  normal: 1.0,
  stark: 1.25,
  extrem: 1.6,
};

/**
 * Frequenzrabatt. Bewusst steil: Abo-Kunden sind der wertvollste Umsatz,
 * deshalb ist die Ersparnis im Rechner sofort sichtbar.
 */
export const FREQUENCY_DISCOUNT: Record<Frequency, number> = {
  einmalig: 0,
  monatlich: 0.05,
  zweiwoechentlich: 0.1,
  woechentlich: 0.15,
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  einmalig: "einmalig",
  monatlich: "monatlich",
  zweiwoechentlich: "alle zwei Wochen",
  woechentlich: "wöchentlich",
};

export interface ExtraDef {
  id: ExtraId;
  label: string;
  priceCents: number;
  minutes: number;
}

export const EXTRAS: Record<ExtraId, ExtraDef> = {
  fenster: { id: "fenster", label: "Fenster innen", priceCents: 2500, minutes: 30 },
  backofen: { id: "backofen", label: "Backofen", priceCents: 3500, minutes: 40 },
  kuehlschrank: { id: "kuehlschrank", label: "Kühlschrank", priceCents: 2000, minutes: 25 },
  teppich: { id: "teppich", label: "Teppichreinigung", priceCents: 4500, minutes: 45 },
  keller: { id: "keller", label: "Keller / Abstellraum", priceCents: 3000, minutes: 35 },
  balkon: { id: "balkon", label: "Balkon / Terrasse", priceCents: 2800, minutes: 30 },
};

/**
 * Anfahrtszonen. Die erste Zone ist kostenlos — sonst verliert man genau die
 * Nahkundschaft, die am profitabelsten ist.
 */
export const TRAVEL_ZONES = [
  { maxKm: 15, label: "Zone 1 (bis 15 km)", surchargeCents: 0 },
  { maxKm: 30, label: "Zone 2 (bis 30 km)", surchargeCents: 1500 },
  { maxKm: 50, label: "Zone 3 (bis 50 km)", surchargeCents: 3500 },
] as const;

/** Jenseits davon kein Onlinepreis, sondern individuelles Angebot. */
export const MAX_SERVICE_KM = 50;

/** Grenzen für die Onlineberechnung. */
export const MIN_SQM = 10;
export const MAX_SQM = 600;
