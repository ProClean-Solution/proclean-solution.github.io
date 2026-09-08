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
      "Bis 100 m² kostet eine Reinigung CHF 99.– — das ist eine Stunde Arbeit. Grössere Büros rechnen wir nach Fläche: CHF 0.99 pro m². Also 150 m² = CHF 149.–, 200 m² = CHF 198.–, 250 m² = CHF 248.–. Bei wöchentlicher Reinigung sind 100 m² CHF 396.– im Monat. Wie viele Zimmer das Objekt hat, spielt keine Rolle — nur die Fläche zählt.",
    keywords: [
      "preis", "kosten", "was kostet", "wie teuer", "teuer", "guenstig", "tarif",
      "stundenlohn", "stundensatz", "franken", "chf", "preisliste", "offerte",
      "quadratmeter", "qm", "m2", "pro quadratmeter", "flaeche", "staffel",
    ],
    action: { label: "Preis berechnen", href: "/preis" },
  },
  {
    id: "preis-abo",
    category: "preis",
    status: "bestaetigt",
    question: "Gibt es einen günstigeren Tarif?",
    answer:
      "Ja, das Abo mit zwölf Monaten Mindestlaufzeit: CHF 82.50 statt CHF 99.– bis 100 m², darüber CHF 0.825 statt CHF 0.99 pro m². Für das 100-m²-Büro sind das CHF 330.– im Monat statt CHF 396.–, also rund 17 Prozent weniger. 150 m² kosten im Abo CHF 123.75 pro Reinigung, 200 m² CHF 165.–. Nach den zwölf Monaten läuft es monatlich weiter und ist jederzeit kündbar.",
    keywords: [
      "abo", "abonnement", "guenstiger", "rabatt", "vertrag", "laufzeit",
      "mindestlaufzeit", "sparen", "regelmaessig", "dauerauftrag", "binden",
    ],
    action: { label: "Abo berechnen", href: "/preis" },
  },
  {
    id: "preis-flaeche",
    category: "preis",
    status: "bestaetigt",
    question: "Was kostet es bei 150 oder 200 m²?",
    answer:
      "Über 100 m² rechnen wir CHF 0.99 pro Quadratmeter, im 12-Monats-Abo CHF 0.825. Konkret: 150 m² = CHF 149.– (Abo CHF 123.75), 200 m² = CHF 198.– (Abo CHF 165.–), 250 m² = CHF 248.– (Abo CHF 206.25). Zusätzliche Reinigungszeit berechnen wir nur dann, wenn sie tatsächlich gebraucht wird.",
    keywords: [
      "150", "200", "250", "300", "quadratmeter", "qm", "m2", "groesser", "gross",
      "grosses buero", "flaeche", "staffel", "aufschlag", "mehr flaeche", "berechnung",
      "hochrechnen", "pro quadratmeter",
    ],
    action: { label: "Eigene Fläche rechnen", href: "/preis" },
  },
  {
    id: "preis-pakete",
    category: "preis",
    status: "entwurf",
    question: "Was ist der Unterschied zwischen Essential, Plus und Complete?",
    answer:
      "Office Essential ist der Grundpreis: bis 100 m², eine Stunde, alle Standardarbeiten. Office Plus nimmt Fenster und Teppichflächen dazu, Office Complete zusätzlich den Geschirr- und Küchenservice. Für Plus und Complete nennen wir keinen Onlinepreis, weil er von Ihrer Fläche und vom Umfang abhängt — sagen Sie uns kurz, worum es geht, dann rechnen wir es aus.",
    keywords: [
      "paket", "pakete", "essential", "plus", "complete", "office", "unterschied",
      "welches paket", "stufe", "variante", "angebot", "auswahl",
    ],
    action: { label: "Angebot anfragen", href: "/kontakt" },
  },
  {
    id: "preis-bedingungen",
    category: "preis",
    status: "bestaetigt",
    question: "Gilt der Preis immer?",
    answer:
      "Der Preis gilt für normal verschmutzte und frei zugängliche Büroflächen. Starke Verschmutzungen, Grundreinigungen, Bauendreinigungen und aussergewöhnlicher Mehraufwand werden separat berechnet. Wenn wir vor Ort sehen, dass mehr nötig ist, sagen wir es vorher — nicht auf der Rechnung.",
    keywords: [
      "gilt immer", "festpreis", "verschmutzt", "stark verschmutzt", "dreckig",
      "sonderfall", "aufschlag", "mehraufwand", "ueberraschung", "nachtraeglich",
      "versteckte kosten", "zusatzkosten", "bedingungen",
    ],
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
      "Fenster sind nicht im Grundpreis enthalten, weder einzeln noch im Abo. Der Preis hängt von Anzahl, Grösse und Erreichbarkeit ab — für Innen- und Aussenfenster — sagen Sie uns kurz, worum es geht, dann bekommen Sie einen Festpreis. Fensterreinigung lässt sich einzeln buchen oder fest ins Abo aufnehmen.",
    keywords: ["fenster", "scheiben", "glas", "fensterputzen", "fensterreinigung", "rahmen"],
    action: { label: "Fensterpreis anfragen", href: "/kontakt" },
  },

  {
    id: "preis-optionen",
    category: "preis",
    status: "bestaetigt",
    question: "Reinigen Sie auch Teppiche oder machen Sie das Geschirr?",
    answer:
      "Beides gibt es als Option zum Grundpreis dazu: Teppich-Tiefenreinigung maschinell für textile Flächen, und den Geschirr- & Küchenservice für Büros mit regelmässigem Küchenbetrieb. Preise nennen wir nach Fläche und Aufwand — online steht dafür bewusst keine Zahl, die dann doch nicht stimmt.",
    keywords: [
      "teppich", "teppiche", "teppichreinigung", "tiefenreinigung", "textil",
      "maschinell", "geschirr", "abwasch", "spuelmaschine", "kueche", "kuechenservice",
      "kaffeemaschine", "optionen", "zusatz", "zusatzleistung", "dazubuchen",
    ],
    action: { label: "Option anfragen", href: "/kontakt" },
  },

  // ---------- Leistung ----------
  {
    id: "leistung-inklusive",
    category: "leistung",
    status: "bestaetigt",
    question: "Was ist im Preis enthalten?",
    answer:
      "Böden saugen, Hartböden feucht wischen, freie Schreibtisch- und Arbeitsflächen, sichtbare Oberflächen, Türgriffe und Lichtschalter, Abfalleimer, ein Sanitärbereich, kleine Büroküche oder Küchenzeile sowie Spiegel und zugängliche Glasflächen. Reinigungsmittel und Geräte bringen wir mit. Separat berechnet werden Fensterreinigung, Teppich-Tiefenreinigung und der Geschirr- & Küchenservice.",
    keywords: [
      "inklusive", "enthalten", "leistung", "umfang", "was macht ihr", "putzmittel",
      "material", "geraete", "dabei", "staubsaugen", "wischen", "wc", "abfall",
      "muell", "tische", "tuergriffe", "desinfizieren", "boeden", "schreibtisch",
      "lichtschalter", "sanitaer", "spiegel", "kuechenzeile", "oberflaechen",
    ],
    action: { label: "Leistungen ansehen", href: "/leistungen" },
  },
  {
    id: "leistung-buero",
    category: "leistung",
    status: "bestaetigt",
    question: "Reinigen Sie Büros?",
    answer:
      "Ja, Büro- und Gewerberäume sind unser Schwerpunkt. Der Standardablauf — Böden, Arbeitsflächen, Sanitärbereich, Küchenzeile, Abfall, Türgriffe und Lichtschalter — ist genau darauf zugeschnitten. Bis 100 m² CHF 99.–, im Abo CHF 82.50; darüber nach Fläche.",
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
      "Ja, zum selben Flächenpreis wie Büros: bis 100 m² CHF 99.–, darüber CHF 0.99 pro m². Sagen Sie uns die Fläche, dann rechnen wir es Ihnen aus.",
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
