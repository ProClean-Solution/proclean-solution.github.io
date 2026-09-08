"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BEATS, beat, createIntroProgress, smoothstep } from "./progress";
import { GlassPane } from "./glass";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Three.js darf nicht ins erste Bündel. Kein SSR, geladen nach dem Mount. */
const IntroScene = dynamic(() => import("./scene").then((m) => m.IntroScene), {
  ssr: false,
  loading: () => null,
});

/** Wie viele Bildschirmhöhen der Film dauert. */
const SCROLL_LENGTH_VH = 420;

/**
 * Die Klammer um den Filmanfang.
 *
 * Wichtig für den Aufbau: `children` ist der BESTEHENDE Hero, unverändert und
 * an derselben Stelle im Dokument. Er liegt hinter dem Glas, nicht darunter —
 * deshalb wird die Website am Ende nicht eingeblendet, sondern durch das
 * gereinigte Glas sichtbar. Ein zweiter Hero, eine zweite H1 oder eine Kopie
 * der Inhalte existiert nicht.
 *
 * Die Sequenz hängt vollständig am Scroll: rückwärts scrollen fährt den Film
 * kontrolliert zurück, weil jeder Frame absolute Werte aus dem Fortschritt
 * berechnet statt zu inkrementieren.
 */
export function IntroShell({ children }: { children: React.ReactNode }) {
  const section = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  const linie1 = useRef<HTMLParagraphElement>(null);
  const linie2 = useRef<HTMLParagraphElement>(null);
  const hint = useRef<HTMLDivElement>(null);

  const progress = useRef(createIntroProgress());
  const [aktiv, setAktiv] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  /** Nach dem Film wird der Canvas abgebaut und gibt seinen Speicher frei. */
  const [fertig, setFertig] = useState(false);
  /**
   * Die 3D-Szene wird erst nach dem ersten Bild geladen.
   *
   * Die dunkle Bühne und das Glas stehen sofort — es gibt also kein Aufblitzen
   * der Website. Die Flasche kommt Sekundenbruchteile später, und das passt
   * zum ersten Abschnitt des Films, in dem ohnehin fast nichts zu sehen ist.
   * So konkurriert der 600-KB-Brocken nicht mit dem ersten Rendern.
   */
  const [szeneBereit, setSzeneBereit] = useState(false);

  useEffect(() => {
    // Reduzierte Bewegung heisst: kein Film. Die Website startet direkt.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Schwächere Geräte bekommen dieselbe Sequenz, nur sparsamer gerechnet:
    // weniger Partikel, gröbere Auflösung, kein Transmission-Glas.
    const grob =
      window.matchMedia("(pointer: coarse)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      window.innerWidth < 700;
    setLowPower(grob);
    setAktiv(true);

    // Nach dem ersten Bild, und wenn der Hauptthread Luft hat.
    const idle =
      window.requestIdleCallback?.(() => setSzeneBereit(true), { timeout: 900 }) ??
      window.setTimeout(() => setSzeneBereit(true), 350);
    return () => {
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      else clearTimeout(idle as number);
    };
  }, []);

  useLayoutEffect(() => {
    if (!aktiv) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          progress.current.value = p;

          // --- Glas: Reinigung und Tröpfchen ---
          if (glass.current) {
            glass.current.style.setProperty("--clean", String(smoothstep(beat(p, BEATS.clear))));
            // Tröpfchen erscheinen mit dem Nebel und werden mitgewischt.
            const treffer = smoothstep(beat(p, [0.76, 0.88] as const));
            const weg = 1 - smoothstep(beat(p, BEATS.clear));
            glass.current.style.setProperty("--droplets", String(treffer * weg));
          }

          // --- Bühne: der dunkle Studioraum weicht der Website ---
          if (stage.current) {
            stage.current.style.setProperty(
              "--stage-opacity",
              String(1 - smoothstep(beat(p, [0.86, 0.99] as const))),
            );
          }

          // --- Text: zwei Aussagen, jeweils auf und wieder ab ---
          setzeLinie(linie1.current, p, 0.16, 0.34);
          setzeLinie(linie2.current, p, 0.46, 0.64);

          if (hint.current) {
            hint.current.style.opacity = String(1 - smoothstep(beat(p, [0, 0.08] as const)));
          }

          // Am Ende die 3D-Ressourcen freigeben, statt sie im Leerlauf
          // weiterlaufen zu lassen.
          if (p > 0.995) setFertig(true);
          else if (p < 0.98) setFertig(false);
        },
      });
    }, section);

    /*
      Alle anderen ScrollTrigger neu vermessen.
      Sie werden beim Mount angelegt — da ist diese Sektion noch 0 Pixel hoch,
      weil `aktiv` erst im Effect danach gesetzt wird. Danach wächst das
      Dokument schlagartig um mehrere Bildschirmhöhen. Ohne Refresh rechnet
      etwa der gepinnte Wisch weiter mit den alten Werten und schiebt sich
      mitten im Film über das Intro.

      Zwei Frames Abstand, damit Layout und Sticky-Position stehen.
    */
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => ScrollTrigger.refresh()),
    );

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [aktiv]);

  /*
    Die beiden Hüllen stehen IMMER im Baum, auch ohne Film — es ändern sich nur
    ihre Klassen. Ein Wechsel der Baumstruktur nach dem Mount hiesse, dass React
    den Hero umhängen muss, während GSAP im selben DOM schon Knoten für seine
    Pins verschoben hat. Das Ergebnis war ein "insertBefore"-Fehler, der die
    komplette Seite abstürzen liess.
  */
  return (
    <div ref={section} style={aktiv ? { height: `${SCROLL_LENGTH_VH}vh` } : undefined}>
      {/* Eigener dunkler Grund: der Hero ist 92svh hoch, der Container 100svh.
          Ohne ihn blitzte unten ein heller Streifen der Seitenfarbe durch. */}
      <div
        className={aktiv ? "sticky top-0 h-svh overflow-hidden bg-[#0a0908]" : undefined}
      >
        {/*
          Ebene 1: die bestehende Website. Unverändert, an ihrer Stelle,
          und ab hier das, was hinter dem Glas liegt.
        */}
        {children}

        {aktiv ? (
          <>
        {/* Ebene 2: der dunkle Studioraum */}
        <div ref={stage} className="intro-stage pointer-events-none" aria-hidden />

        {/* Ebene 3: die Glasscheibe */}
        <GlassPane ref={glass} />

        {/* Ebene 4: die 3D-Szene */}
        {szeneBereit && !fertig ? (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <IntroScene progressRef={progress} lowPower={lowPower} />
          </div>
        ) : null}

        {/* Ebene 5: die zwei Aussagen */}
        {/*
          Die Aussagen sitzen im unteren Drittel, nicht in der Bildmitte:
          über der Flasche verdeckten sie genau das Produkt, das der Film
          zeigen soll.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[14%] flex justify-center px-6"
          aria-hidden
        >
          <p
            ref={linie1}
            className="intro-line absolute bottom-0 text-center text-[clamp(1.7rem,5vw,3.6rem)] opacity-0"
          >
            Sauberkeit.
            <br />
            Neu gedacht.
          </p>
          <p
            ref={linie2}
            className="intro-line absolute bottom-0 text-center text-[clamp(1.4rem,3.6vw,2.6rem)] opacity-0"
          >
            Präzision in jedem Detail.
          </p>
        </div>

        {/* Ebene 6: Scrollhinweis */}
        <div
          ref={hint}
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2"
          aria-hidden
        >
          <span className="text-[0.68rem] font-semibold tracking-[0.3em] text-white/60 uppercase">
            Scrollen
          </span>
          <span className="intro-hint block h-8 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Blendet eine Aussage zwischen `von` und `bis` auf und wieder ab.
 * Direkt am DOM statt über React-State — das läuft pro Scroll-Frame.
 */
function setzeLinie(el: HTMLElement | null, p: number, von: number, bis: number) {
  if (!el) return;
  const mitte = (von + bis) / 2;
  const auf = smoothstep(beat(p, [von, mitte] as const));
  const ab = smoothstep(beat(p, [mitte, bis] as const));
  const sichtbar = auf * (1 - ab);
  el.style.opacity = String(sichtbar);
  // Sehr leichte Bewegung, kein Zoom-Effekt.
  el.style.transform = `translateY(${(1 - auf) * 22 - ab * 22}px)`;
}
