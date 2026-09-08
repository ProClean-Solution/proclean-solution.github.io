import assert from "node:assert/strict";
import { test } from "node:test";
import { business } from "@/config/business";
import {
  BASE_SQM,
  EXTRAS,
  EXTRA_LIST,
  MAX_SQM_ONLINE,
  PACKAGES,
  TARIFFS,
  VISITS_PER_MONTH,
} from "./catalog";
import {
  OutOfScopeError,
  calculateQuote,
  estimateMinutes,
  formatMoney,
  formatSqmRate,
  packagePriceCents,
} from "./engine";
import type { PackageId, QuoteInput } from "./types";

/** Referenzfall: 100 m² Büro, Zürich, Essential, viermal im Monat. */
const referenz: QuoteInput = {
  objectType: "buero",
  squareMeters: 100,
  packageId: "essential",
  tariff: "standard",
  frequency: "m4",
  extras: [],
  distanceKm: 10,
};

// ---------------------------------------------------------------- Pakete

/**
 * Florijans Paketpreise bis 100 m², wörtlich. Die Abowerte sind kein
 * eigener Satz Zahlen, sondern sein Verhältnis 82.50/99 auf jedes Paket
 * angewandt — wenn hier eine Zahl kippt, stimmt der Rabatt nicht mehr.
 */
const PAKETPREISE: Array<{ id: PackageId; standard: number; abo: number }> = [
  { id: "essential", standard: 9900, abo: 8250 },
  { id: "plus", standard: 13900, abo: 11585 },
  { id: "complete", standard: 17900, abo: 14915 },
];

for (const { id, standard, abo } of PAKETPREISE) {
  test(`REFERENZ: ${id} kostet bis 100 m² ${formatMoney(standard)}, im Abo ${formatMoney(abo)}`, () => {
    const s = calculateQuote({ ...referenz, packageId: id });
    const a = calculateQuote({ ...referenz, packageId: id, tariff: "abo12" });
    assert.equal(s.totalPerVisitCents, standard, `Einzeln war ${formatMoney(s.totalPerVisitCents)}`);
    assert.equal(a.totalPerVisitCents, abo, `Abo war ${formatMoney(a.totalPerVisitCents)}`);
  });
}

test("REFERENZ: Essential viermal im Monat kostet CHF 396.00", () => {
  assert.equal(calculateQuote(referenz).perMonthCents, 39600);
});

test("REFERENZ: Essential im Abo kostet CHF 330.00 im Monat", () => {
  const q = calculateQuote({ ...referenz, tariff: "abo12" });
  assert.equal(q.totalPerVisitCents, 8250);
  assert.equal(q.perMonthCents, 33000);
});

test("REFERENZ: 150 m² Essential kosten CHF 149.00, im Abo CHF 123.75", () => {
  const s = calculateQuote({ ...referenz, squareMeters: 150 });
  const a = calculateQuote({ ...referenz, squareMeters: 150, tariff: "abo12" });
  assert.equal(s.totalPerVisitCents, 14900, `war ${formatMoney(s.totalPerVisitCents)}`);
  assert.equal(a.totalPerVisitCents, 12375, `war ${formatMoney(a.totalPerVisitCents)}`);
});

test("REFERENZ: Essentials Flächenstaffel steht", () => {
  for (const [sqm, cents] of [
    [100, 9900],
    [150, 14900],
    [200, 19800],
    [250, 24800],
  ] as const) {
    assert.equal(
      packagePriceCents(sqm, "essential", "standard"),
      cents,
      `${sqm} m² war ${formatMoney(packagePriceCents(sqm, "essential", "standard"))}`,
    );
  }
});

test("Der Aborabatt ist bei jedem Paket derselbe 16,67 Prozent", () => {
  for (const paket of PACKAGES) {
    const s = paket.baseCents;
    const a = packagePriceCents(BASE_SQM, paket.id, "abo12");
    const rabatt = (s - a) / s;
    assert.ok(
      Math.abs(rabatt - 0.1667) < 0.0006,
      `${paket.label}: ${(rabatt * 100).toFixed(2)} % statt 16,67 %`,
    );
  }
});

test("Plus liegt zwischen Essential und Complete, bei jeder Fläche", () => {
  for (const sqm of [20, 100, 137, 200, 300]) {
    const e = packagePriceCents(sqm, "essential", "standard");
    const p = packagePriceCents(sqm, "plus", "standard");
    const c = packagePriceCents(sqm, "complete", "standard");
    assert.ok(e < p && p < c, `bei ${sqm} m²: ${e} / ${p} / ${c}`);
  }
});

test("Genau ein Paket trägt die Auszeichnung", () => {
  const beliebt = PACKAGES.filter((p) => p.beliebt);
  assert.equal(beliebt.length, 1);
  assert.equal(beliebt[0].id, "plus");
});

