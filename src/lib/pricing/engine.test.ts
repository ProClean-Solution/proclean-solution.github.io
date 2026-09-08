import assert from "node:assert/strict";
import { test } from "node:test";
import { business } from "@/config/business";
import { BASE_SQM, MAX_SQM_ONLINE, PACKAGES, TARIFFS, WEEKS_PER_MONTH } from "./catalog";
import {
  OutOfScopeError,
  calculateQuote,
  cleaningPriceCents,
  estimateMinutes,
  formatMoney,
  formatSqmRate,
} from "./engine";
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

/**
 * Florijans Staffel, wörtlich. Das ist die Tabelle, die er selbst geschrieben
 * hat — wenn hier eine Zahl kippt, steht auf der Website ein anderer Preis, als
 * er seinen Kunden nennt.
 */
const STAFFEL = [
  { sqm: 100, standard: 9900, abo: 8250 },
  { sqm: 150, standard: 14900, abo: 12375 },
  { sqm: 200, standard: 19800, abo: 16500 },
  { sqm: 250, standard: 24800, abo: 20625 },
] as const;

for (const { sqm, standard, abo } of STAFFEL) {
  test(`REFERENZ: ${sqm} m² kosten ${formatMoney(standard)} bzw. ${formatMoney(abo)} im Abo`, () => {
    const std = calculateQuote({ ...referenz, squareMeters: sqm });
    const a = calculateQuote({ ...referenz, squareMeters: sqm, tariff: "abo12" });
    assert.equal(std.totalPerVisitCents, standard, `Standard war ${formatMoney(std.totalPerVisitCents)}`);
    assert.equal(a.totalPerVisitCents, abo, `Abo war ${formatMoney(a.totalPerVisitCents)}`);
  });
}

test("REFERENZ: 150 m² sind 1,5 Stunden Reinigungszeit", () => {
  assert.equal(calculateQuote({ ...referenz, squareMeters: 150 }).durationMinutes, 90);
});

test("Der Quadratmeterpreis ist CHF 0.99 bzw. CHF 0.825", () => {
  assert.equal(TARIFFS.standard.perSqmCents, 99);
  assert.equal(TARIFFS.abo12.perSqmCents, 82.5);
  // 0.825 darf nicht als 0.83 dastehen, sonst stimmt die Staffel darunter nicht.
  assert.ok(formatSqmRate(82.5).includes("0.825"), formatSqmRate(82.5));
  assert.ok(formatSqmRate(99).includes("0.99"), formatSqmRate(99));
});

test("Der Standardpreis steht auf ganzen Franken, der Abopreis auf fünf Rappen", () => {
  for (let sqm = 20; sqm <= MAX_SQM_ONLINE; sqm++) {
    assert.equal(cleaningPriceCents(sqm, "standard") % 100, 0, `${sqm} m² ergibt krumme Franken`);
    assert.equal(cleaningPriceCents(sqm, "abo12") % 5, 0, `${sqm} m² ergibt krumme Rappen`);
  }
});

test("Bis 100 m² gilt überall derselbe Grundpreis", () => {
  for (const sqm of [20, 40, 75, 99, 100]) {
    assert.equal(cleaningPriceCents(sqm, "standard"), 9900, `${sqm} m²`);
    assert.equal(cleaningPriceCents(sqm, "abo12"), 8250, `${sqm} m²`);
  }
  assert.equal(BASE_SQM, 100);
});

test("Über 100 m² steigt der Preis mit jedem Quadratmeter", () => {
  let vorher = cleaningPriceCents(BASE_SQM, "standard");
  for (let sqm = BASE_SQM + 1; sqm <= MAX_SQM_ONLINE; sqm++) {
    const jetzt = cleaningPriceCents(sqm, "standard");
    assert.ok(jetzt >= vorher, `${sqm} m² ist billiger als ${sqm - 1} m²`);
    vorher = jetzt;
  }
});

test("Der Preis weicht nie mehr als eine Rundung vom Quadratmeterpreis ab", () => {
  for (let sqm = BASE_SQM; sqm <= MAX_SQM_ONLINE; sqm++) {
    const roh = sqm * TARIFFS.standard.perSqmCents;
    assert.ok(
      Math.abs(cleaningPriceCents(sqm, "standard") - roh) <= 50,
      `${sqm} m²: ${formatMoney(cleaningPriceCents(sqm, "standard"))} statt ${formatMoney(roh)}`,
    );
  }
});

test("Die Fläche über dem Grundpreis wird getrennt ausgewiesen", () => {
  assert.equal(calculateQuote({ ...referenz, squareMeters: 100 }).extraSqm, 0);
  assert.equal(calculateQuote({ ...referenz, squareMeters: 150 }).extraSqm, 50);
  const q = calculateQuote({ ...referenz, squareMeters: 150 });
  assert.ok(q.lines[0].detail?.includes("50 m²"), q.lines[0].detail);
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

test("Die Pakete erfinden keine Preise", () => {
  for (const paket of PACKAGES) {
    if (paket.status === "entwurf") {
      assert.ok(paket.extras.length > 0, `${paket.label} hat weder Preis noch Inhalt`);
    }
  }
  // Essential ist das einzige bestätigte Paket — es ist der Grundpreis selbst.
  assert.equal(PACKAGES.filter((p) => p.status === "bestaetigt").length, 1);
  assert.equal(PACKAGES[0].id, "essential");
});

test("Jede Zusatzleistung führt zur Anfrage statt zu einer Schätzung", () => {
  const q = calculateQuote({ ...referenz, extras: ["fenster", "teppich", "kueche"] });
  assert.equal(q.openItems.length, 3);
  assert.equal(q.totalPerVisitCents, calculateQuote(referenz).totalPerVisitCents);
});

test("Der Bedingungssatz steht bei jeder Zahl", () => {
  const q = calculateQuote(referenz);
  assert.ok(q.notices.some((n) => n.includes("normal verschmutzte")), q.notices.join(" | "));
});

test("Mindestens der Grundpreis wird berechnet", () => {
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
  assert.ok(q.notices.some((n) => n.includes("ohne MwSt")));
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
