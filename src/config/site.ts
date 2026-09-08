/**
 * Die Adresse, unter der die Seite tatsächlich läuft.
 *
 * Sie wird gebraucht für absolute Verweise, die kein Browser auflösen kann:
 * die kanonische URL, Open Graph, die Sitemap und die strukturierten Daten.
 *
 * Der Workflow setzt sie beim Bauen, abgeleitet aus dem Ort des Repositorys
 * — dieselbe Ableitung wie beim Basispfad. Ein Umzug in eine Organisation
 * oder eine eigene Domain ändert sie also automatisch mit, statt hier als
 * veralteter String stehen zu bleiben.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://riantetova.github.io/ProClean-Solution"
).replace(/\/+$/, "");
