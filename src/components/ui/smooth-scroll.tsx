"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Weiches Scrollen.
 *
 * Der Unterschied zum nativen Scrollen ist klein, aber er trägt den ganzen
 * Eindruck: die gepinnte Sektion fährt dadurch geführt statt ruckend.
 *
 * Wer im Betriebssystem reduzierte Bewegung eingestellt hat, bekommt natives
 * Scrollen — ein erzwungenes Trägheitsgefühl ist für manche Menschen genau das,
 * was Übelkeit auslöst.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduziert.matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Auf Touchgeräten das native Scrollen lassen: dort fühlt sich alles
      // andere falsch an und kostet nur Batterie.
      syncTouch: false,
    });

    // Lenis und ScrollTrigger müssen denselben Takt teilen, sonst laufen
    // gepinnte Sektionen der Scrollposition hinterher.
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
