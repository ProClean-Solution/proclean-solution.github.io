"use client";

import {
  createElement,
  useLayoutEffect,
  useRef,
  type ElementType,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Mask-Reveal für Überschriften.
 *
 * Die Zeile fährt hinter einer Kante hervor, statt einzublenden — das ist der
 * Unterschied zwischen "animiert" und "gesetzt". Jede Zeile bekommt dafür einen
 * eigenen Container mit `overflow: hidden`.
 *
 * Ruhezustand zuerst: ohne JavaScript und bei reduzierter Bewegung steht der
 * Text da, wo er hingehört. Die Animation setzt auf dem sichtbaren Endzustand
 * auf und parkt nichts auf Opazität null.
 */
export function RevealLines({
  lines,
  as: Tag = "h2",
  className,
  lineClassName,
}: {
  lines: string[];
  as?: ElementType;
  className?: string;
  lineClassName?: string;
}) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current!.querySelectorAll(".reveal-line"), {
          yPercent: 112,
          duration: 1,
          ease: "expo.out",
          stagger: 0.09,
          scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Siehe magnetic.tsx: dynamischer ElementType lässt sich in JSX nicht typisieren.
  return createElement(
    Tag,
    { ref: root, className } as Record<string, unknown>,
    lines.map((line) => (
      <span key={line} className="block overflow-hidden pb-[0.09em]">
        <span className={`reveal-line block ${lineClassName ?? ""}`}>{line}</span>
      </span>
    )),
  );
}

/**
 * Sanftes Auftauchen für Textblöcke und Karten.
 * Kein Zoom, kein Bounce — nur ein kurzer Weg von unten.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current, {
          opacity: 0,
          y,
          duration: 0.9,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 88%", once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [delay, y]);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
