/**
 * Zentrale Stammdaten. ANNAHME: Deutschland / EUR / 19 % USt.
 * Für Österreich oder die Schweiz nur diese Datei anpassen —
 * Währung, Steuersatz und Locale werden nirgendwo sonst hartkodiert.
 */
export const business = {
  name: "ProClean Solution",
  legalName: "ProClean Solution", // TODO: vollständige Firmierung eintragen
  locale: "de-DE",
  currency: "EUR",
  vatRate: 0.19,
  /** Preise werden Privatkunden gegenüber inkl. USt. angezeigt (PAngV). */
  pricesIncludeVat: true,

  contact: {
    phone: "+49 000 0000000", // TODO
    email: "hallo@proclean-solution.de", // TODO
    whatsapp: "", // optional
  },

  hours: {
    weekdays: "Mo–Fr 07:00–18:00",
    saturday: "Sa 08:00–14:00",
    sunday: "geschlossen",
  },

  /** Reaktionszeit, die wir öffentlich zusagen. */
  responsePromise: "Antwort innerhalb von 24 Stunden an Werktagen",
} as const;
