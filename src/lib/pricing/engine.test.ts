import assert from "node:assert/strict";
import { test } from "node:test";
import { business } from "@/config/business";
import { MAX_SQM_ONLINE, TARIFFS, WEEKS_PER_MONTH } from "./catalog";
import { OutOfScopeError, calculateQuote, estimateMinutes, formatMoney } from "./engine";
import type { QuoteInput } from "./types";

/** Florijans Referenzfall: 100 m² Büro, 2 Nasszellen, Zürich, wöchentlich. */
const referenz: QuoteInput = {
  objectType: "buero",
  squareMeters: 100,
  tariff: "standard",
  frequency: "woechentlich",
  extras: [],
  distanceKm: 10,
};

test("REFERENZ: 100 m² Büro wöchentlich kostet CHF 99.00 pro Termin", () => {
  const q = calculateQuote(referenz);
  assert.equal(q.totalPerVisitCents, 9900, `war ${formatMoney(q.totalPerVisitCents)}`);
});

test("REFERENZ: derselbe Fall kostet CHF 396.00 im Monat", () => {
  const q = calculateQuote(referenz);
  assert.equal(q.perMonthCents, 39600, `war ${formatMoney(q.perMonthCents ?? 0)}`);
});

test("REFERENZ: im Abo CHF 82.50 pro Termin und CHF 330.00 im Monat", () => {
  const q = calculateQuote({ ...referenz, tariff: "abo12" });
  assert.equal(q.totalPerVisitCents, 8250, `war ${formatMoney(q.totalPerVisitCents)}`);
  assert.equal(q.perMonthCents, 33000, `war ${formatMoney(q.perMonthCents ?? 0)}`);
});

test("REFERENZ: 150 m² sind 1,5 Stunden und im Abo CHF 123.75", () => {
  const q = calculateQuote({ ...referenz, squareMeters: 150, tariff: "abo12" });
  assert.equal(q.durationMinutes, 90);
  assert.equal(q.totalPerVisitCents, 12375, `war ${formatMoney(q.totalPerVisitCents)}`);
});

test("REFERENZ: 150 m² im Standardtarif kosten CHF 148.50", () => {
  const q = calculateQuote({ ...referenz, squareMeters: 150 });
  assert.equal(q.totalPerVisitCents, 14850, `war ${formatMoney(q.totalPerVisitCents)}`);
});

test("REFERENZ: 100 m² sind eine Stunde Arbeit", () => {
  assert.equal(calculateQuote(referenz).durationMinutes, 60);
});

test("Zimmerzahl kommt in der Eingabe gar nicht vor", () => {
  // Absichtlich als Typprüfung formuliert: es gibt kein Feld dafür.
  const keys = Object.keys(referenz);
  assert.ok(!keys.some((k) => /zimmer|room|bath|nasszelle/i.test(k)));
});

test("Doppelte Fläche kostet doppelt so viel", () => {
  const einfach = calculateQuote(referenz);
  const doppelt = calculateQuote({ ...referenz, squareMeters: 200 });
  assert.equal(doppelt.totalPerVisitCents, einfach.totalPerVisitCents * 2);
  assert.equal(doppelt.durationMinutes, 120);
});

test("Mindestens eine Stunde wird berechnet", () => {
  const klein = calculateQuote({ ...referenz, squareMeters: 20 });
  assert.equal(klein.durationMinutes, 60);
  assert.equal(klein.totalPerVisitCents, 9900);
});

test("Dauer läuft in Viertelstunden", () => {
  for (const sqm of [20, 55, 100, 137, 180, 250, 300]) {
    assert.equal(estimateMinutes(sqm) % 15, 0, `${sqm} m² ergibt krumme Minuten`);
  }
});

