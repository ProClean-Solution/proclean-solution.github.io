import { Assistant } from "@/components/ui/assistant";
import { CleanSweep } from "@/components/ui/clean-sweep";
import { Hero } from "@/components/ui/hero";
import { PriceCalculator } from "@/components/ui/price-calculator";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { Tariffs } from "@/components/ui/tariffs";
import { business } from "@/config/business";

/*
  Aufbau als Abfolge dunkler Bühnen und heller Arbeitsflächen: der Wechsel
  trägt den kinematischen Eindruck, ohne dass ein einziges Bild geladen wird.

  Die Regel darüber: der Buchungsweg bleibt kurz. "Preis berechnen" steht im
  ersten Bild, und der Rechner funktioniert vollständig ohne jede Animation.
*/
export default function Home() {
  return (
    <>
      <SmoothScroll />
      <main id="inhalt">
        <Hero />
        <CleanSweep />
        <Tariffs />

        <section id="rechner" className="scroll-mt-8 px-5 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              Rechner
            </p>
            <h2 className="display mt-5 text-4xl sm:text-6xl">Was kostet es bei Ihnen?</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Fläche eingeben, Preis sehen. Jede Position einzeln, ohne dass Sie Ihre
              Adresse hinterlassen müssen.
            </p>
            <PriceCalculator className="mt-12" />
          </div>
        </section>

        <section className="px-5 pb-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              Fragen
            </p>
            <h2 className="display mt-5 text-4xl sm:text-6xl">Noch etwas offen?</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Antwort sofort, rund um die Uhr. Und wenn wir etwas nicht sicher wissen,
              sagen wir das, statt zu raten.
            </p>
            <Assistant className="mt-12 max-w-2xl" />
          </div>
        </section>
      </main>

      <footer className="stage px-5 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="display text-2xl">{business.name}</p>
            <address className="mt-4 text-sm leading-relaxed text-[var(--stage-dim)] not-italic">
              {business.owner}
              <br />
              {business.address.street}
              <br />
              {business.address.zip} {business.address.city}
            </address>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:text-right">
            <a href={`tel:${business.contact.phone.replace(/\s/g, "")}`} className="font-semibold">
              {business.contact.phone}
            </a>
            <a href={`mailto:${business.contact.email}`} className="text-[var(--stage-dim)]">
              {business.contact.email}
            </a>
            <p className="mt-3 text-xs text-[var(--stage-dim)]">
              {business.hours.weekdays} · {business.hours.saturday}
            </p>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-6xl text-xs text-[var(--stage-dim)]">
          {business.vatRegistered
            ? business.priceNote.registered
            : business.priceNote.notRegistered}{" "}
          · Impressum und Datenschutz folgen.
        </p>
      </footer>
    </>
  );
}
