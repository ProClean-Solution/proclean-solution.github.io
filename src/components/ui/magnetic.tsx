"use client";

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";

/**
 * Magnetische Schaltfläche.
 *
 * Der Knopf folgt dem Zeiger leicht, bevor man ihn erreicht, und federt sanft
 * zurück. Der Zug ist bewusst klein (maximal ein Viertel der halben Breite) —
 * springende Knöpfe wirken billig, nicht hochwertig.
 *
 * Nur mit feinem Zeiger: auf einem Touchgerät gibt es kein Hover, und der
 * Effekt würde nur Rechenzeit kosten. Bei reduzierter Bewegung ebenfalls aus.
 */
export function Magnetic({
  as: Component = "a",
  children,
  strength = 0.28,
  className,
  ...props
}: {
  as?: ElementType;
  children: ReactNode;
  /** Anteil der Zeigerdistanz, dem der Knopf folgt. */
  strength?: number;
  className?: string;
} & Record<string, unknown>) {
  const el = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const zieheAn = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(node, {
          x: dx * strength,
          y: dy * strength,
          duration: 0.5,
          ease: "power3.out",
        });
      };

      const lasseLos = () => {
        gsap.to(node, {
          x: 0,
          y: 0,
          duration: 0.9,
          // Weich auslaufend statt federnd: ein Bounce wirkt verspielt.
          ease: "elastic.out(1, 0.55)",
        });
      };

      node.addEventListener("pointermove", zieheAn);
      node.addEventListener("pointerleave", lasseLos);
      return () => {
        node.removeEventListener("pointermove", zieheAn);
        node.removeEventListener("pointerleave", lasseLos);
      };
    }, node);

    return () => ctx.revert();
  }, [strength]);

  /*
    Über createElement statt JSX: bei einer polymorphen Komponente kann
    TypeScript die Props einer dynamischen ElementType-Union nicht auflösen
    und verengt sie auf `never` — auch `className` und `ref` fallen dann durch.
  */
  return createElement(
    Component,
    { ref: el, className, ...props } as Record<string, unknown>,
    children,
  );
}
