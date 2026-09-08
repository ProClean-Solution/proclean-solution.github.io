import assert from "node:assert/strict";
import { test } from "node:test";
import { KNOWLEDGE } from "./knowledge";
import { answer, normalize, topQuestions } from "./engine";

/** Echte Kundenformulierungen -> erwarteter Wissenseintrag. */
const ERWARTUNGEN: Array<[string, string]> = [
  ["Was kostet das?", "preis-allgemein"],
  ["wie teuer ist eine reinigung", "preis-allgemein"],
  ["Wieviel kostet putzen?", "preis-allgemein"],
  ["gibt es rabatt wenn ihr regelmässig kommt", "preis-abo"],
  ["Was ist alles inklusive?", "leistung-inklusive"],
  ["muss ich putzmittel stellen", "leistung-inklusive"],
  ["macht ihr endreinigung bei auszug", "leistung-endreinigung"],
  ["Reinigen Sie auch Bueros?", "leistung-buero"],
  ["putzt ihr fenster", "leistung-fenster"],
  ["muss ich zuhause sein", "ablauf-schluessel"],
  ["wie lange dauert das", "ablauf-dauer"],
  ["wie kann ich einen termin buchen", "termin-buchen"],
  ["geht das auch kurzfristig", "termin-kurzfristig"],
  ["kann ich absagen", "termin-absagen"],
  ["seid ihr versichert", "vertrauen-versicherung"],
  ["was wenn ich unzufrieden bin", "vertrauen-qualitaet"],
  ["wie bezahle ich", "organisation-bezahlen"],
  ["wann seid ihr erreichbar", "organisation-zeiten"],
  ["benutzt ihr bio mittel", "organisation-umwelt"],
  ["in welchem gebiet arbeitet ihr", "termin-gebiet"],
];

test("normalize faltet Umlaute und Satzzeichen", () => {
  assert.equal(normalize("Wieviel kostet es?"), "wieviel kostet es");
  assert.equal(normalize("GRÖSSE"), "groesse");
  assert.equal(normalize("  Straße!  "), "strasse");
});

test("typische Kundenfragen treffen den richtigen Eintrag", () => {
  const fehler: string[] = [];
  for (const [frage, erwartet] of ERWARTUNGEN) {
    const res = answer(frage);
    const getroffen =
      res.matched?.id === erwartet || res.suggestions.some((s) => s.id === erwartet);
    if (!getroffen) {
      fehler.push(`"${frage}" -> ${res.kind} / ${res.matched?.id ?? "kein Treffer"} (erwartet ${erwartet})`);
    }
  }
  assert.deepEqual(fehler, [], fehler.join(" | "));
});

test("mindestens 80 Prozent der Fragen ergeben eine direkte Antwort", () => {
  const direkt = ERWARTUNGEN.filter(([f]) => answer(f).kind === "antwort").length;
  const quote = direkt / ERWARTUNGEN.length;
  assert.ok(quote >= 0.8, `nur ${Math.round(quote * 100)} Prozent direkte Antworten`);
});

test("ANTWORTGARANTIE: jede Eingabe liefert Text und mindestens eine Handlungsoption", () => {
  const eingaben = [
    "",
    "   ",
    "?",
    "asdfghjkl",
    "1234567890",
    "Können Sie mein Auto reparieren?",
    "Wie ist das Wetter morgen in Tokio",
    "a".repeat(500),
    "<script>alert(1)</script>",
    "DROP TABLE bookings;",
  ];
  for (const e of eingaben) {
    const res = answer(e);
    assert.ok(res.text.trim().length > 0, `leerer Text bei ${JSON.stringify(e.slice(0, 30))}`);
    assert.ok(res.actions.length > 0, `keine Aktion bei ${JSON.stringify(e.slice(0, 30))}`);
  }
});

test("themenfremde Fragen werden weitergeleitet statt erfunden", () => {
  for (const frage of ["Können Sie mein Auto reparieren?", "Wer hat die WM 2014 gewonnen?"]) {
    const res = answer(frage);
    assert.notEqual(res.kind, "antwort", `"${frage}" wurde faelschlich beantwortet`);
    assert.ok(res.actions.some((a) => a.href.startsWith("tel:") || a.href === "/kontakt"));
  }
});

test("answer wirft niemals", () => {
  const boese = [null, undefined, "", " ", "%%%"] as unknown as string[];
  for (const e of boese) assert.doesNotThrow(() => answer(e));
});

test("Wissensbasis ist konsistent", () => {
  const ids = new Set<string>();
  for (const e of KNOWLEDGE) {
    assert.ok(!ids.has(e.id), `doppelte id: ${e.id}`);
    ids.add(e.id);
    assert.ok(e.answer.length > 40, `Antwort zu knapp: ${e.id}`);
    assert.ok(e.keywords.length >= 3, `zu wenige Stichwoerter: ${e.id}`);
  }
});

test("topQuestions liefert echte Eintraege", () => {
  const top = topQuestions();
  assert.equal(top.length, 5);
  for (const t of top) assert.ok(KNOWLEDGE.includes(t));
});
