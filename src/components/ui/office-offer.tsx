"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { business } from "@/config/business";
import {
  BASE_SQM,
  CONDITIONS_NOTE,
  EXTRA_LIST,
  INCLUDED_TASKS,
  PACKAGES,
  TARIFFS,
  packagesCovering,
} from "@/lib/pricing/catalog";
import {
  formatMoney,
  formatSqmRate,
  packagePriceCents,
  packageSqmRateCents,
} from "@/lib/pricing/engine";
import { RevealLines } from "./reveal";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Die Flächen, die in der Staffel stehen. Preise kommen aus der Engine. */
const STAFFEL = [100, 150, 200, 250];

/**
 * Das Büroangebot.
 *
 * Der Aufbau folgt Florijans eigener Reihenfolge: erst die drei Pakete, dann
 * was passiert, wenn das Büro grösser ist, dann die Zusatzleistungen. Die
 * Paketkarte in der Mitte wächst beim Scrollen von Essential über Plus zu
 * Complete — dieselbe Karte, nicht drei nebeneinander. Das ist der Punkt:
 * man sieht, dass der Grundumfang bleibt und nur mehr dazukommt, und trifft
 * am Ende drei klare Entscheidungen statt fünfzehn Häkchen.
 *
 * Preise stehen nirgends im Markup. Jede Zahl kommt aus packagePriceCents().
 */
