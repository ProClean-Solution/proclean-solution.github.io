import type { ServiceId } from "@/lib/pricing/types";

export type AnswerCategory =
  | "preis"
  | "leistung"
  | "ablauf"
  | "termin"
  | "vertrauen"
  | "organisation";

/** Handlungsangebot, das mit der Antwort ausgespielt wird. */
export interface AnswerAction {
  label: string;
  href: string;
}

export interface KnowledgeEntry {
  id: string;
  category: AnswerCategory;
  /** Die Frage in der Formulierung, die ein Kunde benutzen würde. */
  question: string;
  answer: string;
  /** Alternative Formulierungen und Stichwörter — treibt die Trefferquote. */
  keywords: string[];
  action?: AnswerAction;
  /** Wenn gesetzt, ist die Antwort erst mit einer Preisrechnung vollständig. */
  needsCalculator?: boolean;
  relatedService?: ServiceId;
}

/**
 * Die Wissensbasis. Jede Antwort ist von Hand geschrieben und geprüft —
 * hier steht nichts, was ein Sprachmodell erfunden haben könnte.
 * Neue Einträge einfach ergänzen; die Suche zieht sie automatisch.
 */
export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "preis-allgemein",
    category: "preis",
    question: "Was kostet eine Reinigung?",
    answer:
      "Der Preis richtet sich nach Fläche, Leistung, Zustand und wie oft wir kommen. Für eine 80-m²-Wohnung mit einem Bad liegt die einmalige Unterhaltsreinigung im Bereich von rund 120 bis 140 Euro inklusive Mehrwertsteuer. Rechnen Sie Ihren konkreten Preis in unter einer Minute aus — der Rechner zeigt jede Position einzeln.",
    keywords: ["preis", "kosten", "was kostet", "wie teuer", "teuer", "günstig", "tarif", "stundenlohn", "euro", "preisliste"],
    action: { label: "Preis berechnen", href: "/preis" },
    needsCalculator: true,
  },
  {
    id: "preis-abo",
    category: "preis",
    question: "Ist es günstiger, wenn Sie regelmäßig kommen?",
    answer:
      "Ja, deutlich. Monatlich bekommen Sie 5 Prozent Rabatt, alle zwei Wochen 10 Prozent und wöchentlich 15 Prozent auf jeden einzelnen Termin. Sie binden sich dabei nicht langfristig — der Rhythmus lässt sich jederzeit ändern oder pausieren.",
    keywords: ["abo", "regelmäßig", "rabatt", "günstiger", "wöchentlich", "monatlich", "vertrag", "dauerauftrag", "abonnement", "sparen"],
    action: { label: "Rabatt im Rechner sehen", href: "/preis" },
  },
  {
    id: "preis-verbindlich",
    category: "preis",
    question: "Ist der Preis aus dem Rechner verbindlich?",
    answer:
      "Der Rechner gibt einen Richtpreis mit einer Genauigkeit von rund 10 Prozent. Verbindlich wird er, sobald wir das Objekt kurz gesehen haben — vor Ort oder anhand von Fotos, die Sie hochladen. Nachträgliche Überraschungen gibt es bei uns nicht: Wenn der Aufwand höher ausfällt, melden wir uns vorher.",
    keywords: ["verbindlich", "festpreis", "genau", "endpreis", "angebot", "kostenvoranschlag", "richtpreis", "nachzahlen"],
  },
  {
    id: "leistung-inklusive",
    category: "leistung",
    question: "Was ist bei der Reinigung inklusive?",
    answer:
      "Anfahrt, Arbeitszeit, alle Reinigungsmittel und Geräte sind im Preis enthalten. Bei der Unterhaltsreinigung sind das Staubsaugen und Wischen, Bad und WC, Küche inklusive Oberflächen, Staubwischen und Spiegel. Backofen, Kühlschrank, Fenster, Teppich, Keller und Balkon sind Zusatzleistungen, die Sie im Rechner dazubuchen können.",
    keywords: ["inklusive", "enthalten", "leistung", "umfang", "was macht ihr", "putzmittel", "material", "geräte", "dabei"],
    action: { label: "Leistungen ansehen", href: "/leistungen" },
  },
  {
    id: "leistung-endreinigung",
    category: "leistung",
    question: "Machen Sie Endreinigung bei Auszug?",
    answer:
      "Ja, mit Abnahmegarantie. Wenn der Vermieter oder die Verwaltung etwas beanstandet, kommen wir kostenlos nach. Planen Sie den Termin ein bis zwei Tage vor der Übergabe ein, damit noch Luft für Nacharbeiten bleibt.",
    keywords: ["endreinigung", "auszug", "umzug", "übergabe", "wohnungsübergabe", "besenrein", "abnahme", "vermieter", "kaution"],
    action: { label: "Endreinigung berechnen", href: "/preis?leistung=endreinigung" },
    relatedService: "endreinigung",
  },
  {
    id: "leistung-buero",
    category: "leistung",
    question: "Reinigen Sie auch Büros und Gewerbe?",
    answer:
      "Ja. Büroreinigung läuft bei uns über ein individuelles Angebot mit Rahmenvertrag und monatlicher Rechnung, weil Fläche, Rhythmus und Zugangsregelung stark variieren. Nennen Sie uns Fläche und gewünschten Rhythmus, dann bekommen Sie das Angebot innerhalb eines Werktags.",
    keywords: ["büro", "gewerbe", "firma", "unternehmen", "geschäft", "praxis", "kanzlei", "gewerblich", "b2b", "rahmenvertrag", "rechnung"],
    action: { label: "Geschäftskunden-Anfrage", href: "/geschaeftskunden" },
    relatedService: "bueroreinigung",
  },
  {
    id: "leistung-fenster",
    category: "leistung",
    question: "Putzen Sie auch Fenster?",
    answer:
      "Ja, Fensterreinigung gibt es einzeln oder als Zusatz zu jeder anderen Reinigung. Enthalten sind Glas, Rahmen und Fensterbänke. Fenster ab dem dritten Stock außen prüfen wir vorab, weil dort teilweise besondere Sicherung nötig ist.",
    keywords: ["fenster", "scheiben", "glas", "fensterputzen", "rahmen", "fensterbank"],
    action: { label: "Fensterreinigung berechnen", href: "/preis?leistung=fensterreinigung" },
    relatedService: "fensterreinigung",
  },
  {
    id: "ablauf-schluessel",
    category: "ablauf",
    question: "Muss ich zu Hause sein?",
    answer:
      "Nein. Beim ersten Termin lernen wir uns kurz kennen, danach übernehmen viele Kundinnen und Kunden eine Schlüsselübergabe. Schlüssel werden bei uns nummeriert, ohne Adresse gelagert und nur an die feste Reinigungskraft ausgegeben. Sie können ihn jederzeit zurückverlangen.",
    keywords: ["anwesend", "zu hause", "schlüssel", "dabei sein", "abwesend", "arbeit", "übergabe", "zugang", "reinkommen"],
  },
  {
    id: "ablauf-dauer",
    category: "ablauf",
    question: "Wie lange dauert eine Reinigung?",
    answer:
      "Für eine 80-m²-Wohnung rechnen wir bei normaler Nutzung mit rund zwei Stunden, bei einer Grundreinigung etwa mit dem Doppelten. Der Rechner zeigt Ihnen die geschätzte Dauer für Ihr Objekt zusammen mit dem Preis an.",
    keywords: ["dauer", "wie lange", "stunden", "zeit", "dauert"],
    action: { label: "Dauer berechnen", href: "/preis" },
    needsCalculator: true,
  },
  {
    id: "ablauf-personen",
    category: "ablauf",
    question: "Kommt immer dieselbe Person?",
    answer:
      "Bei regelmäßigen Aufträgen ja — feste Zuordnung ist bei uns Standard, weil sie Qualität und Vertrauen deutlich verbessert. Bei Urlaub oder Krankheit informieren wir Sie vorab über die Vertretung.",
    keywords: ["dieselbe", "gleiche person", "wechsel", "personal", "mitarbeiter", "reinigungskraft", "wer kommt", "fest"],
  },
  {
    id: "termin-buchen",
    category: "termin",
    question: "Wie buche ich einen Termin?",
    answer:
      "Über den Kalender auf der Website: Leistung wählen, Preis sehen, freien Termin anklicken, fertig. Sie bekommen sofort eine Bestätigung per E-Mail und am Vortag eine Erinnerung. Telefonisch geht es natürlich auch.",
    keywords: ["buchen", "termin", "reservieren", "kalender", "anfragen", "beauftragen", "bestellen"],
    action: { label: "Termin buchen", href: "/buchen" },
  },
  {
    id: "termin-kurzfristig",
    category: "termin",
    question: "Geht das auch kurzfristig?",
    answer:
      "Meistens ja. Freie Termine innerhalb der nächsten 48 Stunden sehen Sie direkt im Kalender — was dort steht, ist wirklich frei. Für sehr dringende Fälle rufen Sie besser an, dann prüfen wir, ob sich etwas verschieben lässt.",
    keywords: ["kurzfristig", "schnell", "morgen", "heute", "dringend", "sofort", "spontan", "notfall"],
    action: { label: "Freie Termine ansehen", href: "/buchen" },
  },
  {
    id: "termin-absagen",
    category: "termin",
    question: "Kann ich einen Termin verschieben oder absagen?",
    answer:
      "Ja, kostenlos bis 24 Stunden vor dem Termin — über den Link in Ihrer Bestätigungsmail oder telefonisch. Bei kurzfristigeren Absagen berechnen wir die Hälfte, weil die Zeit dann nicht mehr neu vergeben werden kann.",
    keywords: ["absagen", "stornieren", "verschieben", "umbuchen", "kündigen", "storno", "abmelden"],
  },
  {
    id: "termin-gebiet",
    category: "organisation",
    question: "In welchem Gebiet arbeiten Sie?",
    answer:
      "Wir fahren bis 50 Kilometer um unseren Standort. Bis 15 Kilometer ist die Anfahrt kostenlos, danach kommt eine gestaffelte Pauschale dazu. Liegt Ihr Objekt weiter weg, fragen Sie trotzdem an — bei größeren Aufträgen machen wir Ausnahmen.",
    keywords: ["gebiet", "wo", "einzugsgebiet", "anfahrt", "region", "umkreis", "entfernung", "kilometer", "stadt", "kommt ihr"],
  },
  {
    id: "vertrauen-versicherung",
    category: "vertrauen",
    question: "Sind Sie versichert, wenn etwas kaputtgeht?",
    answer:
      "Ja. Wir haben eine Betriebshaftpflichtversicherung, die Schäden an Ihrem Eigentum abdeckt. Falls doch einmal etwas passiert, melden Sie es uns innerhalb von 48 Stunden — die Abwicklung übernehmen wir.",
    keywords: ["versichert", "versicherung", "haftpflicht", "schaden", "kaputt", "bruch", "haftung", "beschädigt"],
  },
  {
    id: "vertrauen-personal",
    category: "vertrauen",
    question: "Wer kommt zu mir nach Hause?",
    answer:
      "Fest angestellte Mitarbeiterinnen und Mitarbeiter, keine wechselnden Subunternehmer. Alle sind angemeldet, eingearbeitet und arbeiten in Firmenkleidung mit Ausweis. Sie erfahren vor dem Termin, wer kommt.",
    keywords: ["wer kommt", "personal", "angestellt", "subunternehmer", "schwarzarbeit", "vertrauen", "sicherheit", "ausweis", "geprüft"],
  },
  {
    id: "vertrauen-qualitaet",
    category: "vertrauen",
    question: "Was, wenn ich mit dem Ergebnis nicht zufrieden bin?",
    answer:
      "Melden Sie sich innerhalb von 24 Stunden, dann kommen wir kostenlos nach. Das gilt für jede Leistung, nicht nur für die Endreinigung. Uns ist die Nacharbeit lieber als eine schlechte Bewertung.",
    keywords: ["unzufrieden", "reklamation", "beschwerde", "schlecht", "nacharbeit", "garantie", "zufrieden", "qualität", "beanstanden"],
  },
  {
    id: "organisation-bezahlen",
    category: "organisation",
    question: "Wie bezahle ich?",
    answer:
      "Privatkunden zahlen nach dem Termin per Rechnung oder online per Karte. Geschäftskunden bekommen eine monatliche Sammelrechnung mit 14 Tagen Zahlungsziel. Barzahlung nehmen wir aus Sicherheitsgründen nicht.",
    keywords: ["bezahlen", "zahlung", "rechnung", "karte", "überweisung", "bar", "zahlungsziel", "kreditkarte", "vorkasse"],
  },
  {
    id: "organisation-zeiten",
    category: "organisation",
    question: "Wann sind Sie erreichbar?",
    answer:
      "Montag bis Freitag von 7 bis 18 Uhr und samstags von 8 bis 14 Uhr. Anfragen über die Website beantworten wir innerhalb von 24 Stunden an Werktagen — auch wenn sie nachts eingehen.",
    keywords: ["erreichbar", "öffnungszeiten", "zeiten", "wann", "telefon", "anrufen", "kontakt", "sprechzeiten", "wochenende", "samstag", "sonntag"],
  },
  {
    id: "organisation-umwelt",
    category: "organisation",
    question: "Benutzen Sie umweltfreundliche Mittel?",
    answer:
      "Standardmäßig arbeiten wir mit biologisch abbaubaren Reinigungsmitteln und dosieren sparsam. Wenn Sie Allergien haben, Haustiere oder kleine Kinder, sagen Sie kurz Bescheid — dann stellen wir vollständig auf duftstofffreie Produkte um.",
    keywords: ["umwelt", "ökologisch", "bio", "nachhaltig", "allergie", "kinder", "haustiere", "duftstoffe", "chemie", "giftig"],
  },
];
