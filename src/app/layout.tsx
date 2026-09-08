import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { business } from "@/config/business";
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

export const metadata: Metadata = {
  title: {
    default: `${business.name} — Büroreinigung in ${business.serviceArea.label}`,
    template: `%s | ${business.name}`,
  },
  description:
    "Büro- und Wohnungsreinigung ab Kloten. CHF 99.– pro Stunde, im Abo CHF 82.50. Preis in unter einer Minute berechnen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body className="font-sans">
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
