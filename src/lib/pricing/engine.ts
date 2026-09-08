import { business } from "@/config/business";
import {
  BASE_SQM,
  CONDITIONS_NOTE,
  EXTRAS,
  FREQUENCY_LABEL,
  MAX_SQM_ONLINE,
  MIN_MINUTES,
  MIN_SQM,
  OBJECT_LABEL,
  SQM_PER_HOUR,
  TARIFFS,
  TRAVEL_ZONES,
  VISITS_PER_MONTH,
  type Rounding,
} from "./catalog";
import type { LineItem, OpenItem, Quote, QuoteInput, Tariff } from "./types";

export class OutOfScopeError extends Error {
  constructor(
    message: string,
    readonly reason: "distance" | "area",
  ) {
    super(message);
    this.name = "OutOfScopeError";
  }
}

function roundCents(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/**
 * Endrundung eines Betrags.
 *
 * Der Standardtarif landet auf ganzen Franken — so hat Florijan seine Staffel
 * selbst geschrieben (148.50 -> 149.–, 247.50 -> 248.–). Der Abopreis bleibt
 * auf fünf Rappen genau, weil 123.75 genau so auf der Seite stehen soll.
 * Fünf Rappen, nicht ein Rappen: kleinere Münzen gibt es in der Schweiz nicht.
 */
export function roundTo(cents: number, mode: Rounding): number {
  const step = mode === "franken" ? 100 : 5;
  return Math.round(cents / step) * step;
}

/**
 * Der Reinigungspreis für eine Fläche, in Rappen.
 *
 * Florijans Modell in einer Zeile: CHF 0.99 pro m², mindestens der Grundpreis
 * von CHF 99.– für bis zu 100 m². Im Abo dieselbe Logik zu CHF 0.825.
 *
 * Bewusst NICHT aus der auf Viertelstunden gerundeten Dauer gerechnet: sonst
 * würden 137 m² wie 125 m² abgerechnet und die ausgewiesene Staffel stimmte
 * nicht mehr mit dem Quadratmeterpreis überein, den die Seite verspricht.
 * Die Dauer ist eine Angabe für den Kunden, keine Rechengrösse.
 */
export function cleaningPriceCents(squareMeters: number, tariff: Tariff): number {
  const def = TARIFFS[tariff];
  const linear = squareMeters * def.perSqmCents;
  return roundTo(Math.max(def.baseCents, linear), def.rounding);
}

/** Arbeitszeit in Minuten, auf Viertelstunden gerundet, mindestens eine Stunde. */
export function estimateMinutes(squareMeters: number): number {
  const raw = (squareMeters / SQM_PER_HOUR) * 60;
  return Math.max(MIN_MINUTES, Math.round(raw / 15) * 15);
}

/**
 * Berechnet ein Angebot.
 *
 * Reine Funktion: gleiche Eingabe, gleiches Ergebnis, kein Netzwerk, kein
 * Sprachmodell. Jede Preisauskunft im Projekt läuft durch genau diese Funktion.
 *
 * Was keinen Onlinepreis hat, wird als `openItem` zurückgegeben statt geschätzt.
 */
export function calculateQuote(input: QuoteInput): Quote {
  const tariff = TARIFFS[input.tariff];
  if (!tariff) throw new Error(`Unbekannter Tarif: ${input.tariff}`);

  if (input.distanceKm > business.serviceArea.maxRadiusKm) {
    throw new OutOfScopeError(
      `Das Objekt liegt ${input.distanceKm} km von Kloten entfernt und damit ausserhalb unseres Einzugsgebiets von ${business.serviceArea.maxRadiusKm} km.`,
      "distance",
    );
  }

  const sqm = Math.round(input.squareMeters);
  if (sqm < MIN_SQM || sqm > MAX_SQM_ONLINE) {
    throw new OutOfScopeError(
      `Für ${sqm} m² rechnen wir persönlich; online rechnen wir von ${MIN_SQM} bis ${MAX_SQM_ONLINE} m².`,
      "area",
    );
  }

  const lines: LineItem[] = [];
  const openItems: OpenItem[] = [];
  const notices: string[] = [];

  // 1. Reinigung nach Fläche
  const durationMinutes = estimateMinutes(sqm);
  const extraSqm = Math.max(0, sqm - BASE_SQM);
  const cleaningCents = cleaningPriceCents(sqm, input.tariff);
  lines.push({
    label: `${OBJECT_LABEL[input.objectType]}, ${sqm} m²`,
    amountCents: cleaningCents,
    detail:
      extraSqm > 0
        ? `Grundpreis bis ${BASE_SQM} m² ${formatMoney(tariff.baseCents)}, dazu ${extraSqm} m² zu ${formatSqmRate(tariff.perSqmCents)} pro m²`
        : `Grundpreis bis ${BASE_SQM} m², ${formatDuration(durationMinutes)} Reinigungszeit`,
  });

  // 2. Anfahrt
  const zone = TRAVEL_ZONES.find((z) => input.distanceKm <= z.maxKm);
  if (zone && zone.surchargeCents > 0) {
    lines.push({ label: `Anfahrt, ${zone.label}`, amountCents: zone.surchargeCents });
  }

  // 3. Zusatzleistungen. Ohne hinterlegten Preis wird nichts erfunden.
  for (const id of [...new Set(input.extras)].sort()) {
    const extra = EXTRAS[id];
    if (!extra) continue;
    if (extra.priceCents === null) {
      openItems.push({ label: extra.label, reason: extra.note });
    } else {
      lines.push({ label: extra.label, amountCents: extra.priceCents });
    }
  }

  const perVisitCents = lines.reduce((sum, l) => sum + l.amountCents, 0);

  // 4. Steuer nur, wenn tatsächlich pflichtig
  const vatCents = business.vatRegistered ? roundCents(perVisitCents * business.vatRate) : 0;
  const totalPerVisitCents = perVisitCents + vatCents;

  // 5. Monatspreis nach der Vier-Wochen-Rechnung
  const visitsPerMonth = VISITS_PER_MONTH[input.frequency];
  const perMonthCents = visitsPerMonth > 0 ? totalPerVisitCents * visitsPerMonth : null;

  // 6. Hinweise
  if (tariff.commitmentMonths > 0) {
    notices.push(
      `Der Abopreis gilt bei ${tariff.commitmentMonths} Monaten Mindestlaufzeit. Danach jederzeit monatlich kündbar.`,
    );
  } else if (input.frequency !== "einmalig") {
    // Aus den gerundeten Endpreisen, nicht aus den Rohwerten: sonst weicht die
    // genannte Ersparnis von der Differenz ab, die im Rechner danebensteht.
    const ersparnis = cleaningCents - cleaningPriceCents(sqm, "abo12");
    if (ersparnis > 0) {
      notices.push(
        `Mit dem Abo über 12 Monate zahlen Sie ${formatMoney(ersparnis)} weniger pro Termin.`,
      );
    }
  }
  notices.push(
    business.vatRegistered
      ? business.priceNote.registered
      : business.priceNote.notRegistered,
  );
  notices.push(CONDITIONS_NOTE);

  return {
    input: { ...input, squareMeters: sqm, extras: [...new Set(input.extras)].sort() },
    lines,
    durationMinutes,
    extraSqm,
    perVisitCents,
    perMonthCents,
    visitsPerMonth,
    vatCents,
    totalPerVisitCents,
    openItems,
    notices,
  };
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat(business.locale, {
    style: "currency",
    currency: business.currency,
  }).format(cents / 100);
}

/**
 * Der Quadratmeterpreis. Zwei Nachkommastellen reichen für 0.99, drei für
 * 0.825 — der Abopreis darf nicht auf 0.83 gerundet dastehen, sonst stimmt
 * die Staffel darunter nicht mehr.
 */
export function formatSqmRate(cents: number): string {
  const digits = Number.isInteger(cents) ? 2 : 3;
  return new Intl.NumberFormat(business.locale, {
    style: "currency",
    currency: business.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}

export function formatHours(hours: number): string {
  if (Number.isInteger(hours)) return hours === 1 ? "1 Stunde" : `${hours} Stunden`;
  return `${hours.toString().replace(".", ",")} Stunden`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

export { BASE_SQM, CONDITIONS_NOTE, FREQUENCY_LABEL, OBJECT_LABEL, TARIFFS };
