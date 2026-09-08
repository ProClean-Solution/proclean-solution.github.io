import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { business } from "@/config/business";
import { PACKAGES } from "@/lib/pricing/catalog";
import { formatMoney, packagePriceCents } from "@/lib/pricing/engine";
import { siteUrl } from "@/config/site";
import "./globals.css";

/*
  Schriften über next/font statt @import im Stylesheet: kein zusätzlicher
  Netzwerk-Roundtrip, kein Layout-Sprung, und der DSGVO-relevante Aufruf an
  fonts.googleapis.com entfällt, weil die Dateien mit ausgeliefert werden.
*/
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

/*
  Die Beschreibung wird aus dem Katalog gebaut, nicht getippt.

  Sie stand monatelang mit "CHF 99.– pro Stunde" da — ein Preismodell, das
  es nicht mehr gibt. Genau dieser Satz ist das, was in der Trefferliste
  steht: die einzige Zeile, die ein Suchender liest, bevor er klickt.
*/
const einstieg = PACKAGES[0];
const beschreibung =
  `Büroreinigung in ${business.serviceArea.label}. Drei Pakete ab ` +
  `${formatMoney(einstieg.baseCents)} pro Reinigung bis 100 m², im 12-Monats-Abo ` +
  `${formatMoney(packagePriceCents(100, einstieg.id, "abo12"))}. ` +
  `Preis in unter einer Minute berechnen.`;

const titel = `${business.name} — Büroreinigung in ${business.serviceArea.label}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: titel, template: `%s | ${business.name}` },
  description: beschreibung,
  alternates: { canonical: "/" },
  /*
    Ohne Open Graph zeigt WhatsApp beim Teilen des Links nur die nackte
    Adresse. Für einen Betrieb, dessen Empfehlungen über Nachrichten laufen,
    ist das die sichtbarste Stelle überhaupt — sichtbarer als Google.
  */
  openGraph: {
    type: "website",
    locale: "de_CH",
    url: siteUrl,
    siteName: business.name,
    title: titel,
    description: beschreibung,
  },
  twitter: { card: "summary_large_image", title: titel, description: beschreibung },
  robots: { index: true, follow: true },
};

/** Der Betrieb in der Form, die Suchmaschinen lesen. */
const unternehmen = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: business.name,
  description: beschreibung,
  url: siteUrl,
  telephone: business.contact.phone,
  email: business.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    postalCode: business.address.zip,
    addressLocality: business.address.city,
    addressCountry: "CH",
  },
  areaServed: business.serviceArea.label,
  priceRange: `${formatMoney(PACKAGES[0].baseCents)}–${formatMoney(PACKAGES[PACKAGES.length - 1].baseCents)}`,
  openingHours: [business.hours.weekdays, business.hours.saturday],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body className="font-sans">
        {/*
          Strukturierte Daten für die lokale Suche. Sie ersetzen kein
          Google-Unternehmensprofil — das ist der Eintrag, der bei
          "Büroreinigung Zürich" in der Karte auftaucht —, aber sie sagen
          Suchmaschinen, welcher Betrieb hinter dieser Seite steht.

          Alles daraus kommt aus business.ts; hier steht keine zweite Wahrheit.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(unternehmen) }}
        />
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Zum Inhalt springen
        </a>
        {children}
      </body>
    </html>
  );
}