test("Jedes Paket nennt nur, was es zum vorherigen dazulegt", () => {
  // Sonst stünde derselbe Punkt in der wachsenden Karte doppelt.
  const gesehen = new Set<string>();
  for (const paket of PACKAGES) {
    for (const add of paket.adds) {
      assert.ok(!gesehen.has(add), `"${add}" steht in mehr als einem Paket`);
      gesehen.add(add);
    }
  }
  assert.equal(PACKAGES[0].adds.length, 0, "Essential ist der Grundumfang");
});

// ---------------------------------------------------------------- Fläche

test("Bis 100 m² gilt überall der Grundpreis des Pakets", () => {
  for (const paket of PACKAGES) {
    for (const sqm of [20, 40, 75, 99, 100]) {
      assert.equal(packagePriceCents(sqm, paket.id, "standard"), paket.baseCents, `${sqm} m²`);
    }
  }
  assert.equal(BASE_SQM, 100);
});

test("Über 100 m² steigt der Preis mit jedem Quadratmeter", () => {
  for (const paket of PACKAGES) {
    let vorher = packagePriceCents(BASE_SQM, paket.id, "standard");
    for (let sqm = BASE_SQM + 1; sqm <= MAX_SQM_ONLINE; sqm++) {
      const jetzt = packagePriceCents(sqm, paket.id, "standard");
      assert.ok(jetzt >= vorher, `${paket.label} bei ${sqm} m² billiger als bei ${sqm - 1} m²`);
      vorher = jetzt;
    }
  }
});

test("Einzelpreise stehen auf ganzen Franken, Abopreise auf fünf Rappen", () => {
  for (const paket of PACKAGES) {
    for (let sqm = 20; sqm <= MAX_SQM_ONLINE; sqm++) {
      assert.equal(packagePriceCents(sqm, paket.id, "standard") % 100, 0, `${sqm} m²`);
      assert.equal(packagePriceCents(sqm, paket.id, "abo12") % 5, 0, `${sqm} m²`);
    }
  }
});

test("Doppelte Fläche kostet doppelt so viel", () => {
  const einfach = calculateQuote(referenz);
  const doppelt = calculateQuote({ ...referenz, squareMeters: 200 });
  assert.equal(doppelt.totalPerVisitCents, einfach.totalPerVisitCents * 2);
  assert.equal(doppelt.durationMinutes, 120);
});

