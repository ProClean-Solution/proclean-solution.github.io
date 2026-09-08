import type {
  ExtraId,
  ExtraUnit,
  Frequency,
  ObjectType,
  PackageId,
  Tariff,
} from "./types";

/**
 * Preise ProClean Solution. Alle Beträge in Rappen.
 *
 * Das Modell in drei Sätzen:
 *
 *   1. Der Kunde wählt EIN Paket. Der Preis gilt bis 100 m² und pro Reinigung.
 *      Essential CHF 99.–, Plus CHF 139.–, Complete CHF 179.–.
 *   2. Grössere Flächen laufen linear weiter: der Grundpreis geteilt durch
 *      100 m² ist der Quadratmeterpreis (0.99 / 1.39 / 1.79).
 *   3. Das Abo über zwölf Monate zieht überall denselben Rabatt ab, den
 *      Florijans eigene Zahlen definieren: 82.50 von 99.– sind genau 5/6.
 *
 * Danach legt der Kunde fest, wie oft im Monat gereinigt wird (einmal bis
 * viermal) und hakt bei Bedarf einzelne Zusatzleistungen an.
 *
 * Der Standardtarif wird auf ganze Franken gerundet — so hat Florijan seine
 * Staffel selbst geschrieben (148.50 -> 149.–). Der Abopreis bleibt auf fünf
 * Rappen genau, damit 123.75 genau so stehen bleibt.
 */

/** Wie ein Betrag am Ende gerundet wird. */
export type Rounding = "franken" | "rappen5";

/** Fläche, die im Paketpreis enthalten ist. Gleichzeitig eine Stunde Arbeit. */
export const BASE_SQM = 100;

/**
 * Referenzwert: 100 m² entsprechen einer Stunde Arbeit.
 *
 * OFFEN: Ob das über 200 m² noch stimmt, muss Florijan bestätigen —
 * grosse Flächen sind pro Quadratmeter meist schneller.
 */
export const SQM_PER_HOUR = 100;

/** Kein Auftrag unter einer Stunde. */
export const MIN_MINUTES = 60;

/** Fläche, bis zu der online gerechnet wird. Darüber: persönliches Angebot. */
export const MAX_SQM_ONLINE = 300;
export const MIN_SQM = 20;

export interface TariffDef {
  id: Tariff;
  label: string;
  /**
   * Faktor auf den Paketpreis. 1 im Standardtarif.
   *
   * Der Abowert ist keine gewählte Zahl, sondern Florijans eigenes
   * Verhältnis: 82.50 / 99.– = 5/6, also 16,67 % weniger. Damit gilt für
   * Plus und Complete automatisch derselbe Rabatt wie für Essential.
   */
  factor: number;
  commitmentMonths: number;
  rounding: Rounding;
  description: string;
}

export const TARIFFS: Record<Tariff, TariffDef> = {
  standard: {
    id: "standard",
    label: "Einzeln",
    factor: 1,
    commitmentMonths: 0,
    rounding: "franken",
    description: "Jederzeit kündbar, keine Mindestlaufzeit.",
  },
  abo12: {
    id: "abo12",
    label: "Abo 12 Monate",
    factor: 8250 / 9900,
    commitmentMonths: 12,
    rounding: "rappen5",
    description: "Zwölf Monate Mindestlaufzeit, dafür rund 17 % günstiger.",
  },
};

export const VISITS_PER_MONTH: Record<Frequency, number> = {
  einmalig: 0,
  m1: 1,
  m2: 2,
  m3: 3,
  m4: 4,
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  einmalig: "einmalig",
  m1: "1× im Monat",
  m2: "2× im Monat",
  m3: "3× im Monat",
  m4: "4× im Monat",
};

/** Zusatz für die Auswahl — was die Zahl praktisch bedeutet. */
export const FREQUENCY_HINT: Record<Frequency, string> = {
  einmalig: "eine einzelne Reinigung",
  m1: "monatlich",
  m2: "alle zwei Wochen",
  m3: "alle zehn Tage",
  m4: "wöchentlich",
};

