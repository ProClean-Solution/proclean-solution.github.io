"use client";

import { forwardRef } from "react";

/**
 * Die imaginäre Glasfläche vor der Kamera.
 *
 * Sie liegt zwischen dem Betrachter und der echten Website. Anfangs beschlagen,
 * verschmutzt und mit Schlieren; am Ende vollständig klar. Dadurch wird die
 * Seite nicht eingeblendet, sondern durch das gereinigte Glas sichtbar.
 *
 * Die Reinigung läuft über `--clean` (0..1), das die Timeline pro Frame setzt.
 * Mehrere Radialverläufe wachsen unterschiedlich schnell und werden mit
 * `mask-composite: intersect` verrechnet: wo EINE Stelle sauber ist, fällt die
 * ganze Schicht weg. Das ergibt den unregelmässigen Wisch statt eines Kreises.
 *
 * Grenze, ehrlich benannt: echte Refraktion des Hintergrunds kann CSS nicht.
 * `backdrop-filter` kann nur weichzeichnen und entsättigen. Die Verzerrung
 * liegt deshalb auf der Schmutzschicht selbst, nicht auf der Website dahinter.
 */
export const GlassPane = forwardRef<HTMLDivElement>(function GlassPane(_, ref) {
  return (
    <div ref={ref} className="intro-glass" aria-hidden>
      {/* Weichzeichner: greift die Website dahinter ab */}
      <div className="intro-glass__blur" />
      {/* Schmutz, Schlieren, Beschlag */}
      <div className="intro-glass__grime" />
      {/* Tröpfchen, die der Sprühnebel auf dem Glas hinterlässt */}
      <div className="intro-glass__droplets" />

      {/* Verzerrungsfilter für die Schlieren. Sehr kleine Basisfrequenz,
          sonst wird aus dem Schleier ein Rauschmuster. */}
      <svg className="sr-only" aria-hidden focusable="false">
        <filter id="intro-smear">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
  );
});
