"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { business } from "@/config/business";
import { Magnetic } from "./magnetic";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Der Abspann.
 *
 * Die Seite endete bisher auf einem flachen dunklen Block — nach dem Film am
 * Anfang und der wachsenden Paketkarte fiel sie hier ab. Der Footer ist die
 * letzte Fläche, die jemand sieht, und die einzige, auf der die Telefonnummer
 * steht: er darf nicht der schwächste Teil sein.
 *
 * Tiefe entsteht hier durch echte Perspektive, nicht durch WebGL. Der Boden
 * ist ein CSS-3D-Raster, das per `rotateX` in die Ferne kippt. Ein dritter
 * WebGL-Kontext auf derselben Seite wäre teuer und brächte nichts, was diese
 * paar Zeilen nicht auch können — der Intro-Canvas wird zwar abgebaut, der
 * Raumbetrachter im Rechner läuft aber noch.
 *
 * Alles Bewegte hängt am Scroll oder am Zeiger. Nichts läuft von selbst:
 * eine Endlosschleife im Footer frisst Akku, solange die Seite offen ist.
 */
export function CinematicFooter() {
  const root = useRef<HTMLElement>(null);
  const boden = useRef<HTMLDivElement>(null);
  const wortmarke = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        /*
          Der Boden zieht beim Hereinscrollen auf den Betrachter zu. Nur
          `translate3d` auf einer eigenen Ebene — das Raster selbst ist ein
          sich wiederholender Verlauf, es wird also nichts neu gezeichnet.
        */
        gsap.fromTo(
          boden.current,
          { yPercent: -8, opacity: 0.25 },
          {
            yPercent: 6,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top bottom",
              end: "bottom bottom",
              scrub: 0.8,
            },
          },
        );

        // Die Wortmarke fährt hinter ihrer Kante hervor, wie die Überschriften
        // im Rest der Seite. Ein eigener Auftritt hier wäre eine zweite Sprache.
        gsap.from(".footer-line", {
          yPercent: 110,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: wortmarke.current, start: "top 88%", once: true },
        });

        /*
          Ein Lichtstreifen zieht DURCH die Buchstaben, sobald die Wortmarke
          steht — der Wisch aus dem Film, ein letztes Mal und sehr leise.
          Als Rechteck über der Schrift sah er aus wie ein vergessenes
          Overlay; über `background-clip: text` läuft er in der Schrift selbst.
        */
        gsap.fromTo(
          wortmarke.current,
          { "--sheen": "128%" },
          {
            "--sheen": "-28%",
            duration: 1.7,
            ease: "power2.inOut",
            delay: 0.45,
            scrollTrigger: { trigger: wortmarke.current, start: "top 88%", once: true },
          },
        );

        gsap.from(".footer-fade", {
          opacity: 0,
          y: 16,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
        });
      });

      /*
        Zeigerparallaxe nur mit echter Maus. Auf dem Handy gibt es keinen
        Schwebezustand — dort würde die Kippung erst beim Tippen auslösen und
        wie ein Fehler wirken.
      */
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const el = root.current;
        const flaeche = boden.current;
        if (!el || !flaeche) return;

        const kippX = gsap.quickTo(flaeche, "rotationY", { duration: 0.8, ease: "power3.out" });
        const kippY = gsap.quickTo(".footer-aura", "xPercent", { duration: 1.1, ease: "power3.out" });

        const bewegen = (e: PointerEvent) => {
          const box = el.getBoundingClientRect();
          const x = (e.clientX - box.left) / box.width - 0.5;
          kippX(x * 6);
          kippY(x * 14);
        };
        const zurueck = () => {
          kippX(0);
          kippY(0);
        };

        el.addEventListener("pointermove", bewegen);
        el.addEventListener("pointerleave", zurueck);
        return () => {
          el.removeEventListener("pointermove", bewegen);
          el.removeEventListener("pointerleave", zurueck);
        };
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const telefon = `tel:${business.contact.phone.replace(/\s/g, "")}`;

  return (
    <footer
      ref={root}
      className="stage footer-stage relative flex min-h-[92svh] flex-col justify-end overflow-hidden px-5 pt-24 pb-10"
    >
      {/*
        Ebene 1: der Boden, der in die Tiefe läuft.

        Drei Elemente, nicht eines: die Perspektive sitzt aussen, GSAP bewegt
        die mittlere Ebene, und die Kippung steckt ganz innen. Lägen Kippung
        und Bewegung auf demselben Element, würde GSAP beim Setzen der
        Transform die `rotateX` mitüberschreiben — der Boden war dadurch
        flach und unsichtbar.
      */}
      <div className="footer-floor pointer-events-none absolute inset-x-0 bottom-0 h-[48%]" aria-hidden>
        <div ref={boden} className="footer-plane">
          <div className="footer-grid" />
        </div>
      </div>

      {/* Ebene 2: Licht über dem Horizont */}
      <div className="footer-aura pointer-events-none absolute inset-x-0 top-[6%] h-[42%] opacity-60 aura" aria-hidden />

      <div className="relative mx-auto w-full max-w-6xl">
        {/* Ebene 3: die Wortmarke */}
        <div ref={wortmarke} className="footer-mark relative">
          {["Sauber.", "Pünktlich.", "Jede Woche."].map((line) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <span className="footer-line display block text-[clamp(2.2rem,8.5vw,6.5rem)] leading-[0.95]">
                {line}
              </span>
            </span>
          ))}
        </div>

        {/* Ebene 4: der Kontakt. Die Nummer ist das grösste Element hier. */}
        <div className="footer-fade mt-14 flex flex-wrap items-center gap-3">
          <Magnetic
            href={telefon}
            className="inline-block rounded-full bg-[var(--stage-fg)] px-7 py-3.5 text-sm font-semibold text-[var(--stage-bg)]"
          >
            {business.contact.phone}
          </Magnetic>
          <Magnetic
            href={`mailto:${business.contact.email}`}
            className="glass glass-hover inline-block rounded-full px-7 py-3.5 text-sm font-semibold"
          >
            {business.contact.email}
          </Magnetic>
          <a
            href="#rechner"
            className="rounded-full border border-[var(--stage-line)] px-7 py-3.5 text-sm font-semibold transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Preis berechnen
          </a>
        </div>

        <dl className="footer-fade mt-14 grid gap-8 border-t border-[var(--stage-line)] pt-10 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[0.68rem] font-semibold tracking-[0.22em] text-[var(--stage-dim)] uppercase">
              Adresse
            </dt>
            <dd className="mt-3 leading-relaxed text-[var(--stage-dim)]">
              <address className="not-italic">
                {business.owner}
                <br />
                {business.address.street}
                <br />
                {business.address.zip} {business.address.city}
              </address>
            </dd>
          </div>
          <div>
            <dt className="text-[0.68rem] font-semibold tracking-[0.22em] text-[var(--stage-dim)] uppercase">
              Erreichbar
            </dt>
            <dd className="mt-3 leading-relaxed text-[var(--stage-dim)]">
              {business.hours.weekdays}
              <br />
              {business.hours.saturday}
            </dd>
          </div>
          <div>
            <dt className="text-[0.68rem] font-semibold tracking-[0.22em] text-[var(--stage-dim)] uppercase">
              Gebiet
            </dt>
            <dd className="mt-3 leading-relaxed text-[var(--stage-dim)]">
              {business.serviceArea.label}
              <br />
              Anfahrt ab {business.address.city}
            </dd>
          </div>
        </dl>

        <div className="footer-fade mt-12 flex flex-col gap-3 text-xs text-[var(--stage-dim)] sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            {business.vatRegistered
              ? business.priceNote.registered
              : business.priceNote.notRegistered}{" "}
            · Impressum und Datenschutz folgen.
          </p>
          <p className="display shrink-0 text-base text-[var(--stage-fg)]">{business.name}</p>
        </div>
      </div>
    </footer>
  );
}