export const OBJECT_LABEL: Record<ObjectType, string> = {
  buero: "Büro / Gewerbe",
  wohnung: "Wohnung / Haus",
};

/**
 * Was in JEDEM Paket steckt — Florijans Leistungsblatt für Essential.
 * Diese Liste ist die einzige Quelle; Rechner, Paketkarte und Assistent
 * lesen alle hier.
 */
export const INCLUDED_TASKS = [
  "Böden saugen",
  "Hartböden feucht wischen",
  "Freie Schreibtisch- und Arbeitsflächen",
  "Sichtbare Oberflächen",
  "Türgriffe und Lichtschalter",
  "Abfalleimer",
  "Ein Sanitärbereich",
  "Kleine Büroküche / Küchenzeile",
  "Spiegel und zugängliche Glasflächen",
] as const;

/**
 * Dieselbe Liste in einer Zeile, für Stellen mit wenig Platz.
 *
 * Steht bewusst hier neben INCLUDED_TASKS statt im Markup: die Beschriftung
 * des Wischs trug monatelang noch die alte Leistungsliste ("Nasszellen,
 * Tische"), weil sie an einer zweiten Stelle von Hand gepflegt wurde.
 */
export const INCLUDED_SUMMARY = "Böden, Arbeitsflächen, Sanitär, Küche, Abfall, Türgriffe";

/**
 * Der Kleingedruckte-Satz, wörtlich nach Florijan. Steht überall dort, wo eine
 * Zahl steht — der Preis gilt nicht bedingungslos.
 */
export const CONDITIONS_NOTE =
  "Preis gilt für normal verschmutzte und frei zugängliche Büroflächen. Starke Verschmutzungen, Grundreinigungen, Bauendreinigungen und aussergewöhnlicher Mehraufwand werden separat berechnet.";

/**
 * Glasfläche, die Office Complete innen enthält.
 *
 * Florijans Rechnung: der Sprung von Plus auf Complete beträgt CHF 40.–.
 * Bei 15 m² wären allein die Fenster zum Normaltarif CHF 67.50 wert —
 * das Paket würde sich selbst tragen müssen. 10 m² zu CHF 4.50 sind
 * CHF 45.– und lassen neben Kühlschrank, Mikrowelle und Detailreinigung
 * noch Luft.
 */
export const COMPLETE_GLAS_SQM = 10;

export interface PackageDef {
  id: PackageId;
  label: string;
  tagline: string;
  /** Preis bis 100 m² pro Reinigung, im Standardtarif, in Rappen. */
  baseCents: number;
  /** Was dieses Paket zusätzlich zum vorherigen enthält. */
  adds: readonly string[];
  /**
   * Zusatzleistungen, die DIESES Paket zusätzlich abdeckt — wie `adds` die
   * Differenz zum vorherigen Paket, nicht die volle Liste.
   *
   * Der Wert ist die enthaltene MENGE: 1 bei pauschalen Leistungen (also
   * ganz enthalten), sonst ein Freikontingent in der Einheit der Leistung.
   * Complete enthält die Innenfenster bis 10 m² Glas; darüber wird jeder
   * weitere Quadratmeter normal berechnet.
   */
  covers: Partial<Record<ExtraId, number>>;
  /** Was das Paket ausdrücklich NICHT abdeckt. Steht bei jedem Preis dabei. */
  limit?: string;
  /** Genau eines trägt die Auszeichnung. */
  beliebt?: boolean;
}

/**
 * Die drei Pakete, in Florijans Reihenfolge und mit seinen Preisen.
 *
 * `adds` ist bewusst die DIFFERENZ zum vorherigen Paket, nicht die volle
 * Liste: die Karte wächst kumulativ, die Zeilen von Plus bleiben bei
 * Complete stehen. Stünde hier die volle Liste, käme jeder Punkt doppelt.
 */
