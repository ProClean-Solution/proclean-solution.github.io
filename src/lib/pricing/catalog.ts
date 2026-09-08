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
 * Der Kleingedruckte-Satz, wörtlich nach Florijan. Steht überall dort, wo eine
 * Zahl steht — der Preis gilt nicht bedingungslos.
 */
export const CONDITIONS_NOTE =
  "Preis gilt für normal verschmutzte und frei zugängliche Büroflächen. Starke Verschmutzungen, Grundreinigungen, Bauendreinigungen und aussergewöhnlicher Mehraufwand werden separat berechnet.";

export interface PackageDef {
  id: PackageId;
  label: string;
  tagline: string;
  /** Preis bis 100 m² pro Reinigung, im Standardtarif, in Rappen. */
  baseCents: number;
  /** Was dieses Paket zusätzlich zum vorherigen enthält. */
  adds: readonly string[];
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
  },
  {
    id: "plus",
    label: "Office Plus",
    tagline: "Für Büros, die mehr Aufmerksamkeit verdienen.",
    baseCents: 13900,
    beliebt: true,
    adds: [
      "Gründlichere Sanitärreinigung",
      "Küchenfronten und Spüle",
      "Kaffeemaschine aussen",
      "Glastüren und kleine Glasflächen",
      "Stärkere Oberflächenreinigung",
      "Zusätzliche Detailreinigung",
    ],
  },
  {
    id: "complete",
    label: "Office Complete",
    tagline: "Einfach kommen. Arbeiten. Alles andere ist erledigt.",
    baseCents: 17900,
    adds: [
      "Innenfenster bzw. definierte Glasfläche",
      "Kühlschrank aussen",
      "Mikrowelle",
      "Zusätzliche Detailflächen",
      "Intensivere Reinigung",
      "Höhere Zeitreserve",
    ],
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
  /**
   * Pakete, die diese Leistung bereits abdecken. Wird sie trotzdem
   * angehakt, weist der Rechner sie als enthalten aus, statt sie ein
   * zweites Mal zu berechnen.
   *
   * OFFEN: Diese Zuordnung ist aus Florijans Paketbeschreibungen gelesen,
   * nicht von ihm bestätigt. Vor dem Livegang durchgehen.
   */
  includedIn: readonly PackageId[];
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
    note: "Innenseite der Fenster, nach Glasfläche.",
    includedIn: ["complete"],
  },
  "fenster-beidseitig": {
    id: "fenster-beidseitig",
    label: "Fenster innen und aussen",
    priceCents: 750,
    unit: "m2glas",
    unitLabel: "m² Glas",
    note: "Beide Seiten. Bei schwer erreichbaren Fenstern melden wir uns vorher.",
    includedIn: [],
  },
  "wc-zusatz": {
    id: "wc-zusatz",
    label: "Weiterer WC-/Sanitärbereich",
    priceCents: 1990,
    unit: "stueck",
    unitLabel: "Bereich",
    note: "Ein Sanitärbereich steckt bereits im Paket. Dies ist jeder weitere.",
    includedIn: [],
  },
  kuechenzeile: {
    id: "kuechenzeile",
    label: "Küchenzeile reinigen",
    priceCents: 1490,
    unit: "pauschal",
    unitLabel: "",
    note: "Fronten, Spüle und Arbeitsfläche.",
    includedIn: ["plus", "complete"],
  },
  geschirr: {
    id: "geschirr",
    label: "Geschirr abwaschen",
    priceCents: 990,
    unit: "pauschal",
    unitLabel: "",
    note: "Stehengebliebenes Geschirr, von Hand oder in die Maschine.",
    includedIn: [],
  },
  kuehlschrank: {
    id: "kuehlschrank",
    label: "Kühlschrank innen",
    priceCents: 1490,
    unit: "pauschal",
    unitLabel: "",
    note: "Ausräumen, auswischen, einräumen. Die Aussenseite ist in Complete enthalten.",
    includedIn: [],
  },
  kaffeemaschine: {
    id: "kaffeemaschine",
    label: "Kaffeemaschine reinigen",
    priceCents: 990,
    unit: "pauschal",
    unitLabel: "",
    note: "Brüheinheit, Milchsystem und Auffangschale.",
    includedIn: ["plus", "complete"],
  },
  abfallstation: {
    id: "abfallstation",
    label: "Zusätzliche Abfallstation",
    priceCents: 490,
    unit: "stueck",
    unitLabel: "Station",
    note: "Für Büros mit getrennter Sammelstelle je Etage oder Küche.",
    includedIn: [],
  },
  "oberflaechen-intensiv": {
    id: "oberflaechen-intensiv",
    label: "Intensive Tisch- und Oberflächenreinigung",
    priceCents: 1490,
    unit: "pauschal",
    unitLabel: "",
    note: "Auch belegte Flächen, nicht nur die freien.",
    includedIn: ["plus", "complete"],
  },
  stuehle: {
    id: "stuehle",
    label: "Stühle reinigen",
    priceCents: 250,
    unit: "stueck",
    unitLabel: "Stuhl",
    note: "Polster und Gestell, je Stuhl.",
    includedIn: [],
  },
  teppich: {
    id: "teppich",
    label: "Teppich-Tiefenreinigung",
    priceCents: null,
    unit: "m2glas",
    unitLabel: "m²",
    note: "Maschinelle Reinigung für textile Flächen. Preis nach Fläche und Verschmutzungsgrad — wir schauen es uns an und nennen einen Festpreis.",
    includedIn: [],
  },
  desinfektion: {
    id: "desinfektion",
    label: "Desinfektionsreinigung",
    priceCents: 1990,
    unit: "pauschal",
    unitLabel: "",
    note: "Kontaktflächen zusätzlich desinfizieren.",
    includedIn: [],
  },
};

export const EXTRA_LIST = Object.values(EXTRAS);

/** Anfahrt ab Kloten. Innerhalb des Kerngebiets kostenlos. */
export const TRAVEL_ZONES = [
  { maxKm: 20, label: "Zürich und Umgebung", surchargeCents: 0 },
  { maxKm: 40, label: "erweitertes Gebiet", surchargeCents: 1500 },
] as const;
