"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INCLUDED_SUMMARY } from "@/lib/pricing/catalog";
import { RevealLines } from "./reveal";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Der Wisch.
 *
 * Beim Scrollen fährt eine Kante über eine Fläche und lässt sie sauber zurück.
 * Es ist die einzige gepinnte Sektion der Seite — mehr als ein bis zwei davon
 * kämpfen gegen das native Scrollgefühl, besonders auf dem Handy.
 *
 * Bewusst ohne Bild: die stumpfe und die saubere Fläche sind zwei CSS-Verläufe
 * übereinander, die obere per clip-path aufgezogen. Kostet null Ladezeit, ist
 * in jeder Auflösung scharf, und zeigt buchstäblich das Geschäft.
 *
 * Die Überschrift steht über der Fläche und bleibt während des ganzen Pins
 * sichtbar. Eine gepinnte Sektion, in der nur ein Rechteck die Farbe wechselt,
 * hält niemanden — der Satz muss die Bewegung tragen.
 */
export function CleanSweep() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Vom fertigen Ruhezustand auf den Anfang der Animation zurücksetzen.
        gsap.set(".sweep-clean", { clipPath: "inset(0 100% 0 0)" });
        gsap.set(".sweep-edge", { left: "0%", opacity: 0 });
        gsap.set(".sweep-before", { opacity: 1 });
        gsap.set(".sweep-after", { opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=130%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });

        // Absolute Zeitpunkte statt relativer Versätze: bei verketteten "<"
        // driftet die Beschriftung gegenüber der Kante, und der Wechsel
        // passiert nicht mehr dort, wo er hingehört.
        tl.to(".sweep-edge", { opacity: 1, duration: 0.05 }, 0)
          .to(".sweep-clean", { clipPath: "inset(0 0% 0 0)", ease: "none", duration: 1 }, 0)
          .to(".sweep-edge", { left: "100%", ease: "none", duration: 1 }, 0)
          // Der Text wechselt, während die Kante die Mitte passiert.
          .to(".sweep-before", { opacity: 0, duration: 0.2 }, 0.42)
          .to(".sweep-after", { opacity: 1, duration: 0.2 }, 0.52)
          .to(".sweep-edge", { opacity: 0, duration: 0.08 }, 0.95);
      });

      // Schriften verschieben die Höhe; ohne das steht der Pin an der falschen Stelle.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="stage relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 py-16"
      aria-label="Eine Stunde, hundert Quadratmeter"
    >
      <div className="mx-auto w-full max-w-5xl">
        <RevealLines
          lines={["Eine Stunde.", "Hundert Quadratmeter."]}
          className="display max-w-2xl text-[clamp(2rem,5.5vw,3.75rem)]"
        />
        <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--stage-dim)] sm:text-lg">
          Der Preis steht vor dem ersten Termin fest. Die Zimmerzahl ändert nichts daran.
        </p>

        <div className="relative mt-10 h-[38svh] max-h-[26rem] min-h-[11rem] w-full overflow-hidden rounded-2xl">
          {/* Unten: die stumpfe Fläche */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #2a2724 0%, #35302b 40%, #29251f 100%)",
            }}
          >
            {/* Schlieren und Flecken, damit es nach Fläche aussieht, nicht nach Farbfeld */}
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 18% 40% at 22% 34%, rgba(140,128,108,.55), transparent 70%), radial-gradient(ellipse 22% 35% at 63% 66%, rgba(126,114,98,.5), transparent 70%), radial-gradient(ellipse 14% 30% at 84% 28%, rgba(150,138,118,.4), transparent 70%), repeating-linear-gradient(102deg, rgba(160,148,128,.09) 0 2px, transparent 2px 22px)",
              }}
            />
          </div>

          {/* Oben: dieselbe Fläche, sauber. Wird per clip-path aufgezogen. */}
          <div
            className="sweep-clean absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #f2efec 0%, #ffffff 45%, #e9e5e0 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, transparent 28%, rgba(255,255,255,.95) 46%, transparent 64%)",
              }}
            />
          </div>

          {/* Die Kante, die den Wisch führt */}
          <div
            className="sweep-edge absolute top-0 bottom-0 w-px opacity-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--accent), transparent)",
              boxShadow: "0 0 28px 5px color-mix(in oklch, var(--accent) 60%, transparent)",
            }}
            aria-hidden
          />
        </div>

        {/* Beschriftung wechselt mit der Kante. Beide Zeilen im selben Raster,
            damit darunter nichts springt. */}
        <div className="mt-5 grid text-sm">
          {/* Ruhezustand ohne JavaScript: Fläche sauber, "Nachher" sichtbar.
              GSAP dreht das für die Animation auf den Anfang zurück. */}
          <p className="sweep-before col-start-1 row-start-1 text-[var(--stage-dim)] opacity-0">
            Vorher — Büro nach einer Arbeitswoche
          </p>
          <p className="sweep-after col-start-1 row-start-1 font-semibold text-[var(--accent)]">
            Nachher — {INCLUDED_SUMMARY}
          </p>
        </div>
      </div>
    </section>
  );
}
