/**
 * Stammdaten ProClean Solution.
 *
 * Einzige Stelle für Firmierung, Währung, Steuer und Kontakt.
 * Alles andere im Projekt liest hier.
 */
export const business = {
  name: "ProClean Solution",
  owner: "Florijan Djeljilji",
  address: {
    street: "Balsbergweg 20",
    zip: "8302",
    city: "Kloten",
    country: "CH",
  },

  locale: "de-CH",
  currency: "CHF",

  /**
   * ANNAHME, bitte prüfen: nicht mehrwertsteuerpflichtig.
   * In der Schweiz beginnt die MWST-Pflicht bei CHF 100'000 Jahresumsatz.
   * Solange `vatRegistered` false ist, sind die Katalogpreise Endpreise und
   * es wird keine Steuer ausgewiesen. Sobald du pflichtig wirst: auf true
   * setzen — Rechner und Angebote weisen die MWST dann automatisch aus.
   */
  vatRegistered: false,
  /** Schweizer Normalsatz seit 1.1.2024. */
  vatRate: 0.081,
  /**
   * Wird an jedem Preis ausgewiesen. Florijan will das explizit sichtbar haben.
   *
   * ACHTUNG bei der Formulierung: "exkl. MwSt." heisst, dass noch Steuer
   * dazukommt. Solange `vatRegistered` false ist, stimmt das nicht — dann ist
   * der Preis endgültig. Die beiden Texte unten decken beide Fälle sauber ab.
   */
  priceNote: {
    notRegistered: "Preise ohne MwSt. — wir sind nicht mehrwertsteuerpflichtig, es kommt nichts dazu.",
    registered: "Preise exkl. MwSt. (8,1 %)",
  },

  /**
   * Explizit als string typisiert, nicht über `as const` verengt: sonst
   * verengt TypeScript ein leeres Feld auf den Literaltyp "" und jede
   * Prüfung `if (contact.phone)` kollabiert zu `never`.
   */
  contact: {
    phone: "+41 76 250 05 99",
    /**
     * Später auf florijan.djeljilji@procleansolution.ch umstellen.
     * Sobald die Domain steht: hier ändern, sonst nirgends.
     */
    email: "florijan.d@outlook.com",
    whatsapp: "", // dieselbe Nummer? Dann hier "41762500599" eintragen
  } as { phone: string; email: string; whatsapp: string },

  /** Einzugsgebiet ab Kloten. */
  serviceArea: {
    label: "Zürich und Umgebung",
    /** Ohne Zuschlag. Kloten–Zürich sind rund 10 km. */
    freeRadiusKm: 20,
    maxRadiusKm: 40,
  },

  hours: {
    weekdays: "Mo–Fr 07:00–18:00",
    saturday: "Sa 08:00–14:00",
    sunday: "geschlossen",
  },

  responsePromise: "Antwort innerhalb von 24 Stunden an Werktagen",
} as const;
