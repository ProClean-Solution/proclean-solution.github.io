"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { business } from "@/config/business";
import { INCLUDED_TASKS, TARIFFS } from "@/lib/pricing/catalog";
import { calculateQuote, formatMoney } from "@/lib/pricing/engine";
import type { QuoteInput } from "@/lib/pricing/types";
import { RevealLines } from "./reveal";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Referenzfall, an dem beide Tarife verglichen werden: 100 m² wöchentlich. */
const REFERENZ: QuoteInput = {
  objectType: "buero",
  squareMeters: 100,
  tariff: "standard",
  frequency: "woechentlich",
  extras: [],
  distanceKm: 10,
};

/**
 * Die Tarifwahl.
 *
 * Aufbau nach dem Muster, das Apple auf seinen Produktseiten benutzt: der teure
 * Tarif steht zuerst und setzt den Anker, der empfohlene steht daneben und wirkt
 * dadurch wie die vernünftige Wahl. Kein Prozentzeichen, kein "Aktion" —
 * die Ersparnis steht als Betrag da und muss nicht beworben werden.
 */
export function Tariffs() {
  const root = useRef<HTMLElement>(null);

  const standard = calculateQuote(REFERENZ);
  const abo = calculateQuote({ ...REFERENZ, tariff: "abo12" });
  const ersparnisProMonat = (standard.perMonthCents ?? 0) - (abo.perMonthCents ?? 0);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Auftritt aus dem sichtbaren Zustand heraus, nicht aus opacity 0 geparkt.
        gsap.from(".tariff-card", {
          opacity: 0,
          y: 28,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const karten = [
    {
      def: TARIFFS.standard,
      quote: standard,
      empfohlen: false,
      punkte: [
        "Keine Mindestlaufzeit",
        "Termin jederzeit verschiebbar",
        "Monatliche Rechnung",
      ],
    },
    {
      def: TARIFFS.abo12,
      quote: abo,
      empfohlen: true,
      punkte: [
        "12 Monate, danach monatlich kündbar",
        "Fester Termin, feste Ansprechperson",
        `${formatMoney(ersparnisProMonat)} weniger im Monat`,
      ],
    },
  ];

  return (
    <section ref={root} id="tarife" className="stage scroll-mt-8 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[var(--stage-dim)] uppercase">
          Tarife
        </p>
        <RevealLines
          lines={["Zwei Wege.", "Ein Preis pro Stunde."]}
          className="display mt-5 text-4xl sm:text-6xl"
        />
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--stage-dim)]">
          Beide enthalten dieselbe Arbeit. Der Unterschied ist nur, ob Sie sich binden.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {karten.map(({ def, quote, empfohlen, punkte }) => (
            <article
              key={def.id}
              className={cn(
                "tariff-card glass glass-hover relative flex flex-col rounded-3xl p-8",
                empfohlen && "ring-1 ring-[var(--accent)]",
              )}
            >
              {empfohlen ? (
                <span className="absolute -top-3 left-8 rounded-full bg-[var(--accent)] px-3.5 py-1 text-[0.68rem] font-bold tracking-widest text-black uppercase">
                  Empfohlen
                </span>
              ) : null}

              <h3 className="text-sm font-semibold tracking-widest uppercase">{def.label}</h3>

              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight tabular-nums">
                  {formatMoney(def.hourlyCents)}
                </span>
                <span className="text-sm text-[var(--stage-dim)]">pro Stunde</span>
              </p>

              <p className="mt-3 text-sm text-[var(--stage-dim)]">
                100 m² wöchentlich —{" "}
                <span className="font-semibold text-[var(--stage-fg)] tabular-nums">
                  {formatMoney(quote.perMonthCents ?? 0)}
                </span>{" "}
                im Monat
              </p>

              <ul className="mt-8 space-y-3 text-sm">
                {punkte.map((punkt) => (
                  <li key={punkt} className="grid grid-cols-[1rem_1fr] gap-3">
                    <span className="text-[var(--accent)]" aria-hidden>
                      ✓
                    </span>
                    <span>{punkt}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#rechner"
                className={cn(
                  "mt-10 rounded-full px-6 py-3.5 text-center text-sm font-semibold transition-transform duration-300 hover:scale-[1.02]",
                  empfohlen
                    ? "bg-[var(--accent)] text-black"
                    : "border border-[var(--stage-line)] text-[var(--stage-fg)]",
                )}
              >
                Eigene Fläche rechnen
              </a>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-5 rounded-3xl border border-[var(--stage-line)] p-8 sm:grid-cols-[auto_1fr] sm:gap-10">
          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase">In beiden enthalten</h3>
            <p className="mt-2 max-w-xs text-sm text-[var(--stage-dim)]">
              Mittel und Geräte bringen wir mit. Fensterreinigung kommt separat dazu.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
            {INCLUDED_TASKS.map((task) => (
              <li key={task} className="grid grid-cols-[1rem_1fr] gap-2.5">
                <span className="text-[var(--accent)]" aria-hidden>
                  ✓
                </span>
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm text-[var(--stage-dim)]">
          {business.vatRegistered
            ? business.priceNote.registered
            : business.priceNote.notRegistered}
        </p>
      </div>
    </section>
  );
}
