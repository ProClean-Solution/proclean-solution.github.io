"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BASE_SQM,
  CONDITIONS_NOTE,
  EXTRAS,
  INCLUDED_TASKS,
  PACKAGES,
  TARIFFS,
} from "@/lib/pricing/catalog";
import { cleaningPriceCents, formatMoney, formatSqmRate } from "@/lib/pricing/engine";
import { RevealLines } from "./reveal";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Die Flächen, die in der Staffel stehen. Preise kommen aus der Engine. */
const STAFFEL = [100, 150, 200, 250];

/**
 * Das Büroangebot.
 *
 * Der Aufbau folgt Florijans eigener Reihenfolge: erst der eine klare Preis,
 * dann was passiert, wenn das Büro grösser ist, dann die Optionen. Die
 * Paketkarte in der Mitte wächst beim Scrollen von Essential über Plus zu
 * Complete — dieselbe Karte, nicht drei nebeneinander. Das ist der Punkt:
 * man sieht, dass das Angebot dasselbe bleibt und nur mehr dazukommt.
 *
 * Preise stehen nirgends im Markup. Jede Zahl kommt aus cleaningPriceCents().
 */
export function OfficeOffer() {
  const root = useRef<HTMLElement>(null);
  const bahn = useRef<HTMLDivElement>(null);
  const karte = useRef<HTMLDivElement>(null);
  const balken = useRef<HTMLSpanElement>(null);
  const zeilen = useRef<HTMLLIElement[]>([]);

  /**
   * Ohne JavaScript, bei reduzierter Bewegung und vor dem ersten Effect stehen
   * alle drei Pakete offen da. Erst wenn feststeht, dass animiert werden darf,
   * schaltet die Karte in den Scrollmodus.
   */
  const [aktiv, setAktiv] = useState(false);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAktiv(true);
  }, []);

  useLayoutEffect(() => {
    if (!aktiv) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: bahn.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const el = karte.current;
          if (!el) return;

          // 0 → Essential, 1 → Plus, 2 → Complete, dazwischen wird überblendet.
          const stufe = self.progress * (PACKAGES.length - 1);
          el.style.setProperty("--stufe", stufe.toFixed(3));

          /*
            Nähe statt Schwelle: die Überschrift des nächstgelegenen Pakets
            steht voll da, die Nachbarn blenden weg. Faktor 1.35, damit
            zwischen zwei Paketen nie beide gleich blass sind.
          */
          const offen = PACKAGES.map((_, i) => {
            el.style.setProperty(
              `--kopf-${i}`,
              Math.max(0, 1 - Math.abs(stufe - i) * 1.35).toFixed(3),
            );
            return Math.min(1, Math.max(0, (stufe - (i - 0.85)) / 0.85));
          });

          /*
            Die Zusatzzeilen wachsen auf: `grid-template-rows` von 0fr auf 1fr.
            So braucht die Höhe keine Messung, und Rückwärtsscrollen fährt sie
            exakt wieder zu — ein absoluter Wert pro Frame, nichts Inkrementelles.
          */
          for (const zeile of zeilen.current) {
            const i = Number(zeile.dataset.paket ?? 0);
            const v = offen[i] ?? 0;
            zeile.style.setProperty("--r", `${v.toFixed(3)}fr`);
            zeile.style.setProperty("--o", v.toFixed(3));
          }

          if (balken.current) {
            balken.current.style.transform = `scaleX(${Math.max(0.04, self.progress)})`;
          }
        },
      });
    }, root);

    // Die Sektion wächst beim Aktivieren um mehrere Bildschirmhöhen.
    // Ohne Neuvermessung rechnen die übrigen Trigger mit den alten Werten.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => ScrollTrigger.refresh()),
    );
    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [aktiv]);

  const standard = TARIFFS.standard;
  const abo = TARIFFS.abo12;

  return (
    <section ref={root} id="angebot" className="stage scroll-mt-8 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[var(--stage-dim)] uppercase">
          ProClean Office
        </p>
        <RevealLines
          lines={["Bis 100 m².", "Eine Stunde.", "Ein klarer Preis."]}
          className="display mt-5 text-4xl sm:text-6xl"
        />

        {/* Die zwei Preise. Kein Prozentzeichen, kein Sternchen — nur "oder". */}
        <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:gap-12">
          <Preis
            betrag={formatMoney(standard.baseCents)}
            zusatz="einmalige Reinigung"
          />
          <span className="pb-3 text-sm text-[var(--stage-dim)]">oder</span>
          <Preis
            betrag={formatMoney(abo.baseCents)}
            zusatz="pro Reinigung im 12-Monats-Abo"
            hervorgehoben
          />
        </div>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--stage-dim)]">
          Enthalten sind bis zu {BASE_SQM} m² Bürofläche und 60 Minuten
          professionelle Reinigungszeit.
        </p>

        {/* Der einzige Unterschied zwischen den beiden Zahlen: ob man sich
            bindet. Steht als Satz da, nicht als Rabattbanner. */}
        <dl className="mt-8 grid max-w-2xl gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
          {[standard, abo].map((t) => (
            <div key={t.id}>
              <dt className="font-semibold">{t.label}</dt>
              <dd className="mt-1 text-[var(--stage-dim)]">{t.description}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/*
        Die wachsende Karte. Im Scrollmodus gibt die Bahn den Weg vor und die
        Karte bleibt darin stehen; ohne Animation ist die Bahn eine gewöhnliche
        Box und die Karte zeigt alles auf einmal.
      */}
      <div
        ref={bahn}
        data-offer-track=""
        className={cn("mx-auto mt-16 max-w-5xl", aktiv && "h-[260vh]")}
      >
        <div className={cn(aktiv && "sticky top-0 flex h-svh items-center")}>
          <div
            ref={karte}
            data-aktiv={aktiv ? "" : undefined}
            className="offer-card glass w-full rounded-3xl p-6 sm:p-10"
          >
            {/* Kopf: drei Namen übereinander, es steht immer nur einer da. */}
            <div className="grid">
              {PACKAGES.map((paket) => (
                <div key={paket.id} className="offer-head col-start-1 row-start-1">
                  <h3 className="display text-xl sm:text-4xl">{paket.label}</h3>
                  <p className="mt-1.5 text-[0.8rem] leading-snug text-[var(--stage-dim)] sm:mt-2 sm:text-base">
                    {paket.tagline}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[0.62rem] font-semibold tracking-[0.25em] text-[var(--stage-dim)] uppercase sm:mt-7 sm:text-xs">
              Inklusive
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.78rem] leading-snug sm:mt-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-2.5 sm:text-sm">
              {INCLUDED_TASKS.map((task) => (
                <li key={task} className="grid grid-cols-[1rem_1fr] gap-2.5">
                  <span className="text-[var(--accent)]" aria-hidden>
                    ✓
                  </span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>

            {/*
              Was die höheren Pakete dazulegen. Immer im Baum, damit
              Vorwärts- und Rückwärtsscrollen exakt dasselbe tun; sichtbar
              wird es über die Zeilenhöhe, nicht über ein Ein- und Aushängen.
            */}
            <ul className="mt-1">
              {PACKAGES.flatMap((paket, i) =>
                paket.adds.map((add, j) => (
                  <li
                    key={`${paket.id}-${add}`}
                    data-paket={i}
                    ref={(el) => {
                      // Feste Plätze statt push(): sonst wächst die Liste bei
                      // jedem Rerender weiter und der Effect arbeitet auf Leichen.
                      const pos = PACKAGES.slice(0, i).reduce((n, p) => n + p.adds.length, 0) + j;
                      if (el) zeilen.current[pos] = el;
                    }}
                    className="offer-add"
                  >
                    <span className="offer-add__inner">
                      <span className="mt-1.5 grid grid-cols-[1rem_1fr] gap-2.5 text-[0.78rem] leading-snug sm:mt-2.5 sm:text-sm">
                        <span className="text-[var(--accent)]" aria-hidden>
                          +
                        </span>
                        <span>
                          {add}
                          <span className="ml-2 rounded-full border border-[var(--stage-line)] px-2 py-0.5 text-[0.62rem] tracking-widest uppercase">
                            {paket.label.replace("Office ", "")}
                          </span>
                        </span>
                      </span>
                    </span>
                  </li>
                )),
              )}
            </ul>

            <div className="mt-6 flex flex-col gap-3.5 border-t border-[var(--stage-line)] pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
              {/* Nur Essential hat einen Preis. Für Plus und Complete steht
                  hier bewusst keine Zahl, solange keine bestätigt ist. */}
              <div className="grid">
                {PACKAGES.map((paket) => (
                  <p
                    key={paket.id}
                    className="offer-head col-start-1 row-start-1 text-sm text-[var(--stage-dim)]"
                  >
                    {paket.status === "bestaetigt" ? (
                      <>
                        <span className="font-semibold text-[var(--stage-fg)] tabular-nums">
                          {formatMoney(standard.baseCents)}
                        </span>{" "}
                        einmalig ·{" "}
                        <span className="font-semibold text-[var(--stage-fg)] tabular-nums">
                          {formatMoney(abo.baseCents)}
                        </span>{" "}
                        im Abo
                      </>
                    ) : (
                      <>Preis nach Fläche und Umfang — wir rechnen es Ihnen aus.</>
                    )}
                  </p>
                ))}
              </div>
              <a
                href="#rechner"
                className="shrink-0 rounded-full bg-[var(--accent)] px-6 py-3 text-center text-sm font-semibold text-black transition-transform duration-300 hover:scale-[1.02]"
              >
                Eigene Fläche rechnen
              </a>
            </div>

            {aktiv ? (
              <div className="mt-5 flex items-center gap-4 sm:mt-7" aria-hidden>
                <span className="h-px flex-1 bg-[var(--stage-line)]">
                  <span
                    ref={balken}
                    className="block h-px origin-left bg-[var(--accent)]"
                    style={{ transform: "scaleX(0.04)" }}
                  />
                </span>
                <span className="text-[0.62rem] tracking-[0.25em] text-[var(--stage-dim)] uppercase">
                  Weiterscrollen
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mehr Fläche: die Staffel, gerechnet statt getippt. */}
      <div className="mx-auto mt-20 max-w-5xl">
        <RevealLines
          lines={["Mehr Büro? Kein Problem."]}
          as="h3"
          className="display text-3xl sm:text-5xl"
        />
        <p className="mt-5 max-w-xl leading-relaxed text-[var(--stage-dim)]">
          Ist Ihr Büro grösser als {BASE_SQM} m² oder braucht die Reinigung mehr als
          60 Minuten, wird die zusätzliche Fläche transparent dazugerechnet:{" "}
          <span className="text-[var(--stage-fg)]">
            {formatSqmRate(standard.perSqmCents)} pro m²
          </span>
          , im Abo {formatSqmRate(abo.perSqmCents)}. Zusätzliche Reinigungszeit nur
          dann, wenn sie tatsächlich gebraucht wird.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs tracking-[0.2em] text-[var(--stage-dim)] uppercase">
                <th scope="col" className="py-3 font-semibold">
                  Fläche
                </th>
                <th scope="col" className="py-3 text-right font-semibold">
                  Einmalig
                </th>
                <th scope="col" className="py-3 text-right font-semibold">
                  Im 12-Monats-Abo
                </th>
              </tr>
            </thead>
            <tbody>
              {STAFFEL.map((sqm) => (
                <tr key={sqm} className="border-t border-[var(--stage-line)]">
                  <th scope="row" className="py-3.5 font-medium tabular-nums">
                    {sqm} m²
                  </th>
                  <td className="py-3.5 text-right tabular-nums">
                    {formatMoney(cleaningPriceCents(sqm, "standard"))}
                  </td>
                  <td className="py-3.5 text-right font-semibold tabular-nums text-[var(--accent)]">
                    {formatMoney(cleaningPriceCents(sqm, "abo12"))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional dazu */}
      <div className="mx-auto mt-20 max-w-5xl">
        <h3 className="display text-3xl sm:text-5xl">Optional dazu</h3>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Object.values(EXTRAS).map((extra) => (
            <article
              key={extra.id}
              className="glass glass-hover rounded-2xl p-6"
            >
              <h4 className="text-sm font-semibold">{extra.label}</h4>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--stage-dim)]">
                {extra.note}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-[var(--stage-dim)]">
          {CONDITIONS_NOTE}
        </p>
      </div>
    </section>
  );
}

function Preis({
  betrag,
  zusatz,
  hervorgehoben,
}: {
  betrag: string;
  zusatz: string;
  hervorgehoben?: boolean;
}) {
  return (
    <p className="flex flex-col">
      <span
        className={cn(
          "text-5xl font-black tracking-tight tabular-nums sm:text-6xl",
          hervorgehoben && "text-[var(--accent)]",
        )}
      >
        {betrag}
      </span>
      <span className="mt-2 text-sm text-[var(--stage-dim)]">{zusatz}</span>
    </p>
  );
}
