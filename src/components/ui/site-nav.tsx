"use client";

import { useEffect, useRef, useState } from "react";
import { business } from "@/config/business";

/**
 * Die Navigation.
 *
 * Die Seite ist rund achttausend Pixel lang — ohne Sprungmarken kommt man
 * vom Abspann nicht zurück zum Rechner. Sie ist trotzdem nicht von Anfang an
 * da: über dem Film und über dem ersten Bild hat sie nichts zu suchen, das
 * ist die Fläche, die den Eindruck macht. Sie taucht erst auf, wenn der
 * Anfang durch ist.
 *
 * Danach verhält sie sich nach der einzigen Regel, die beim Lesen nicht
 * stört: beim Scrollen nach unten weg, beim Scrollen nach oben da. Wer nach
 * oben scrollt, sucht etwas.
 *
 * Sie ist im versteckten Zustand auch aus der Tabreihenfolge genommen —
 * eine unsichtbare, aber fokussierbare Leiste ist eine Falle für alle, die
 * mit der Tastatur navigieren.
 *
 * Und sie hält sich aus gepinnten Sequenzen heraus: ein Abschnitt mit
 * `data-nav-frei` gehört sich selbst. Auf dem Handy deckte die Leiste sonst
 * den Namen der ausgewachsenen Paketkarte zu, die dort fast bildschirmhoch
 * ist — und während einer scrollgesteuerten Sequenz ist eine einfahrende
 * Leiste ohnehin nur Störung.
 */

const ZIELE = [
  { href: "#angebot", label: "Angebot" },
  { href: "#rechner", label: "Rechner" },
  { href: "#fragen", label: "Fragen" },
] as const;

export function SiteNav() {
  const [sichtbar, setSichtbar] = useState(false);
  const letzteY = useRef(0);
  const leiste = useRef<HTMLElement>(null);

  useEffect(() => {
    /**
     * Ab wo die Leiste überhaupt erscheinen darf: unterhalb des ersten
     * Abschnitts. Mit Film ist das die ganze Filmstrecke, ohne Film die Höhe
     * des Heros — beides liest dieselbe Messung, weil die Hülle immer im
     * Baum steht.
     */
    const schwelle = () => {
      const track = document.querySelector<HTMLElement>("[data-intro-track]");
      if (!track) return window.innerHeight * 0.9;
      return track.offsetTop + track.offsetHeight - window.innerHeight * 0.2;
    };

    let grenze = schwelle();
    let angefordert = false;

    /** Steht der obere Bildrand gerade in einer gepinnten Sequenz? */
    const inFreierZone = () => {
      for (const zone of document.querySelectorAll<HTMLElement>("[data-nav-frei]")) {
        const box = zone.getBoundingClientRect();
        if (box.top <= 0 && box.bottom > 0) return true;
      }
      return false;
    };

    const pruefen = () => {
      angefordert = false;
      const y = window.scrollY;
      const runter = y > letzteY.current + 4;
      const rauf = y < letzteY.current - 4;
      letzteY.current = y;

      if (y < grenze || inFreierZone()) {
        setSichtbar(false);
        return;
      }
      if (runter) setSichtbar(false);
      else if (rauf) setSichtbar(true);
    };

    const beiScroll = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(pruefen);
    };

    // Die Filmstrecke wird erst nach dem Mount hoch — ohne Neumessung stünde
    // die Grenze bei der Höhe eines noch leeren Abschnitts.
    const neuMessen = () => {
      grenze = schwelle();
      pruefen();
    };
    const t = window.setTimeout(neuMessen, 400);

    window.addEventListener("scroll", beiScroll, { passive: true });
    window.addEventListener("resize", neuMessen);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", beiScroll);
      window.removeEventListener("resize", neuMessen);
    };
  }, []);

  return (
    <nav
      ref={leiste}
      data-sichtbar={sichtbar ? "" : undefined}
      className="site-nav fixed inset-x-0 top-0 z-50 px-4 pt-4"
      aria-label="Bereiche dieser Seite"
    >
      <div className="stage glass mx-auto flex max-w-5xl items-center gap-3 rounded-full px-4 py-2.5 sm:gap-6 sm:px-5">
        <a href="#inhalt" className="display shrink-0 text-sm tracking-tight sm:text-base">
          ProClean
        </a>

        <ul className="hidden flex-1 items-center gap-1 sm:flex">
          {ZIELE.map((ziel) => (
            <li key={ziel.href}>
              <a
                href={ziel.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-[var(--stage-dim)] transition-colors hover:bg-white/5 hover:text-[var(--stage-fg)]"
              >
                {ziel.label}
              </a>
            </li>
          ))}
        </ul>

        {/*
          Auf dem Handy ersetzt dieser Knopf das Menü: ein aufklappbares
          Menü für drei Sprungmarken wäre ein Klick mehr für weniger. Ab der
          Breite, ab der das Menü steht, verschwindet er — sonst führten
          "Rechner" und "Preis" nebeneinander an dieselbe Stelle.
        */}
        <a
          href="#rechner"
          className="ml-auto rounded-full border border-[var(--stage-line)] px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] sm:hidden"
        >
          Preis
        </a>
        <a
          href={`tel:${business.contact.phone.replace(/\s/g, "")}`}
          className="rounded-full bg-[var(--stage-fg)] px-4 py-1.5 text-xs font-semibold whitespace-nowrap text-[var(--stage-bg)] sm:ml-auto sm:text-sm"
        >
          Anrufen
        </a>
      </div>
    </nav>
  );
}
