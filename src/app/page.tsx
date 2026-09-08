import { Assistant } from "@/components/ui/assistant";
import { PriceCalculator } from "@/components/ui/price-calculator";
import { business } from "@/config/business";

/*
  Phase 1: die tragende Struktur. Preis und Buchung stehen bewusst weit oben —
  die kinematische Ebene aus Phase 3 legt sich später darüber, verschiebt sie
  aber nicht nach unten.
*/
export default function Home() {
  return (
    <main id="inhalt" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          {business.name}
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-balance sm:text-6xl">
          Sauber wird verabredet, nicht verhandelt.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Preis in unter einer Minute, Termin online, feste Ansprechpartner. Kein Rückruf nötig,
          um zu erfahren, was es kostet.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#rechner"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Preis berechnen
          </a>
          <a
            href={`tel:${business.contact.phone.replace(/\s/g, "")}`}
            className="rounded-full border px-6 py-3 text-sm font-semibold"
          >
            Anrufen {business.contact.phone}
          </a>
        </div>
      </header>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {[
          { title: "Versichert", body: "Betriebshaftpflicht deckt Schäden an Ihrem Eigentum ab." },
          { title: "Fest angestellt", body: "Keine wechselnden Subunternehmer, feste Zuordnung." },
          { title: "Nacharbeit gratis", body: "Nicht zufrieden? Innerhalb von 24 Stunden melden." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border bg-card p-6 text-card-foreground">
            <h2 className="text-sm font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <section id="rechner" className="mt-24 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Was kostet es bei Ihnen?</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Jede Position einzeln aufgeschlüsselt. Kein Kleingedrucktes, keine Adresse nötig.
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
