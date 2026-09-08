import assert from "node:assert/strict";
import { test } from "node:test";
import { business } from "@/config/business";
import { SERVICES } from "./catalog";
import { OutOfScopeError, calculateQuote, formatDuration } from "./engine";
import type { QuoteInput } from "./types";

const base: QuoteInput = {
  service: "unterhaltsreinigung",
  squareMeters: 80,
  bathrooms: 1,
  frequency: "einmalig",
  condition: "normal",
  extras: [],
  distanceKm: 5,
};

test("Summe der Positionen ergibt exakt den Nettobetrag", () => {
  const q = calculateQuote({ ...base, extras: ["fenster", "backofen"], bathrooms: 2, distanceKm: 25 });
  const sum = q.lines.reduce((s, l) => s + l.amountCents, 0);
  assert.equal(sum, q.netCents);
});

test("Brutto = Netto + USt, alles ganzzahlig in Cent", () => {
  const q = calculateQuote(base);
  assert.equal(q.netCents + q.vatCents, q.grossCents);
  for (const v of [q.netCents, q.vatCents, q.grossCents]) {
    assert.ok(Number.isInteger(v), `${v} ist nicht ganzzahlig`);
  }
  assert.equal(q.vatCents, Math.round(q.netCents * business.vatRate));
});

test("Engine ist deterministisch", () => {
  const a = calculateQuote({ ...base, extras: ["teppich", "fenster"] });
  const b = calculateQuote({ ...base, extras: ["fenster", "teppich"] });
  assert.deepEqual(a, b, "Reihenfolge der Extras darf das Ergebnis nicht ändern");
});

test("Mindestauftragswert wird nie unterschritten", () => {
  const q = calculateQuote({ ...base, squareMeters: 10, distanceKm: 1 });
  const beforeDiscount = q.lines
    .filter((l) => !l.label.startsWith("Rabatt"))
    .reduce((s, l) => s + l.amountCents, 0);
  assert.ok(
    beforeDiscount >= SERVICES.unterhaltsreinigung.minimumCents,
    `${beforeDiscount} liegt unter dem Mindestauftragswert`,
  );
});

test("Höhere Frequenz senkt den Preis pro Termin, monoton", () => {
  const preise = (["einmalig", "monatlich", "zweiwoechentlich", "woechentlich"] as const).map(
    (frequency) => calculateQuote({ ...base, frequency }).grossCents,
  );
  for (let i = 1; i < preise.length; i++) {
    assert.ok(preise[i] < preise[i - 1], `Rabattstufe ${i} ist nicht günstiger`);
  }
});

test("Schlechterer Zustand erhöht Preis und Dauer", () => {
  const normal = calculateQuote({ ...base, condition: "normal" });
  const stark = calculateQuote({ ...base, condition: "stark" });
  const extrem = calculateQuote({ ...base, condition: "extrem" });
  assert.ok(stark.grossCents > normal.grossCents);
  assert.ok(extrem.grossCents > stark.grossCents);
  assert.ok(extrem.durationMinutes > normal.durationMinutes);
});

test("Mehr Fläche kostet nie weniger", () => {
  let vorher = 0;
  for (let sqm = 20; sqm <= 400; sqm += 20) {
    const q = calculateQuote({ ...base, squareMeters: sqm });
    assert.ok(q.grossCents >= vorher, `Preissprung nach unten bei ${sqm} m²`);
    vorher = q.grossCents;
  }
});

test("Dauer ist mindestens 60 Minuten und auf 15 Minuten gerundet", () => {
  const q = calculateQuote({ ...base, squareMeters: 10 });
  assert.ok(q.durationMinutes >= 60);
  assert.equal(q.durationMinutes % 15, 0);
});

test("Außerhalb des Einzugsgebiets wird kein Preis erfunden", () => {
  assert.throws(
    () => calculateQuote({ ...base, distanceKm: 120 }),
    (e: unknown) => e instanceof OutOfScopeError && e.reason === "distance",
  );
  assert.throws(
    () => calculateQuote({ ...base, squareMeters: 2000 }),
    (e: unknown) => e instanceof OutOfScopeError && e.reason === "area",
  );
});

test("Doppelte Extras werden nur einmal berechnet", () => {
  const einfach = calculateQuote({ ...base, extras: ["backofen"] });
  const doppelt = calculateQuote({ ...base, extras: ["backofen", "backofen"] });
  assert.equal(doppelt.grossCents, einfach.grossCents);
});

test("Jedes Angebot trägt einen Unschärfe-Hinweis", () => {
  const q = calculateQuote(base);
  assert.ok(q.notices.some((n) => n.includes("Richtpreis")));
});

test("Alle Leistungen im Katalog sind berechenbar", () => {
  for (const id of Object.keys(SERVICES) as (keyof typeof SERVICES)[]) {
    const q = calculateQuote({ ...base, service: id });
    assert.ok(q.grossCents > 0, `${id} ergibt keinen Preis`);
  }
});

test("formatDuration ist lesbar", () => {
  assert.equal(formatDuration(90), "1 Std. 30 Min.");
  assert.equal(formatDuration(120), "2 Std.");
  assert.equal(formatDuration(45), "45 Min.");
});
