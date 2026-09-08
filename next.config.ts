import type { NextConfig } from "next";

/**
 * Für die Live-Vorschau wird die Seite als statische Version ausgegeben.
 *
 * Das geht nur, weil hier nichts auf einem Server läuft: keine API-Routen,
 * keine Server Actions, keine Bildoptimierung. Der Preisrechner und der
 * Assistent rechnen vollständig im Browser des Besuchers — genau die
 * Entscheidung, die die Seite kostenlos betreibbar macht, macht sie hier
 * auch statisch auslieferbar.
 *
 * `PAGES_BASE` setzt der Vorschau-Workflow auf den Repositorynamen, weil
 * GitHub Pages Projektseiten unter einem Unterpfad ausliefert. Lokal und
 * bei jedem anderen Hoster bleibt es leer, und die Seite liegt an der Wurzel.
 */
const vorschau = process.env.STATIC_EXPORT === "1";
const basis = process.env.PAGES_BASE ?? "";

const nextConfig: NextConfig = {
  ...(vorschau
    ? {
        output: "export" as const,
        basePath: basis,
        // Ohne abschliessenden Schrägstrich sucht Pages bei /angebot eine
        // Datei statt eines Verzeichnisses und antwortet mit 404.
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  images: {
    unoptimized: vorschau,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui.aceternity.com" },
    ],
  },
};

export default nextConfig;
