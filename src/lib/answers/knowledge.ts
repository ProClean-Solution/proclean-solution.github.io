export type AnswerCategory =
  | "preis"
  | "leistung"
  | "ablauf"
  | "termin"
  | "vertrauen"
  | "organisation";

/**
 * Belegstatus einer Antwort.
 *
 * `bestaetigt` — Florijan hat den Inhalt so genannt.
 * `entwurf`    — von mir plausibel vorformuliert, aber NICHT bestätigt.
 *                Muss vor dem Livegang geprüft werden, sonst steht eine
 *                Behauptung über sein Geschäft auf der Website, die niemand
 *                überprüft hat.
 */
export type Status = "bestaetigt" | "entwurf";

export interface AnswerAction {
  label: string;
  href: string;
}

export interface KnowledgeEntry {
  id: string;
  category: AnswerCategory;
  status: Status;
  /** Die Frage in der Formulierung, die ein Kunde benutzen würde. */
  question: string;
  answer: string;
  /** Alternative Formulierungen und Stichwörter — treibt die Trefferquote. */
  keywords: string[];
  action?: AnswerAction;
}

/**
 * Die Wissensbasis. Jede Antwort ist von Hand geschrieben — hier steht nichts,
 * was ein Sprachmodell erfunden haben könnte. Neue Einträge einfach ergänzen,
 * der Suchindex baut sich selbst.
 */