export function OfficeOffer() {
  const root = useRef<HTMLElement>(null);
  const bahn = useRef<HTMLDivElement>(null);
  const karte = useRef<HTMLDivElement>(null);
  const balken = useRef<HTMLSpanElement>(null);
  const zeilen = useRef<HTMLLIElement[]>([]);
  const knoepfe = useRef<HTMLButtonElement[]>([]);

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
            Nähe statt Schwelle: Kopf und Preis des nächstgelegenen Pakets
            stehen voll da, die Nachbarn blenden weg. Faktor 1.35, damit
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

          // Die Übersicht oben zeigt mit, wo man in der Karte gerade steht.
          knoepfe.current.forEach((knopf, i) => {
            if (!knopf) return;
            if (Math.round(stufe) === i) knopf.setAttribute("data-aktiv", "");
            else knopf.removeAttribute("data-aktiv");
          });

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

  /**
   * Fährt die Karte auf ein bestimmtes Paket.
   *
   * Die Position wird aus der Bahn gerechnet, nicht gespeichert: ihre Höhe
   * steht in Bildschirmhöhen im Markup und ändert sich mit dem Viewport.
   * Ohne aktive Animation gibt es keine Bahn — dann steht die Karte ohnehin
   * vollständig da und der Klick springt einfach zu ihr.
   */
  function zeigePaket(i: number) {
    const el = bahn.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const oben = box.top + window.scrollY;
    const ziel = aktiv
      ? oben + ((box.height - window.innerHeight) * i) / (PACKAGES.length - 1)
      : oben;
    window.scrollTo({
      top: Math.round(ziel),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  const essential = PACKAGES[0];

  return (
    <section ref={root} id="angebot" className="stage scroll-mt-24 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[var(--stage-dim)] uppercase">
          ProClean Office
        </p>
        <RevealLines
          lines={["Drei Pakete.", "Ein Preis pro Reinigung."]}
          className="display mt-5 text-4xl sm:text-6xl"
        />
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--stage-dim)]">
          Jedes Paket gilt bis {BASE_SQM} m² Bürofläche und 60 Minuten
          Reinigungszeit. Wie oft im Monat wir kommen, entscheiden Sie danach.
        </p>

        {/*
          Die drei Preise nebeneinander — und zugleich die Steuerung für die
          Karte darunter.

          Als reine Übersicht standen hier dieselben Zahlen, die die Karte
          zwei Zentimeter tiefer noch einmal nennt. Als Schaltflächen sind sie
          der Weg zum jeweiligen Paket: ein Klick fährt die Karte dorthin,
          und beim Scrollen zeigt die Übersicht mit, wo man gerade steht.
        */}
        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {PACKAGES.map((paket, i) => (
            <li key={paket.id} className="relative">
              {paket.beliebt ? (
                <span className="pointer-events-none absolute -top-2.5 left-6 z-10 rounded-full bg-[var(--accent)] px-3 py-0.5 text-[0.62rem] font-bold tracking-widest text-black uppercase">
                  Beliebt
                </span>
              ) : null}
              <button
                type="button"
                ref={(el) => {
                  if (el) knoepfe.current[i] = el;
                }}
                onClick={() => zeigePaket(i)}
                aria-label={`${paket.label} ansehen`}
                className={cn(
                  "offer-pick glass glass-hover block w-full rounded-2xl p-6 text-left",
                  paket.beliebt && "ring-1 ring-[var(--accent)]",
                )}
              >
                <span className="block text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--stage-dim)] uppercase">
                  {paket.label.replace("Office ", "")}
                </span>
                <span className="mt-3 block text-3xl font-black tracking-tight tabular-nums">
                  {formatMoney(paket.baseCents)}
                </span>
                <span className="mt-1.5 block text-sm text-[var(--stage-dim)]">
                  im Abo{" "}
                  <span className="font-semibold text-[var(--accent)] tabular-nums">
                    {formatMoney(packagePriceCents(BASE_SQM, paket.id, "abo12"))}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* Der einzige Unterschied zwischen den beiden Zahlen: ob man sich
            bindet. Steht als Satz da, nicht als Rabattbanner. */}
        {/* Als Fussnote gesetzt, nicht als dritte Spalte: unter einem
            Dreierraster hing die zweispaltige Liste sonst schief. */}
        <dl className="mt-8 grid gap-x-10 gap-y-3 border-t border-[var(--stage-line)] pt-6 text-sm sm:grid-cols-3">
          {Object.values(TARIFFS).map((t) => (
            <div key={t.id}>
              <dt className="font-semibold">{t.label}</dt>
              <dd className="mt-1 text-[var(--stage-dim)]">{t.description}</dd>
            </div>
          ))}
          {/* Dritte Spalte, damit das Raster nicht mit einer Lücke endet — und
              weil genau hier die Frage aufkommt, worauf sich die Zahl bezieht. */}
          <div>
            <dt className="font-semibold">Wofür der Preis gilt</dt>
            <dd className="mt-1 text-[var(--stage-dim)]">
              Pro Reinigung, bis {BASE_SQM} m².{" "}
              {business.vatRegistered ? "Inklusive MwSt." : "Preis ohne MwSt."}
            </dd>
          </div>
        </dl>
      </div>

      {/*
        Die wachsende Karte. Im Scrollmodus gibt die Bahn den Weg vor und die
        Karte bleibt darin stehen; ohne Animation ist die Bahn eine gewöhnliche
        Box und die Karte zeigt alles auf einmal.
      */}
      {/* `data-nav-frei`: solange die Karte gepinnt läuft, gehört der Bildschirm
          ihr. Auf dem Handy deckte die Navigationsleiste sonst den Paketnamen zu. */}
      <div
        ref={bahn}
        data-offer-track=""
        data-nav-frei=""
        className={cn("mx-auto mt-16 max-w-5xl", aktiv && "h-[260vh]")}
      >
        <div className={cn(aktiv && "sticky top-0 flex h-svh items-center")}>
          <div
            ref={karte}
            data-aktiv={aktiv ? "" : undefined}
            className="offer-card glass w-full rounded-3xl p-5 sm:p-10"
          >
            {/* Kopf: drei Namen übereinander, es steht immer nur einer da. */}
            <div className="grid">
              {PACKAGES.map((paket) => (
                <div key={paket.id} className="offer-head col-start-1 row-start-1">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="display text-xl sm:text-4xl">{paket.label}</h3>
                    <p className="text-lg font-black tracking-tight tabular-nums sm:text-2xl">
                      {formatMoney(paket.baseCents)}
                      <span className="ml-1.5 text-xs font-medium text-[var(--stage-dim)]">
                        bis {BASE_SQM} m²
                      </span>
                    </p>
                    {paket.beliebt ? (
                      <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[0.6rem] font-bold tracking-widest text-black uppercase">
                        Beliebt
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[0.8rem] leading-snug text-[var(--stage-dim)] sm:mt-2 sm:text-base">
                    {paket.tagline}
                  </p>
                  {/* Der Vorbehalt steht beim Preis, nicht im Kleingedruckten:
                      "Complete" darf nicht nach unbegrenzten Fenstern klingen. */}
                  {paket.limit ? (
                    <p className="mt-2 max-w-2xl text-[0.68rem] leading-snug text-[var(--stage-dim)] sm:text-xs">
                      {paket.limit}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mt-5 text-[0.62rem] font-semibold tracking-[0.25em] text-[var(--stage-dim)] uppercase sm:mt-7 sm:text-xs">
              In jedem Paket
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.75rem] leading-snug sm:mt-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-2.5 sm:text-sm">
              {INCLUDED_TASKS.map((task) => (
                <li key={task} className="grid grid-cols-[1rem_1fr] gap-2.5">
                  <span className="text-[var(--accent)]" aria-hidden>
                    ✓
                  </span>
                  <span className="min-w-0">{task}</span>
                </li>
              ))}
            </ul>

            {/*
              Was die höheren Pakete dazulegen. Immer im Baum, damit
              Vorwärts- und Rückwärtsscrollen exakt dasselbe tun; sichtbar
              wird es über die Zeilenhöhe, nicht über ein Ein- und Aushängen.
            */}
            {/* Zwei Spalten auch auf dem Handy: zwölf Zusatzzeilen untereinander
                machen die ausgewachsene Karte höher als den Bildschirm. */}
            <ul className="mt-1 grid grid-cols-2 gap-x-3 sm:gap-x-6">
              {PACKAGES.flatMap((paket, i) =>
                paket.adds.map((add, j) => (
                  <li
                    key={`${paket.id}-${add}`}
                    data-paket={i}
                    ref={(el) => {
                      // Feste Plätze statt push(): sonst wächst die Liste bei
                      // jedem Rerender weiter und der Effect arbeitet auf Leichen.
                      const pos =
                        PACKAGES.slice(0, i).reduce((n, p) => n + p.adds.length, 0) + j;
                      if (el) zeilen.current[pos] = el;
                    }}
                    className="offer-add"
                  >
                    <span className="offer-add__inner">
                      <span className="mt-1 grid grid-cols-[0.7rem_1fr] gap-1.5 text-[0.72rem] leading-snug sm:mt-2.5 sm:grid-cols-[1rem_1fr] sm:gap-2.5 sm:text-sm">
                        <span className="text-[var(--accent)]" aria-hidden>
                          +
                        </span>
                        {/* min-w-0: eine 1fr-Spalte schrumpft sonst nie unter
                            die Breite ihres längsten Wortes, und lange
                            Komposita liefen aus der Handyspalte heraus. */}
                        <span className="min-w-0">
                          {add}
                          <span className="offer-add__tag ml-2 rounded-full border border-[var(--stage-line)] px-2 py-0.5 text-[0.62rem] tracking-widest uppercase">
                            {paket.label.replace("Office ", "")}
                          </span>
                        </span>
                      </span>
                    </span>
                  </li>
                )),
              )}
            </ul>

            <div className="mt-5 flex flex-col gap-3 border-t border-[var(--stage-line)] pt-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
              <div className="grid">
                {PACKAGES.map((paket) => (
                  <p
                    key={paket.id}
                    className="offer-head col-start-1 row-start-1 text-sm text-[var(--stage-dim)]"
                  >
                    <span className="font-semibold text-[var(--stage-fg)] tabular-nums">
                      {formatMoney(paket.baseCents)}
                    </span>{" "}
                    pro Reinigung ·{" "}
                    <span className="font-semibold text-[var(--accent)] tabular-nums">
                      {formatMoney(packagePriceCents(BASE_SQM, paket.id, "abo12"))}
                    </span>{" "}
                    im 12-Monats-Abo
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
              <div className="mt-4 flex items-center gap-4 sm:mt-7" aria-hidden>
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
          Ist Ihr Büro grösser als {BASE_SQM} m², wird die zusätzliche Fläche
          transparent dazugerechnet — bei Essential{" "}
          <span className="text-[var(--stage-fg)]">
            {formatSqmRate(packageSqmRateCents("essential", "standard"))} pro m²
          </span>
          , bei den anderen Paketen entsprechend. Zusätzliche Reinigungszeit nur
          dann, wenn sie tatsächlich gebraucht wird.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Preis pro Reinigung nach Fläche und Paket, im Einzelbezug
            </caption>
            <thead>
              <tr className="text-xs tracking-[0.2em] text-[var(--stage-dim)] uppercase">
                <th scope="col" className="py-3 font-semibold">
                  Fläche
                </th>
                {PACKAGES.map((paket) => (
                  <th key={paket.id} scope="col" className="py-3 text-right font-semibold">
                    {paket.label.replace("Office ", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFFEL.map((sqm) => (
                <tr key={sqm} className="border-t border-[var(--stage-line)]">
                  <th scope="row" className="py-3.5 font-medium tabular-nums">
                    {sqm} m²
                  </th>
                  {PACKAGES.map((paket) => (
                    <td
                      key={paket.id}
                      className={cn(
                        "py-3.5 text-right tabular-nums",
                        paket.beliebt && "font-semibold text-[var(--accent)]",
                      )}
                    >
                      {formatMoney(packagePriceCents(sqm, paket.id, "standard"))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-[var(--stage-dim)]">
            Preise pro Reinigung im Einzelbezug. Im 12-Monats-Abo jeweils rund 17 %
            weniger — {formatMoney(essential.baseCents)} werden zu{" "}
            {formatMoney(packagePriceCents(BASE_SQM, "essential", "abo12"))}.
          </p>
        </div>
      </div>

      {/* Zusatzleistungen: die Preisliste für alles, was kein Paket abdeckt. */}
      <div className="mx-auto mt-20 max-w-5xl">
        <h3 className="display text-3xl sm:text-5xl">Zusatzleistungen</h3>
        <p className="mt-5 max-w-xl leading-relaxed text-[var(--stage-dim)]">
          Einzeln dazubuchbar, pro Reinigung. Was Ihr Paket schon enthält, wird
          im Rechner automatisch als enthalten ausgewiesen und nicht ein zweites
          Mal berechnet.
        </p>

        <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
          {EXTRA_LIST.map((extra) => (
            <li
              key={extra.id}
              className="flex items-baseline justify-between gap-4 border-t border-[var(--stage-line)] py-3.5"
            >
              <span className="min-w-0">
                <span className="block text-sm">{extra.label}</span>
                {/* Ein Kontingent ist etwas anderes als "ganz enthalten" —
                    Complete deckt die Innenfenster nur bis 10 m² Glas. */}
                {packagesCovering(extra.id).length > 0 ? (
                  <span className="mt-0.5 block text-xs text-[var(--stage-dim)]">
                    {packagesCovering(extra.id)
                      .map(({ paket, menge }) =>
                        extra.unit === "pauschal"
                          ? `in ${paket.label.replace("Office ", "")} enthalten`
                          : `in ${paket.label.replace("Office ", "")} bis ${menge} ${extra.unitLabel} enthalten`,
                      )
                      .join(", ")}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {extra.priceCents === null ? (
                  <span className="text-[var(--stage-dim)]">nach Fläche</span>
                ) : (
                  <>
                    + {formatMoney(extra.priceCents)}
                    {extra.unit === "pauschal" ? null : (
                      <span className="font-normal text-[var(--stage-dim)]">
                        {" "}
                        / {extra.unitLabel}
                      </span>
                    )}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-[var(--stage-dim)]">
          {CONDITIONS_NOTE}
        </p>
      </div>
    </section>
  );
}
