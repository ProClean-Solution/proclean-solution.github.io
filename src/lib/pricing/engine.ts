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
  PACKAGE_BY_ID,
  SQM_PER_HOUR,
  TARIFFS,
  TRAVEL_ZONES,
  VISITS_PER_MONTH,
  type Rounding,
} from "./catalog";
import type {
  CoveredItem,
  ExtraSelection,
  LineItem,
  OpenItem,
  PackageId,
  Quote,
  QuoteInput,
  Tariff,
} from "./types";

export class OutOfScopeError extends Error {
  constructor(
    message: string,
    readonly reason: "distance" | "area" | "tarif",
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
 * auf fünf Rappen genau, weil 123.75 genau so stehen soll. Fünf Rappen, nicht
 * ein Rappen: kleinere Münzen gibt es in der Schweiz nicht.
 */
export function roundTo(cents: number, mode: Rounding): number {
  const step = mode === "franken" ? 100 : 5;
  return Math.round(cents / step) * step;
}

/**
 * Der Preis eines Pakets für eine Fläche, pro Reinigung, in Rappen.
 *
 * Ein einziges Gesetz für alle drei Pakete und beide Tarife: der Grundpreis
 * gilt bis 100 m², darüber läuft es linear mit dem Quadratmeterpreis weiter,
 * den derselbe Grundpreis definiert. Das Abo zieht seinen Faktor auf beides
 * an — dadurch gilt für Plus und Complete automatisch derselbe Rabatt wie
 * für Essential, ohne dass irgendwo eine zweite Zahlenreihe gepflegt wird.
 *
 * Bewusst NICHT aus der auf Viertelstunden gerundeten Dauer gerechnet: sonst
 * würden 137 m² wie 125 m² abgerechnet und die ausgewiesene Staffel stimmte
 * nicht mehr mit dem Quadratmeterpreis überein, den die Seite verspricht.
 * Die Dauer ist eine Angabe für den Kunden, keine Rechengrösse.
 */
export function packagePriceCents(
  squareMeters: number,
  packageId: PackageId,
  tariff: Tariff,
): number {
  const paket = PACKAGE_BY_ID[packageId];
  const def = TARIFFS[tariff];
  const grundpreis = paket.baseCents * def.factor;
  const proQm = grundpreis / BASE_SQM;
  return roundTo(Math.max(grundpreis, squareMeters * proQm), def.rounding);
}

/** Der Quadratmeterpreis eines Pakets, ungerundet, in Rappen. */
export function packageSqmRateCents(packageId: PackageId, tariff: Tariff): number {
  return (PACKAGE_BY_ID[packageId].baseCents * TARIFFS[tariff].factor) / BASE_SQM;
}

/** Arbeitszeit in Minuten, auf Viertelstunden gerundet, mindestens eine Stunde. */
export function estimateMinutes(squareMeters: number): number {
  const raw = (squareMeters / SQM_PER_HOUR) * 60;
  return Math.max(MIN_MINUTES, Math.round(raw / 15) * 15);
}

/** Doppelte Nennungen zusammenfassen, Mengen addieren, Reihenfolge festlegen. */
function normalisiereExtras(extras: ExtraSelection[]): ExtraSelection[] {
  const summe = new Map<string, number>();
  for (const e of extras) {
    const def = EXTRAS[e.id];
    if (!def) continue;
    if (def.unit === "pauschal") {
      // Genau einmal, egal wie oft und mit welcher Menge sie hereinkommt.
      summe.set(e.id, 1);
      continue;
    }
    summe.set(e.id, (summe.get(e.id) ?? 0) + Math.max(1, Math.round(e.quantity)));
  }
  return [...summe.entries()]
    .map(([id, quantity]) => ({ id: id as ExtraSelection["id"], quantity }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Berechnet ein Angebot.
 *
 * Reine Funktion: gleiche Eingabe, gleiches Ergebnis, kein Netzwerk, kein
 * Sprachmodell. Jede Preisauskunft im Projekt läuft durch genau diese Funktion.
 *
 * Was keinen Onlinepreis hat, wird als `openItem` zurückgegeben statt geschätzt.
 * Was das gewählte Paket schon abdeckt, wird als `coveredItem` ausgewiesen
 * statt ein zweites Mal berechnet.
 */
export function calculateQuote(input: QuoteInput): Quote {
  const tariff = TARIFFS[input.tariff];
  if (!tariff) throw new Error(`Unbekannter Tarif: ${input.tariff}`);
  const paket = PACKAGE_BY_ID[input.packageId];
  if (!paket) throw new Error(`Unbekanntes Paket: ${input.packageId}`);

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

  /*
    Ein Abo über zwölf Monate mit genau einer Reinigung gibt es nicht. Der
    Rechner verhindert die Kombination schon in der Oberfläche; hier steht
    der Riegel, damit sie auf keinem anderen Weg einen Preis bekommt.
  */
  if (tariff.commitmentMonths > 0 && input.frequency === "einmalig") {
    throw new OutOfScopeError(
      "Das Abo setzt regelmässige Termine voraus. Für eine einzelne Reinigung gilt der Einzelpreis.",
      "tarif",
    );
  }

  const lines: LineItem[] = [];
  const openItems: OpenItem[] = [];
  const coveredItems: CoveredItem[] = [];
  const notices: string[] = [];

  // 1. Das Paket
  const durationMinutes = estimateMinutes(sqm);
  const extraSqm = Math.max(0, sqm - BASE_SQM);
  const paketCents = packagePriceCents(sqm, input.packageId, input.tariff);
  const grundpreis = roundTo(paket.baseCents * tariff.factor, tariff.rounding);
  lines.push({
    label: `${paket.label}, ${OBJECT_LABEL[input.objectType]}, ${sqm} m²`,
    amountCents: paketCents,
    detail:
      extraSqm > 0
        ? `Grundpreis bis ${BASE_SQM} m² ${formatMoney(grundpreis)}, dazu ${extraSqm} m² zu ${formatSqmRate(packageSqmRateCents(input.packageId, input.tariff))} pro m²`
        : `Grundpreis bis ${BASE_SQM} m², ${formatDuration(durationMinutes)} Reinigungszeit`,
  });

  // 2. Anfahrt
  const zone = TRAVEL_ZONES.find((z) => input.distanceKm <= z.maxKm);
  if (zone && zone.surchargeCents > 0) {
    lines.push({ label: `Anfahrt, ${zone.label}`, amountCents: zone.surchargeCents });
  }

  /*
    3. Zusatzleistungen.

    Drei Ausgänge, und nur einer davon erzeugt eine Zahl:
      – das Paket deckt sie ab   -> als enthalten ausweisen
      – es gibt keinen Preis     -> als offenen Posten zur Anfrage
      – sonst                    -> Menge mal Einzelpreis
  */
  const extras = normalisiereExtras(input.extras);
  for (const wahl of extras) {
    const extra = EXTRAS[wahl.id];
    if (extra.includedIn.includes(input.packageId)) {
      coveredItems.push({ label: extra.label, packageLabel: paket.label });
      continue;
    }
    if (extra.priceCents === null) {
      openItems.push({ label: extra.label, reason: extra.note });
      continue;
    }
    lines.push({
      label: extra.label,
      amountCents: extra.priceCents * wahl.quantity,
      detail:
        extra.unit === "pauschal"
          ? undefined
          : `${wahl.quantity} × ${formatMoney(extra.priceCents)} pro ${extra.unitLabel}`,
    });
  }

  const perVisitCents = lines.reduce((sum, l) => sum + l.amountCents, 0);

  // 4. Steuer nur, wenn tatsächlich pflichtig
  const vatCents = business.vatRegistered ? roundCents(perVisitCents * business.vatRate) : 0;
  const totalPerVisitCents = perVisitCents + vatCents;

  // 5. Monatspreis nach der gewählten Anzahl Termine
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
    const ersparnis = paketCents - packagePriceCents(sqm, input.packageId, "abo12");
    if (ersparnis > 0) {
      notices.push(
        `Mit dem Abo über 12 Monate zahlen Sie ${formatMoney(ersparnis)} weniger pro Reinigung.`,
      );
    }
  }
  if (visitsPerMonth > 0) {
    notices.push(
      `${FREQUENCY_LABEL[input.frequency]} — der Paketpreis gilt pro Reinigung.`,
    );
  }
  notices.push(
    business.vatRegistered ? business.priceNote.registered : business.priceNote.notRegistered,
  );
  notices.push(CONDITIONS_NOTE);

  return {
    input: { ...input, squareMeters: sqm, extras },
    lines,
    durationMinutes,
    extraSqm,
    perVisitCents,
    perMonthCents,
    visitsPerMonth,
    vatCents,
    totalPerVisitCents,
    openItems,
    coveredItems,
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
 * Der Quadratmeterpreis. Zwei Nachkommastellen reichen für 0.99 und 1.39,
 * drei für 0.825 — der Abopreis darf nicht auf 0.83 gerundet dastehen, sonst
 * stimmt die Staffel darunter nicht mehr.
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