export const PACKAGES: PackageDef[] = [
  {
    id: "essential",
    label: "Office Essential",
    tagline: "Alles, was ein sauberes Büro braucht.",
    baseCents: 9900,
    adds: [],
    covers: {},
  },
  {
    id: "plus",
    label: "Office Plus",
    tagline: "Für Büros, die mehr Aufmerksamkeit verdienen.",
    baseCents: 13900,
    beliebt: true,
    adds: [
      "Gründlichere Sanitärreinigung",
      "Küchenzeile: Fronten, Arbeitsfläche und Spüle",
      "Kaffeemaschine aussen",
      "Glastüren und kleine interne Glasflächen",
      "Intensivere Oberflächen- und Detailreinigung",
    ],
    covers: {
      kuechenzeile: 1,
      kaffeemaschine: 1,
      "oberflaechen-intensiv": 1,
    },
  },
  {
    id: "complete",
    label: "Office Complete",
    tagline: "Einfach kommen. Arbeiten. Alles andere ist erledigt.",
    baseCents: 17900,
    /*
      Nur die Differenz zu Plus. Die Karte wächst kumulativ — die Zeilen von
      Plus bleiben stehen —, deshalb stünde sonst jeder Punkt doppelt da.
    */
    adds: [
      `Fenster innen bis ${COMPLETE_GLAS_SQM} m² Glasfläche`,
      "Kühlschrank aussen",
      "Mikrowelle innen und aussen",
      "Zusätzliche Detailflächen",
      "Höhere Reinigungsintensität und Zeitreserve",
    ],
    covers: { "fenster-innen": COMPLETE_GLAS_SQM },
    /*
      Kurz genug, um beim Preis zu stehen statt im Kleingedruckten. Die
      Langfassung — schwer zugängliche Fassadenverglasung — steht am
      Leistungshinweis der Fensterreinigung und beim Assistenten.
    */
    limit: `Fenster innen bis ${COMPLETE_GLAS_SQM} m² Glasfläche, darüber pro m². Aussenfenster sind nicht enthalten.`,
  },
];

export const PACKAGE_BY_ID: Record<PackageId, PackageDef> = Object.fromEntries(
  PACKAGES.map((p) => [p.id, p]),
) as Record<PackageId, PackageDef>;

export interface ExtraDef {
  id: ExtraId;
  label: string;
  /**
   * Rappen je Einheit. `null` bedeutet: online kein Preis, führt zur Anfrage.
   * Sobald Florijan einen Preis nennt, hier eintragen und der Rechner
   * weist ihn überall automatisch aus.
   */
  priceCents: number | null;
  unit: ExtraUnit;
  /** Wie die Menge im Rechner heisst. Nur bei `pauschal` leer. */
  unitLabel: string;
  note: string;
}

/**
 * Die Zusatzleistungen. Florijan hat sie als Beispielpreise genannt —
 * vor dem Livegang bestätigen.
 *
 * Die Reihenfolge ist seine.
 */
