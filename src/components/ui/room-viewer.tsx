"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { roomFor } from "./room-dimensions";
import { cn } from "@/lib/utils";

/**
 * Three.js kostet rund 600 KB. Das darf niemals im ersten Laden stecken —
 * die Seite lebt davon, dass sie auf dem Handy sofort da ist. Deshalb:
 * kein SSR, und geladen wird erst, wenn der Raum in Sichtweite kommt.
 */
const RoomScene = dynamic(() => import("./room-scene").then((m) => m.RoomScene), {
  ssr: false,
  loading: () => null,
});

interface Props {
  squareMeters: number;
  clean?: boolean;
  className?: string;
}

export function RoomViewer({ squareMeters, clean = true, className }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [sichtbar, setSichtbar] = useState(false);
  const [erlaubt, setErlaubt] = useState(false);

  useEffect(() => {
    // Wer reduzierte Bewegung eingestellt hat, bekommt die Grundriss-Skizze
    // statt einer drehenden Szene. Das ist kein Notbehelf, sondern für
    // manche Menschen der Unterschied zwischen benutzbar und übel.
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduziert.matches) return;
    setErlaubt(true);

    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([eintrag]) => eintrag.isIntersecting && setSichtbar(true),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { width, depth, desks } = roomFor(squareMeters);

  return (
    <div
      ref={box}
      className={cn("relative overflow-hidden rounded-2xl bg-[#141210]", className)}
    >
      {erlaubt && sichtbar ? (
        <RoomScene squareMeters={squareMeters} clean={clean} />
      ) : (
        <Grundriss width={width} depth={depth} />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="text-xs text-white/70">
          <span className="font-semibold text-white tabular-nums">
            {width.toFixed(1)} × {depth.toFixed(1)} m
          </span>{" "}
          · Platz für rund {desks} {desks === 1 ? "Arbeitsplatz" : "Arbeitsplätze"}
        </p>
        {erlaubt && sichtbar ? (
          <p className="text-[0.68rem] tracking-wide text-white/45 uppercase">Ziehen zum Drehen</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Rückfallebene: massstäbliche Grundriss-Skizze als SVG.
 * Zeigt dieselbe Information, kostet null Kilobyte und läuft überall —
 * auch bevor die 3D-Szene geladen ist, damit hier nie ein Loch klafft.
 */
function Grundriss({ width, depth }: { width: number; depth: number }) {
  const pad = 14;
  const skala = Math.min((300 - pad * 2) / width, (200 - pad * 2) / depth);
  const w = width * skala;
  const d = depth * skala;

  return (
    <svg viewBox="0 0 300 200" className="h-full w-full" role="img" aria-label="Grundriss">
      <rect width="300" height="200" fill="#141210" />
      <rect
        x={(300 - w) / 2}
        y={(200 - d) / 2}
        width={w}
        height={d}
        fill="#1f1c18"
        stroke="#d9a93a"
        strokeWidth="1.5"
      />
      <text
        x="150"
        y={(200 - d) / 2 - 6}
        textAnchor="middle"
        fill="#8a8178"
        fontSize="9"
        fontFamily="system-ui, sans-serif"
      >
        {width.toFixed(1)} m
      </text>
      <text
        x={(300 - w) / 2 - 8}
        y="100"
        textAnchor="middle"
        fill="#8a8178"
        fontSize="9"
        fontFamily="system-ui, sans-serif"
        transform={`rotate(-90 ${(300 - w) / 2 - 8} 100)`}
      >
        {depth.toFixed(1)} m
      </text>
    </svg>
  );
}