test("Die Fläche über dem Grundpreis wird getrennt ausgewiesen", () => {
  assert.equal(calculateQuote(referenz).extraSqm, 0);
  const q = calculateQuote({ ...referenz, squareMeters: 150 });
  assert.equal(q.extraSqm, 50);
  assert.ok(q.lines[0].detail?.includes("50 m²"), q.lines[0].detail);
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

test("Zimmerzahl kommt in der Eingabe gar nicht vor", () => {
  const keys = Object.keys(referenz);
  assert.ok(!keys.some((k) => /zimmer|room|bath|nasszelle/i.test(k)));
});

// ---------------------------------------------------------------- Termine

test("Der Monatspreis ist der Paketpreis mal der Anzahl Termine", () => {
  for (const f of ["m1", "m2", "m3", "m4"] as const) {
    const q = calculateQuote({ ...referenz, frequency: f });
    assert.equal(q.visitsPerMonth, VISITS_PER_MONTH[f]);
    assert.equal(q.perMonthCents, q.totalPerVisitCents * VISITS_PER_MONTH[f], f);
  }
});

test("Alle vier Häufigkeiten sind wählbar, dreimal im Monat eingeschlossen", () => {
  assert.equal(VISITS_PER_MONTH.m3, 3);
  const q = calculateQuote({ ...referenz, frequency: "m3" });
  assert.equal(q.perMonthCents, 29700);
});

test("Einmalige Reinigung hat keinen Monatspreis", () => {
  const q = calculateQuote({ ...referenz, frequency: "einmalig" });
  assert.equal(q.perMonthCents, null);
  assert.equal(q.visitsPerMonth, 0);
});

test("Ein Abo mit einer einzelnen Reinigung gibt es nicht", () => {
  assert.throws(
    () => calculateQuote({ ...referenz, tariff: "abo12", frequency: "einmalig" }),
    (e: unknown) => e instanceof OutOfScopeError && e.reason === "tarif",
  );
});

// ---------------------------------------------------- Zusatzleistungen

test("Eine pauschale Zusatzleistung schlägt genau einmal auf", () => {
  const q = calculateQuote({ ...referenz, extras: [{ id: "geschirr", quantity: 1 }] });
  assert.equal(q.totalPerVisitCents, 9900 + 990);
});

test("Mengenabhängige Leistungen rechnen mit der Menge", () => {
  const fenster = calculateQuote({
    ...referenz,
    extras: [{ id: "fenster-beidseitig", quantity: 12 }],
  });
  assert.equal(fenster.totalPerVisitCents, 9900 + 750 * 12);

  const stuehle = calculateQuote({ ...referenz, extras: [{ id: "stuehle", quantity: 8 }] });
  assert.equal(stuehle.totalPerVisitCents, 9900 + 250 * 8);
});

test("Eine Pauschale lässt sich nicht durch eine Menge vervielfachen", () => {
  const q = calculateQuote({ ...referenz, extras: [{ id: "desinfektion", quantity: 7 }] });
  assert.equal(q.totalPerVisitCents, 9900 + 1990);
});

test("Was das Paket schon enthält, wird nicht ein zweites Mal berechnet", () => {
  const q = calculateQuote({
    ...referenz,
    packageId: "plus",
    extras: [{ id: "kuechenzeile", quantity: 1 }],
  });
  assert.equal(q.totalPerVisitCents, 13900, `war ${formatMoney(q.totalPerVisitCents)}`);
  assert.equal(q.coveredItems.length, 1);
  assert.equal(q.coveredItems[0].packageLabel, "Office Plus");
  // Im Grundpaket kostet dieselbe Leistung sehr wohl etwas.
  const essential = calculateQuote({
    ...referenz,
    extras: [{ id: "kuechenzeile", quantity: 1 }],
  });
  assert.equal(essential.totalPerVisitCents, 9900 + 1490);
});

test("Teppichreinigung bekommt keinen erfundenen Preis", () => {
  const q = calculateQuote({ ...referenz, extras: [{ id: "teppich", quantity: 30 }] });
  assert.equal(q.openItems.length, 1);
  assert.equal(q.openItems[0].label, "Teppich-Tiefenreinigung");
  assert.equal(q.totalPerVisitCents, 9900);
});

test("Jede Zusatzleistung hat entweder einen Preis oder einen Grund", () => {
  for (const extra of EXTRA_LIST) {
    if (extra.priceCents === null) {
      assert.ok(extra.note.length > 20, `${extra.label} ohne Erklärung`);
    } else {
      assert.ok(Number.isInteger(extra.priceCents) && extra.priceCents > 0, extra.label);
      assert.ok(extra.priceCents % 5 === 0, `${extra.label} ist nicht auf fünf Rappen`);
    }
    if (extra.unit === "pauschal") assert.equal(extra.unitLabel, "");
    else assert.ok(extra.unitLabel.length > 0, `${extra.label} ohne Einheit`);
  }
});

test("Die Fensterreinigung innen steckt in Complete, die Aussenseite nicht", () => {
  assert.ok(EXTRAS["fenster-innen"].includedIn.includes("complete"));
  assert.ok(!EXTRAS["fenster-beidseitig"].includedIn.includes("complete"));
});

test("Doppelt angehakte Leistungen werden zusammengezählt, nicht verdoppelt gelistet", () => {
  const q = calculateQuote({
    ...referenz,
    extras: [
      { id: "stuehle", quantity: 4 },
      { id: "stuehle", quantity: 6 },
    ],
  });
  assert.equal(q.lines.filter((l) => l.label === "Stühle reinigen").length, 1);
  assert.equal(q.totalPerVisitCents, 9900 + 250 * 10);
});

// ---------------------------------------------------------------- Rahmen

test("Summe der Positionen ergibt exakt den Terminpreis", () => {
  const q = calculateQuote({
    ...referenz,
    squareMeters: 150,
    distanceKm: 30,
    packageId: "plus",
    extras: [
      { id: "stuehle", quantity: 6 },
      { id: "desinfektion", quantity: 1 },
    ],
  });
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

test("Der Bedingungssatz steht bei jeder Zahl", () => {
  assert.ok(calculateQuote(referenz).notices.some((n) => n.includes("normal verschmutzte")));
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
  const a = calculateQuote({ ...referenz, extras: [{ id: "geschirr", quantity: 1 }] });
  const b = calculateQuote({
    ...referenz,
    extras: [
      { id: "geschirr", quantity: 1 },
      { id: "geschirr", quantity: 0 },
    ],
  });
  assert.deepEqual(a, b);
});

test("Beträge sind ganzzahlige Rappen", () => {
  const q = calculateQuote({
    ...referenz,
    squareMeters: 137,
    packageId: "complete",
    tariff: "abo12",
    extras: [{ id: "stuehle", quantity: 3 }],
  });
  for (const v of [q.perVisitCents, q.vatCents, q.totalPerVisitCents]) {
    assert.ok(Number.isInteger(v), `${v} ist nicht ganzzahlig`);
  }
  for (const l of q.lines) assert.ok(Number.isInteger(l.amountCents));
});

test("Preise werden in Franken formatiert", () => {
  assert.ok(formatMoney(9900).includes("99"));
  assert.ok(/CHF|Fr\./.test(formatMoney(9900)), formatMoney(9900));
  assert.ok(formatSqmRate(99).includes("0.99"), formatSqmRate(99));
  assert.ok(formatSqmRate(82.5).includes("0.825"), formatSqmRate(82.5));
});
