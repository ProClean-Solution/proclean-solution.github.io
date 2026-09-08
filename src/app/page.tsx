import { Assistant } from "@/components/ui/assistant";
import { CinematicFooter } from "@/components/ui/cinematic-footer";
import { CleanSweep } from "@/components/ui/clean-sweep";
import { RevealLines } from "@/components/ui/reveal";
import { Hero } from "@/components/ui/hero";
import { IntroShell } from "@/components/intro/intro-shell";
import { OfficeOffer } from "@/components/ui/office-offer";
import { PriceCalculator } from "@/components/ui/price-calculator";
import { SiteNav } from "@/components/ui/site-nav";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

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
      <SiteNav />
      <main id="inhalt">
        {/*
          Der bestehende Hero, unverändert. IntroShell legt den Film davor und
          macht ihn zu dem, was am Ende durch das gereinigte Glas sichtbar wird.
          Ohne den Film (reduzierte Bewegung) reicht die Hülle die Komponente
          unverändert durch.
        */}
        <IntroShell>
          <Hero />
        </IntroShell>
        <CleanSweep />
        {/* Das Büroangebot in Florijans eigener Reihenfolge: erst der eine
            Preis, dann die wachsende Paketkarte, dann Fläche und Optionen. */}
        <OfficeOffer />

        <section id="rechner" className="scroll-mt-24 px-5 py-24 sm:py-32">
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

        {/*
          Die Fragen stehen auf der Bühne, nicht auf hellem Grund.

          Zwei Gründe: der Assistent ist der letzte Schritt vor dem Anruf und
          verdient dasselbe Gewicht wie das Angebot — und die Seite läuft
          dadurch dunkel in den Abspann hinein, statt am hellen Rechner
          abzubrechen und unten hart umzuschalten.
        */}
        <section id="fragen" className="stage scroll-mt-24 px-5 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-start lg:gap-16">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold tracking-[0.3em] text-[var(--stage-dim)] uppercase">
                Fragen
              </p>
              <RevealLines
                lines={["Noch etwas", "offen?"]}
                className="display mt-5 text-4xl sm:text-6xl"
              />
              <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--stage-dim)]">
                Antwort sofort, rund um die Uhr. Und wenn wir etwas nicht sicher wissen,
                sagen wir das, statt zu raten.
              </p>
              <p className="mt-8 max-w-md text-sm leading-relaxed text-[var(--stage-dim)]">
                Die Antworten sind von Hand geschrieben und geprüft — hier rät kein
                Sprachmodell, und es entstehen keine Wartezeiten.
              </p>
            </div>
            <Assistant />
          </div>
        </section>

      </main>

      <CinematicFooter />
    </>
  );
}
