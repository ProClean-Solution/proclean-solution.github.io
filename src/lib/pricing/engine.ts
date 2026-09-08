import { business } from "@/config/business";
import {
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
} from "./catalog";
import type { LineItem, OpenItem, Quote, QuoteInput } from "./types";

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

  // 1. Reinigung nach Zeit
  const durationMinutes = estimateMinutes(sqm);
  const hours = durationMinutes / 60;
  const cleaningCents = roundCents(hours * tariff.hourlyCents);
  lines.push({
    label: `${OBJECT_LABEL[input.objectType]}, ${sqm} m²`,
    amountCents: cleaningCents,
    detail: `${formatHours(hours)} zu ${formatMoney(tariff.hourlyCents)} pro Stunde`,
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
    const abo = TARIFFS.abo12;
    const ersparnis = roundCents(hours * (tariff.hourlyCents - abo.hourlyCents));
    notices.push(
      `Mit dem Abo über 12 Monate zahlen Sie ${formatMoney(ersparnis)} weniger pro Termin.`,
    );
  }
  notices.push(
    business.vatRegistered
      ? business.priceNote.registered
      : business.priceNote.notRegistered,
  );

  return {
    input: { ...input, squareMeters: sqm, extras: [...new Set(input.extras)].sort() },
    lines,
    durationMinutes,
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

export { FREQUENCY_LABEL, OBJECT_LABEL, TARIFFS };