export const KNOWLEDGE: KnowledgeEntry[] = [
  // ---------- Preis ----------
  {
    id: "preis-allgemein",
    category: "preis",
    status: "bestaetigt",
    question: "Was kostet eine Reinigung?",
    answer:
      "Wir rechnen nach Zeit: CHF 99.– pro Stunde. Ein Büro mit rund 100 m² schaffen wir in einer Stunde, das sind CHF 99.– pro Termin und CHF 396.– im Monat bei wöchentlicher Reinigung. Wie viele Zimmer das Objekt hat, spielt keine Rolle — nur die Fläche zählt.",
    keywords: [
      "preis", "kosten", "was kostet", "wie teuer", "teuer", "guenstig", "tarif",
      "stundenlohn", "stundensatz", "franken", "chf", "preisliste", "offerte",
    ],
    action: { label: "Preis berechnen", href: "/preis" },
  },
  {
    id: "preis-abo",
    category: "preis",
    status: "bestaetigt",
    question: "Gibt es einen günstigeren Tarif?",
    answer:
      "Ja, das Abo mit zwölf Monaten Mindestlaufzeit: CHF 82.50 pro Stunde statt CHF 99.–. Für das 100-m²-Büro sind das CHF 330.– im Monat statt CHF 396.–, also rund 17 Prozent weniger. Nach den zwölf Monaten läuft es monatlich weiter und ist jederzeit kündbar.",
    keywords: [
      "abo", "abonnement", "guenstiger", "rabatt", "vertrag", "laufzeit",
      "mindestlaufzeit", "sparen", "regelmaessig", "dauerauftrag", "binden",
    ],
    action: { label: "Abo berechnen", href: "/preis" },
  },
  {
    id: "preis-zimmer",
    category: "preis",
    status: "bestaetigt",
    question: "Kostet es mehr, wenn ich mehr Zimmer habe?",
    answer:
      "Nein. Wir rechnen nach Fläche und Zeit, nicht nach Zimmern. Ob Ihre 100 m² auf drei oder acht Räume verteilt sind, ändert am Preis nichts.",
    keywords: ["zimmer", "raeume", "anzahl", "mehr zimmer", "buero raeume", "wieviele zimmer"],
  },
  {
    id: "preis-mwst",
    category: "preis",
    status: "entwurf",
    question: "Kommt noch Mehrwertsteuer dazu?",
    answer:
      "Nein. Die genannten Preise sind Endpreise, es kommt nichts dazu.",
    keywords: ["mwst", "mehrwertsteuer", "steuer", "netto", "brutto", "endpreis", "dazu"],
  },
  {
    id: "preis-fenster",
    category: "preis",
    status: "bestaetigt",
    question: "Was kostet die Fensterreinigung?",
    answer:
      "Fenster sind nicht im Stundenpreis enthalten, weder einzeln noch im Abo. Der Preis hängt von Anzahl, Grösse und Erreichbarkeit der Fenster ab — sagen Sie uns kurz, worum es geht, dann bekommen Sie einen Festpreis. Fensterreinigung lässt sich einzeln buchen oder fest ins Abo aufnehmen.",
    keywords: ["fenster", "scheiben", "glas", "fensterputzen", "fensterreinigung", "rahmen"],
    action: { label: "Fensterpreis anfragen", href: "/kontakt" },
  },

  // ---------- Leistung ----------
  {
    id: "leistung-inklusive",
    category: "leistung",
    status: "bestaetigt",
    question: "Was ist im Preis enthalten?",
    answer:
      "Staubsaugen, Wischen, WC und Nasszellen reinigen, Abfalleimer entsorgen, Tische abwischen und Türgriffe desinfizieren. Reinigungsmittel und Geräte bringen wir mit. Fensterreinigung ist der einzige Punkt, der separat berechnet wird.",
    keywords: [
      "inklusive", "enthalten", "leistung", "umfang", "was macht ihr", "putzmittel",
      "material", "geraete", "dabei", "staubsaugen", "wischen", "wc", "abfall",
      "muell", "tische", "tuergriffe", "desinfizieren",
    ],
    action: { label: "Leistungen ansehen", href: "/leistungen" },
  },
  {
    id: "leistung-buero",
    category: "leistung",
    status: "bestaetigt",
    question: "Reinigen Sie Büros?",
    answer:
      "Ja, Büro- und Gewerberäume sind unser Schwerpunkt. Der Standardablauf — Staubsaugen, Wischen, Nasszellen, Abfall, Tische, Türgriffe — ist genau darauf zugeschnitten. CHF 99.– pro Stunde, im Abo CHF 82.50.",
    keywords: [
      "buero", "gewerbe", "firma", "unternehmen", "geschaeft", "praxis", "kanzlei",
      "gewerblich", "arbeitsplatz", "raeumlichkeiten",
    ],
    action: { label: "Büro berechnen", href: "/preis" },
  },
  {
    id: "leistung-wohnung",
    category: "leistung",
    status: "entwurf",
    question: "Reinigen Sie auch Privatwohnungen?",
    answer:
      "Ja, zum selben Stundenpreis wie Büros. Sagen Sie uns die Fläche, dann rechnen wir es Ihnen aus.",
    keywords: ["wohnung", "privat", "zuhause", "haus", "privatwohnung", "daheim"],
    action: { label: "Preis berechnen", href: "/preis" },
  },
  {
    id: "leistung-sonderfall",
    category: "leistung",
    status: "entwurf",
    question: "Machen Sie auch Grundreinigung oder Endreinigung bei Auszug?",
    answer:
      "Solche Aufträge machen wir nach Absicht und Aufwand, aber nicht zum Stundentarif von der Stange. Beschreiben Sie uns kurz das Objekt, dann bekommen Sie ein festes Angebot.",
    keywords: [
      "grundreinigung", "endreinigung", "auszug", "umzug", "uebergabe", "wohnungsuebergabe",
      "besenrein", "abnahme", "baureinigung", "tiefenreinigung", "sonderreinigung",
    ],
    action: { label: "Angebot anfragen", href: "/kontakt" },
  },

  // ---------- Ablauf ----------
  {
    id: "ablauf-dauer",
    category: "ablauf",
    status: "bestaetigt",
    question: "Wie lange dauert eine Reinigung?",
    answer:
      "Für rund 100 m² rechnen wir mit einer Stunde. Grössere Flächen entsprechend länger — 200 m² sind zwei Stunden. Weniger als eine Stunde berechnen wir nicht.",
    keywords: ["dauer", "wie lange", "stunden", "zeit", "dauert", "schnell"],
    action: { label: "Dauer berechnen", href: "/preis" },
  },
  {
    id: "ablauf-schluessel",
    category: "ablauf",
    status: "entwurf",
    question: "Muss ich anwesend sein?",
    answer:
      "Beim ersten Termin schauen wir uns das Objekt gemeinsam an. Danach läuft es bei den meisten Kunden über eine Schlüsselübergabe, damit die Reinigung ausserhalb der Arbeitszeiten stattfinden kann.",
    keywords: [
      "anwesend", "zu hause", "schluessel", "dabei sein", "abwesend", "zugang",
      "reinkommen", "uebergabe", "vor ort",
    ],
  },
  {
    id: "ablauf-wann",
    category: "ablauf",
    status: "entwurf",
    question: "Können Sie ausserhalb der Bürozeiten reinigen?",
    answer:
      "In der Regel ja — früh morgens oder abends, damit der Betrieb nicht gestört wird. Sagen Sie uns Ihr Zeitfenster, dann prüfen wir es.",
    keywords: ["abends", "morgens", "frueh", "spaet", "ausserhalb", "betriebszeit", "nachts", "wochenende"],
  },

  // ---------- Termin ----------
  {
    id: "termin-buchen",
    category: "termin",
    status: "entwurf",
    question: "Wie komme ich zu einem Termin?",
    answer:
      "Fläche eingeben, Preis sehen, Termin wählen — oder Sie schreiben uns kurz und wir melden uns innerhalb von 24 Stunden an Werktagen.",
    keywords: ["buchen", "termin", "reservieren", "kalender", "anfragen", "beauftragen", "melden"],
    action: { label: "Termin anfragen", href: "/kontakt" },
  },
  {
    id: "termin-absagen",
    category: "termin",
    status: "entwurf",
    question: "Kann ich einen Termin verschieben?",
    answer:
      "Ja. Melden Sie sich möglichst früh, dann finden wir einen neuen Termin. Bei laufenden Abos verschieben wir einzelne Termine unkompliziert.",
    keywords: ["absagen", "stornieren", "verschieben", "umbuchen", "storno", "ausfallen", "ferien", "urlaub"],
  },
  {
    id: "termin-gebiet",
    category: "organisation",
    status: "bestaetigt",
    question: "In welchem Gebiet arbeiten Sie?",
    answer:
      "Wir sitzen in Kloten und arbeiten in Zürich und Umgebung. Im Kerngebiet bis 20 Kilometer ist die Anfahrt im Preis enthalten, darüber hinaus kommt eine kleine Pauschale dazu. Liegt Ihr Objekt weiter weg, fragen Sie trotzdem an.",
    keywords: [
      "gebiet", "einzugsgebiet", "anfahrt", "region", "umkreis", "entfernung",
      "kilometer", "zuerich", "kloten", "flughafen", "kommt ihr", "wo seid ihr",
    ],
  },

  // ---------- Vertrauen ----------
  {
    id: "vertrauen-qualitaet",
    category: "vertrauen",
    status: "entwurf",
    question: "Was, wenn ich mit dem Ergebnis nicht zufrieden bin?",
    answer:
      "Sagen Sie es uns direkt, dann kommen wir nach. Uns ist die Nacharbeit lieber als ein Kunde, der wortlos wechselt.",
    keywords: [
      "unzufrieden", "reklamation", "beschwerde", "schlecht", "nacharbeit",
      "garantie", "zufrieden", "qualitaet", "beanstanden", "maengel",
    ],
  },
  {
    id: "vertrauen-versicherung",
    category: "vertrauen",
    status: "entwurf",
    question: "Sind Sie versichert, wenn etwas kaputtgeht?",
    answer:
      "Melden Sie einen Schaden bitte direkt nach dem Termin, dann klären wir die Abwicklung mit Ihnen.",
    keywords: ["versichert", "versicherung", "haftpflicht", "schaden", "kaputt", "bruch", "haftung"],
  },

  // ---------- Organisation ----------
  {
    id: "organisation-bezahlen",
    category: "organisation",
    status: "entwurf",
    question: "Wie bezahle ich?",
    answer:
      "Auf Rechnung. Bei laufenden Abos stellen wir monatlich eine Rechnung über die Termine des Monats.",
    keywords: ["bezahlen", "zahlung", "rechnung", "ueberweisung", "twint", "bar", "zahlungsziel", "karte"],
  },
  {
    id: "organisation-zeiten",
    category: "organisation",
    status: "entwurf",
    question: "Wann sind Sie erreichbar?",
    answer:
      "Montag bis Freitag von 7 bis 18 Uhr und samstags von 8 bis 14 Uhr. Anfragen über die Website beantworten wir innerhalb von 24 Stunden an Werktagen.",
    keywords: [
      "erreichbar", "oeffnungszeiten", "zeiten", "wann", "telefon", "anrufen",
      "kontakt", "sprechzeiten", "samstag", "sonntag",
    ],
  },
  {
    id: "organisation-umwelt",
    category: "organisation",
    status: "entwurf",
    question: "Welche Reinigungsmittel benutzen Sie?",
    answer:
      "Wir bringen unsere eigenen Mittel und Geräte mit. Wenn Sie Allergien haben oder bestimmte Produkte wünschen, sagen Sie kurz Bescheid.",
    keywords: ["mittel", "umwelt", "oekologisch", "bio", "allergie", "duftstoffe", "chemie", "produkte"],
  },
];

/** Einträge, die Florijan noch bestätigen muss, bevor die Seite online geht. */
export const UNCONFIRMED = KNOWLEDGE.filter((e) => e.status === "entwurf");
