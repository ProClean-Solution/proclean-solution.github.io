import { business } from "@/config/business";
import {
  BATHROOM_MINUTES,
  BATHROOM_SURCHARGE_CENTS,
  CONDITION_FACTOR,
  EXTRAS,
  FREQUENCY_DISCOUNT,
  FREQUENCY_LABEL,
  MAX_SERVICE_KM,
  MAX_SQM,
  MIN_SQM,
  SERVICES,
  TRAVEL_ZONES,
} from "./catalog";
import type { LineItem, Quote, QuoteInput } from "./types";

export class OutOfScopeError extends Error {
  constructor(
    message: string,
    readonly reason: "distance" | "area",
  ) {
    super(message);
    this.name = "OutOfScopeError";
  }
}

function travelZoneFor(distanceKm: number) {
  return TRAVEL_ZONES.find((z) => distanceKm <= z.maxKm);
}

/** Kaufmännisch runden — Math.round kippt bei negativen Werten in die falsche Richtung. */
function roundCents(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/**
 * Berechnet ein Angebot. Reine Funktion: gleiche Eingabe, gleiches Ergebnis,
 * keine Netzwerkaufrufe, kein Sprachmodell. Jede Preisauskunft im Projekt —
 * Rechner, Chat, internes Angebots-Tool — läuft durch genau diese Funktion.
 */
export function calculateQuote(input: QuoteInput): Quote {
  const service = SERVICES[input.service];
  if (!service) throw new Error(`Unbekannte Leistung: ${input.service}`);

  if (input.distanceKm > MAX_SERVICE_KM) {
    throw new OutOfScopeError(
      `Das Objekt liegt ${input.distanceKm} km entfernt und damit außerhalb unseres Einzugsgebiets von ${MAX_SERVICE_KM} km.`,
      "distance",
    );
  }
  const sqm = Math.round(input.squareMeters);
  if (sqm < MIN_SQM || sqm > MAX_SQM) {
    throw new OutOfScopeError(
      `Für ${sqm} m² erstellen wir ein individuelles Angebot; online rechnen wir von ${MIN_SQM} bis ${MAX_SQM} m².`,
      "area",
    );
  }

  const conditionFactor = CONDITION_FACTOR[input.condition];
  const lines: LineItem[] = [];
  const notices: string[] = [];

  // 1. Grundpauschale
  lines.push({
    label: "Grundpauschale",
    amountCents: service.baseCents,
    detail: "An- und Abfahrt, Rüstzeit, Reinigungsmittel",
  });

  // 2. Fläche
  const areaCents = roundCents(sqm * service.perSquareMeterCents * conditionFactor);
  lines.push({
    label: `${service.label}, ${sqm} m²`,
    amountCents: areaCents,
    detail:
      conditionFactor === 1
        ? undefined
        : `inkl. Aufwandsfaktor ${conditionFactor.toFixed(2).replace(".", ",")}× für Zustand „${input.condition}“`,
  });

  // 3. Zusätzliche Bäder
  const extraBathrooms = Math.max(0, Math.round(input.bathrooms) - 1);
  if (extraBathrooms > 0) {
    lines.push({
      label: `${extraBathrooms} weitere${extraBathrooms === 1 ? "s" : ""} Bad`,
      amountCents: roundCents(extraBathrooms * BATHROOM_SURCHARGE_CENTS * conditionFactor),
    });
  }

  // 4. Zusatzleistungen — Reihenfolge stabil halten, damit Angebote reproduzierbar sind
  const uniqueExtras = [...new Set(input.extras)].sort();
  for (const id of uniqueExtras) {
    const extra = EXTRAS[id];
    if (!extra) continue;
    lines.push({ label: extra.label, amountCents: extra.priceCents });
  }

  // 5. Anfahrt
  const zone = travelZoneFor(input.distanceKm);
  if (zone && zone.surchargeCents > 0) {
    lines.push({ label: `Anfahrt ${zone.label}`, amountCents: zone.surchargeCents });
  }

  // 6. Mindestauftragswert vor Rabatt
  let subtotal = lines.reduce((sum, l) => sum + l.amountCents, 0);
  if (subtotal < service.minimumCents) {
    lines.push({
      label: "Mindestauftragswert",
      amountCents: service.minimumCents - subtotal,
      detail: `Für ${service.label} gilt ein Mindestauftragswert.`,
    });
    subtotal = service.minimumCents;
  }

  // 7. Frequenzrabatt
  const discountRate = FREQUENCY_DISCOUNT[input.frequency];
  if (discountRate > 0) {
    const discount = -roundCents(subtotal * discountRate);
    lines.push({
      label: `Rabatt ${FREQUENCY_LABEL[input.frequency]} (${Math.round(discountRate * 100)} %)`,
      amountCents: discount,
    });
    subtotal += discount;
  } else {
    notices.push(
      "Bei regelmäßiger Reinigung sparen Sie bis zu 15 % — wöchentlich ist am günstigsten pro Termin.",
    );
  }

  // 8. Steuer
  const netCents = subtotal;
  const vatCents = roundCents(netCents * business.vatRate);
  const grossCents = netCents + vatCents;

  // 9. Dauer
  let minutes = sqm * service.minutesPerSquareMeter * conditionFactor;
  minutes += extraBathrooms * BATHROOM_MINUTES * conditionFactor;
  for (const id of uniqueExtras) minutes += EXTRAS[id]?.minutes ?? 0;
  const durationMinutes = Math.max(60, Math.round(minutes / 15) * 15);

  // 10. Unschärfe: ohne Besichtigung ist die Schätzung gröber
  const uncertaintyPercent = input.condition === "normal" ? 10 : 20;
  notices.push(
    `Richtpreis auf Basis Ihrer Angaben, ± ${uncertaintyPercent} %. Verbindlich wird der Preis nach kurzer Besichtigung oder anhand von Fotos.`,
  );

  return {
    input: { ...input, squareMeters: sqm, extras: uniqueExtras },
    lines,
    netCents,
    vatCents,
    grossCents,
    durationMinutes,
    uncertaintyPercent,
    notices,
  };
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat(business.locale, {
    style: "currency",
    currency: business.currency,
  }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}
