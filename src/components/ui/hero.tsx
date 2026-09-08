"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { business } from "@/config/business";
import { TARIFFS } from "@/lib/pricing/catalog";
import { formatMoney } from "@/lib/pricing/engine";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Die Eröffnung.
 *
 * Der Einstieg ist im Ruhezustand vollständig lesbar — die Animation setzt auf
 * dem sichtbaren Endzustand auf, statt Text auf Opazität null zu parken. Wer
 * mit abgeschalteter Bewegung oder ohne JavaScript kommt, sieht dieselbe Seite.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Auftritt: gestaffelt, kurz, einmalig.
        gsap.from(".hero-line", {
          yPercent: 108,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
        });
        gsap.from(".hero-sub, .hero-actions, .hero-facts", {
          opacity: 0,
          y: 18,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.35,
        });

        // Parallax nur auf der Lichtfläche — niemals auf Fliesstext.
        gsap.to(".hero-aura", {
          yPercent: 18,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={root}
      className="stage relative flex min-h-[92svh] flex-col justify-center overflow-hidden px-5 pt-24 pb-16"
    >
      <div
        className="hero-aura absolute top-[-10%] left-1/2 h-[70vh] w-[110vw] -translate-x-1/2 aura"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[var(--stage-dim)] uppercase">
          {business.name} · Kloten
        </p>

        {/*
          Jede Zeile in einem eigenen Overflow-Container: so kann die Zeile von
          unten hereinfahren, ohne dass Unterlängen abgeschnitten wirken.
        */}
        <h1 className="display mt-7 text-[clamp(1.9rem,8vw,7rem)]">
          {["Sauber ist keine", "Verhandlungssache."].map((line) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <span className="hero-line block">{line}</span>
            </span>
          ))}
        </h1>

        <p className="hero-sub mt-8 max-w-xl text-lg leading-relaxed text-[var(--stage-dim)] sm:text-xl">
          Büroreinigung in Zürich und Umgebung zum festen Stundenpreis. Sie sehen den
          Preis, bevor Sie mit uns sprechen.
        </p>

        <div className="hero-actions mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#rechner"
            className="rounded-full bg-[var(--stage-fg)] px-7 py-3.5 text-sm font-semibold text-[var(--stage-bg)] transition-transform duration-300 hover:scale-[1.03]"
          >
            Preis berechnen
          </a>
          <a
            href={`tel:${business.contact.phone.replace(/\s/g, "")}`}
            className="glass glass-hover rounded-full px-7 py-3.5 text-sm font-semibold"
          >
            {business.contact.phone}
          </a>
        </div>

        <dl className="hero-facts mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--stage-line)] sm:grid-cols-3">
          {[
            { k: "Ab", v: formatMoney(TARIFFS.abo12.hourlyCents), s: "pro Stunde im Abo" },
            { k: "100 m²", v: "1 Std.", s: "unabhängig von der Zimmerzahl" },
            { k: "Antwort", v: "24 Std.", s: "an Werktagen" },
          ].map((f) => (
            <div key={f.k} className="bg-[var(--stage-bg)] px-5 py-6">
              <dt className="text-[0.7rem] font-semibold tracking-[0.18em] text-[var(--stage-dim)] uppercase">
                {f.k}
              </dt>
              <dd className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{f.v}</dd>
              <dd className="mt-1 text-xs text-[var(--stage-dim)]">{f.s}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