test("Abo ist immer günstiger als Standard, nie umgekehrt", () => {
  for (const sqm of [20, 60, 100, 150, 220, 300]) {
    const std = calculateQuote({ ...referenz, squareMeters: sqm, tariff: "standard" });
    const abo = calculateQuote({ ...referenz, squareMeters: sqm, tariff: "abo12" });
    assert.ok(abo.totalPerVisitCents < std.totalPerVisitCents, `bei ${sqm} m² nicht günstiger`);
  }
});

test("Der Aborabatt beträgt durchgehend 16,67 Prozent", () => {
  const std = TARIFFS.standard.hourlyCents;
  const abo = TARIFFS.abo12.hourlyCents;
  const rabatt = (std - abo) / std;
  assert.ok(Math.abs(rabatt - 0.1667) < 0.0005, `Rabatt ist ${(rabatt * 100).toFixed(2)} %`);
});

test("Summe der Positionen ergibt exakt den Terminpreis", () => {
  const q = calculateQuote({ ...referenz, squareMeters: 150, distanceKm: 30 });
  assert.equal(
    q.lines.reduce((s, l) => s + l.amountCents, 0),
    q.perVisitCents,
  );
});

test("Ohne MWST-Pflicht wird keine Steuer ausgewiesen", () => {
  const q = calculateQuote(referenz);
  assert.equal(business.vatRegistered, false, "Annahme im Test veraltet");
  assert.equal(q.vatCents, 0);
  assert.equal(q.totalPerVisitCents, q.perVisitCents);
  assert.ok(q.notices.some((n) => n.includes("keine Mehrwertsteuer")));
});

test("Fensterreinigung wird nicht geschätzt, sondern als offen ausgewiesen", () => {
  const q = calculateQuote({ ...referenz, extras: ["fenster"] });
  assert.equal(q.openItems.length, 1);
  assert.equal(q.openItems[0].label, "Fensterreinigung");
  // Der Terminpreis darf sich dadurch nicht verändern.
  assert.equal(q.totalPerVisitCents, calculateQuote(referenz).totalPerVisitCents);
});

test("Einmalige Reinigung hat keinen Monatspreis", () => {
  const q = calculateQuote({ ...referenz, frequency: "einmalig" });
  assert.equal(q.perMonthCents, null);
  assert.equal(q.visitsPerMonth, 0);
});

test("Monatspreis folgt der Vier-Wochen-Rechnung", () => {
  const q = calculateQuote(referenz);
  assert.equal(q.visitsPerMonth, WEEKS_PER_MONTH);
  assert.equal(q.perMonthCents, q.totalPerVisitCents * WEEKS_PER_MONTH);
});

test("Ausserhalb des Gebiets wird kein Preis erfunden", () => {
  assert.throws(
    () => calculateQuote({ ...referenz, distanceKm: 80 }),
    (e: unknown) => e instanceof OutOfScopeError && e.reason === "distance",
  );
  assert.throws(
    () => calculateQuote({ ...referenz, squareMeters: MAX_SQM_ONLINE + 1 }),
    (e: unknown) => e instanceof OutOfScopeError && e.reason === "area",
  );
});

test("Engine ist deterministisch", () => {
  const a = calculateQuote({ ...referenz, extras: ["fenster"] });
  const b = calculateQuote({ ...referenz, extras: ["fenster", "fenster"] });
  assert.deepEqual(a, b);
});

test("Beträge sind ganzzahlige Rappen", () => {
  const q = calculateQuote({ ...referenz, squareMeters: 137, tariff: "abo12" });
  for (const v of [q.perVisitCents, q.vatCents, q.totalPerVisitCents]) {
    assert.ok(Number.isInteger(v), `${v} ist nicht ganzzahlig`);
  }
  for (const l of q.lines) assert.ok(Number.isInteger(l.amountCents));
});

test("Preise werden in Franken formatiert", () => {
  assert.ok(formatMoney(9900).includes("99"));
  assert.ok(/CHF|Fr\./.test(formatMoney(9900)), formatMoney(9900));
});
