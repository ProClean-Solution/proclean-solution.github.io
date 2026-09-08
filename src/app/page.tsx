import { Assistant } from "@/components/ui/assistant";
import { PriceCalculator } from "@/components/ui/price-calculator";
import { business } from "@/config/business";
import { INCLUDED_TASKS, TARIFFS } from "@/lib/pricing/catalog";
import { formatMoney } from "@/lib/pricing/engine";

/*
  Phase 1: die tragende Struktur. Preis und Anfrage stehen bewusst weit oben —
  die kinematische Ebene aus Phase 3 legt sich später darüber, verschiebt sie
  aber nicht nach unten.
*/
export default function Home() {
  return (
    <main id="inhalt" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          {business.name} · {business.serviceArea.label}
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-balance sm:text-6xl">
          Büroreinigung zum Stundenpreis. Ohne Rückruf, ohne Rätselraten.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {formatMoney(TARIFFS.standard.hourlyCents)} pro Stunde, im Abo{" "}
          {formatMoney(TARIFFS.abo12.hourlyCents)}. Ein Büro mit 100 m² schaffen wir in einer
          Stunde. Wie viele Zimmer es hat, ändert nichts am Preis.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#rechner"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Preis berechnen
          </a>
          {business.contact.phone ? (
            <a
              href={`tel:${business.contact.phone.replace(/\s/g, "")}`}
              className="rounded-full border px-6 py-3 text-sm font-semibold"
            >
              Anrufen {business.contact.phone}
            </a>
          ) : null}
        </div>
      </header>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 text-card-foreground">
          <h2 className="text-sm font-semibold">Fester Stundenpreis</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {formatMoney(TARIFFS.standard.hourlyCents)} pro Stunde, jederzeit kündbar. Keine
            versteckten Zuschläge nach Zimmerzahl.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 text-card-foreground">
          <h2 className="text-sm font-semibold">Abo spart 17 Prozent</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {formatMoney(TARIFFS.abo12.hourlyCents)} pro Stunde bei zwölf Monaten Mindestlaufzeit —
            für 100 m² wöchentlich {formatMoney(33000)} statt {formatMoney(39600)} im Monat.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 text-card-foreground">
          <h2 className="text-sm font-semibold">Immer enthalten</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {INCLUDED_TASKS.join(", ")}. Mittel und Geräte bringen wir mit.
          </p>
        </div>
      </div>

      <section id="rechner" className="mt-24 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Was kostet es bei Ihnen?</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Fläche eingeben, Preis sehen. Jede Position einzeln aufgeschlüsselt, ohne dass Sie Ihre
          Adresse hinterlassen müssen.
        </p>
        <PriceCalculator className="mt-8" />
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Noch eine Frage offen?</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Antwort sofort, ohne Wartezeit — und wenn wir etwas nicht sicher wissen, sagen wir das,
          statt zu raten.
        </p>
        <Assistant className="mt-8 max-w-2xl" />
      </section>
    </main>
  );
}