export const EXTRAS: Record<ExtraId, ExtraDef> = {
  "fenster-innen": {
    id: "fenster-innen",
    label: "Fensterreinigung innen",
    priceCents: 450,
    unit: "m2glas",
    unitLabel: "m² Glas",
    note: `Innenseitige Glasreinigung, nach Glasfläche. In Office Complete bis ${COMPLETE_GLAS_SQM} m² enthalten, darüber pro zusätzlichem m².`,
  },
  "fenster-beidseitig": {
    id: "fenster-beidseitig",
    label: "Fenster innen und aussen",
    priceCents: 750,
    unit: "m2glas",
    unitLabel: "m² Glas",
    note: "Beide Seiten. In keinem Paket enthalten — auch nicht in Complete, das nur die Innenseite abdeckt. Bei schwer erreichbarer Fassadenverglasung melden wir uns vorher.",
  },
  "wc-zusatz": {
    id: "wc-zusatz",
    label: "Weiterer WC-/Sanitärbereich",
    priceCents: 1990,
    unit: "stueck",
    unitLabel: "Bereich",
    note: "Ein Sanitärbereich steckt bereits im Paket. Dies ist jeder weitere.",
  },
  kuechenzeile: {
    id: "kuechenzeile",
    label: "Küchenzeile reinigen",
    priceCents: 1490,
    unit: "pauschal",
    unitLabel: "",
    note: "Fronten, Arbeitsfläche und Spüle.",
  },
  geschirr: {
    id: "geschirr",
    label: "Geschirr abwaschen",
    priceCents: 990,
    unit: "pauschal",
    unitLabel: "",
    note: "Stehengebliebenes Geschirr, von Hand oder in die Maschine.",
  },
  kuehlschrank: {
    id: "kuehlschrank",
    label: "Kühlschrank innen",
    priceCents: 1490,
    unit: "pauschal",
    unitLabel: "",
    note: "Ausräumen, auswischen, einräumen. Nur die Innenseite — die Aussenseite ist in Office Complete enthalten.",
  },
  kaffeemaschine: {
    id: "kaffeemaschine",
    label: "Kaffeemaschine reinigen",
    priceCents: 990,
    unit: "pauschal",
    unitLabel: "",
    note: "Brüheinheit, Milchsystem und Auffangschale.",
  },
  abfallstation: {
    id: "abfallstation",
    label: "Zusätzliche Abfallstation",
    priceCents: 490,
    unit: "stueck",
    unitLabel: "Station",
    note: "Für Büros mit getrennter Sammelstelle je Etage oder Küche.",
  },
  "oberflaechen-intensiv": {
    id: "oberflaechen-intensiv",
    label: "Intensive Tisch- und Oberflächenreinigung",
    priceCents: 1490,
    unit: "pauschal",
    unitLabel: "",
    note: "Auch belegte Flächen, nicht nur die freien.",
  },
  stuehle: {
    id: "stuehle",
    label: "Stühle reinigen",
    priceCents: 250,
    unit: "stueck",
    unitLabel: "Stuhl",
    note: "Polster und Gestell, je Stuhl.",
  },
  teppich: {
    id: "teppich",
    label: "Teppich-Tiefenreinigung",
    priceCents: null,
    unit: "m2glas",
    unitLabel: "m²",
    note: "Maschinelle Reinigung für textile Flächen. Preis nach Fläche und Verschmutzungsgrad — wir schauen es uns an und nennen einen Festpreis.",
  },
  desinfektion: {
    id: "desinfektion",
    label: "Desinfektionsreinigung",
    priceCents: 1990,
    unit: "pauschal",
    unitLabel: "",
    note: "Kontaktflächen zusätzlich desinfizieren.",
  },
};

export const EXTRA_LIST = Object.values(EXTRAS);

/**
 * Was ein Paket insgesamt abdeckt.
 *
 * `covers` ist je Paket nur die Differenz zum vorherigen — genau wie `adds`.
 * Complete enthält also alles aus Plus, ohne dass es dort noch einmal steht.
 * Hier wird daraus die vollständige Liste.
 */
export function coveredBy(packageId: PackageId): Partial<Record<ExtraId, number>> {
  const bis = PACKAGES.findIndex((p) => p.id === packageId);
  const gesamt: Partial<Record<ExtraId, number>> = {};
  for (const paket of PACKAGES.slice(0, bis + 1)) Object.assign(gesamt, paket.covers);
  return gesamt;
}

/** Die Pakete, die eine Leistung abdecken — samt enthaltener Menge. */
export function packagesCovering(id: ExtraId): Array<{ paket: PackageDef; menge: number }> {
  return PACKAGES.map((paket) => ({ paket, menge: coveredBy(paket.id)[id] ?? 0 })).filter(
    (e) => e.menge > 0,
  );
}

/** Anfahrt ab Kloten. Innerhalb des Kerngebiets kostenlos. */
export const TRAVEL_ZONES = [
  { maxKm: 20, label: "Zürich und Umgebung", surchargeCents: 0 },
  { maxKm: 40, label: "erweitertes Gebiet", surchargeCents: 1500 },
] as const;
