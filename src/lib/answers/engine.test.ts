import assert from "node:assert/strict";
import { test } from "node:test";
import { KNOWLEDGE, UNCONFIRMED } from "./knowledge";
import { answer, normalize, topQuestions } from "./engine";

/** Echte Kundenformulierungen -> erwarteter Wissenseintrag. */
const ERWARTUNGEN: Array<[string, string]> = [
  ["Was kostet das?", "preis-allgemein"],
  ["wie teuer ist eine reinigung", "preis-allgemein"],
  ["was ist der stundensatz", "preis-allgemein"],
  ["gibt es ein abo", "preis-abo"],
  ["was kostet es mit mindestlaufzeit", "preis-abo"],
  ["kostet es mehr wenn ich mehr zimmer habe", "preis-zimmer"],
  ["kommt noch mwst dazu", "preis-mwst"],
  ["was kostet fensterreinigung", "preis-fenster"],
  ["Was ist alles inklusive?", "leistung-inklusive"],
  ["muss ich putzmittel stellen", "leistung-inklusive"],
  ["werden die abfalleimer geleert", "leistung-inklusive"],
  ["Reinigen Sie auch Bueros?", "leistung-buero"],
  ["reinigt ihr privatwohnungen", "leistung-wohnung"],
  ["macht ihr endreinigung bei auszug", "leistung-sonderfall"],
  ["wie lange dauert das", "ablauf-dauer"],
  ["muss ich anwesend sein", "ablauf-schluessel"],
  ["koennt ihr abends reinigen", "ablauf-wann"],
  ["wie komme ich zu einem termin", "termin-buchen"],
  ["kann ich einen termin verschieben", "termin-absagen"],
  ["arbeitet ihr in zuerich", "termin-gebiet"],
  ["seid ihr versichert", "vertrauen-versicherung"],
  ["was wenn ich unzufrieden bin", "vertrauen-qualitaet"],
  ["wie bezahle ich", "organisation-bezahlen"],
  ["wann seid ihr erreichbar", "organisation-zeiten"],
  ["welche reinigungsmittel benutzt ihr", "organisation-umwelt"],
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

test("REGRESSION: Fensterfragen bekommen nie die allgemeine Preisauskunft", () => {
  // Gefunden am 8.9.2026: "was kostet fensterreinigung" landete auf
  // preis-allgemein und nannte CHF 99 pro Stunde — obwohl Fenster darin
  // ausdruecklich NICHT enthalten sind. Eine falsche Preisauskunft ist
  // schlimmer als gar keine.
  const fragen = [
    "was kostet fensterreinigung",
    "was kostet die fensterreinigung",
    "preis fensterreinigung",
    "fenster preis",
    "wieviel kostet fenster putzen",
  ];
  for (const f of fragen) {
    const r = answer(f);
    assert.notEqual(
      r.matched?.id,
      "preis-allgemein",
      `"${f}" bekommt den allgemeinen Stundenpreis statt der Fensterauskunft`,
    );
  }
});

test("seltene Woerter schlagen haeufige", () => {
  // "kostet" steht in vielen Eintraegen, "zimmer" nur in einem.
  const r = answer("was kostet das mit mehreren zimmern");
  assert.equal(r.matched?.id ?? r.suggestions[0]?.id, "preis-zimmer");
});

test("jeder Eintrag traegt einen Belegstatus", () => {
  for (const e of KNOWLEDGE) {
    assert.ok(["bestaetigt", "entwurf"].includes(e.status), `${e.id} ohne Status`);
  }
  // Diese Zahl soll auffallen und schrumpfen, bis sie null ist.
  assert.ok(UNCONFIRMED.length <= 13, `${UNCONFIRMED.length} unbestaetigte Eintraege`);
});

test("bestaetigte Preisaussagen nennen die echten Zahlen", () => {
  const preis = KNOWLEDGE.find((e) => e.id === "preis-allgemein");
  assert.ok(preis?.answer.includes("99"), "Stundenpreis fehlt");
  const abo = KNOWLEDGE.find((e) => e.id === "preis-abo");
  assert.ok(abo?.answer.includes("82.50"), "Abopreis fehlt");
  assert.ok(abo?.answer.includes("330"), "Abo-Monatspreis fehlt");
});

test("topQuestions liefert echte Eintraege", () => {
  const top = topQuestions();
  assert.equal(top.length, 5);
  for (const t of top) assert.ok(KNOWLEDGE.includes(t));
});
