"use client";

import { forwardRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";

/**
 * Die Sprühflasche.
 *
 * Vollständig prozedural, damit sofort etwas zu sehen ist. Der Aufbau ist
 * bewusst so geschnitten, dass ein fertiges .glb später an genau einer Stelle
 * eintritt: `<Bottle>` behält seine Props und seinen Ref, nur der Inhalt wird
 * gegen das geladene Modell getauscht (siehe MODELL-TAUSCH unten).
 *
 * Namen der Teile entsprechen dem, was ein Modellierer vergeben würde —
 * body, liquid, collar, head, trigger, nozzle, label —, damit sich die
 * Timeline beim Tausch nicht ändern muss.
 */

/**
 * Label als Canvas-Textur: echter Text auf der Flasche, ohne Font-Loader.
 *
 * Wird nach `document.fonts.ready` einmal neu gezeichnet — beim ersten Rendern
 * ist Plus Jakarta Sans oft noch nicht da, und die Schrift fiele stumm auf
 * system-ui zurück.
 */
function useLabelTexture() {
  const [fontsBereit, setFontsBereit] = useState(false);

  useEffect(() => {
    let abgebrochen = false;
    document.fonts?.ready.then(() => {
      if (!abgebrochen) setFontsBereit(true);
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  return useMemo(() => {
    if (typeof document === "undefined") return null;

    const w = 1024;
    const h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;

    // Etikettengrund: tiefes Markenblau mit weichem Verlauf
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#16385a");
    g.addColorStop(0.5, "#1d4a75");
    g.addColorStop(1, "#132f4d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Feiner heller Rahmen
    ctx.strokeStyle = "rgba(210,232,255,0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(232, 40, w - 464, h - 80);

    ctx.textAlign = "center";

    // Marke
    ctx.fillStyle = "#f4f9ff";
    /*
      Deutlich kleiner gesetzt als zuerst: von einem Zylinder sind nur rund
      120 Grad sichtbar. Text, der über die halbe Texturbreite läuft, wickelt
      sich um die Flasche und ist an beiden Enden angeschnitten.
    */
    ctx.font = "700 62px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("ProClean", w / 2, 196);
    ctx.font = "300 44px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillStyle = "#a9cdf0";
    ctx.fillText("SOLUTION", w / 2, 250);

    // Trennlinie
    ctx.strokeStyle = "rgba(169,205,240,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 105, 292);
    ctx.lineTo(w / 2 + 105, 292);
    ctx.stroke();

    // Produktzeile
    ctx.fillStyle = "#8fb4d8";
    ctx.font = "500 24px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.letterSpacing = "5px";
    ctx.fillText("GLASREINIGER", w / 2, 340);
    ctx.font = "400 18px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillStyle = "#6f93b5";
    ctx.fillText("500 ML", w / 2, 382);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
    // fontsBereit erzwingt genau ein Neuzeichnen, sobald die Schrift da ist.
  }, [fontsBereit]);
}

/** Flaschensilhouette als Profil für die Lathe-Geometrie. */
function bottleProfile(): THREE.Vector2[] {
  const p: THREE.Vector2[] = [];
  p.push(new THREE.Vector2(0.0, -1.05));
  p.push(new THREE.Vector2(0.42, -1.05)); // Bodenkante
  p.push(new THREE.Vector2(0.46, -0.98));
  p.push(new THREE.Vector2(0.46, 0.05)); // gerader Korpus
  p.push(new THREE.Vector2(0.45, 0.2));
  p.push(new THREE.Vector2(0.36, 0.42)); // Schulter
  p.push(new THREE.Vector2(0.22, 0.58));
  p.push(new THREE.Vector2(0.19, 0.68)); // Hals
  p.push(new THREE.Vector2(0.19, 0.78));
  return p;
}

export interface BottleProps {
  labelOpacity?: number;
  lowPower?: boolean;
}

export const Bottle = forwardRef<THREE.Group, BottleProps>(function Bottle(
  { lowPower = false },
  ref,
) {
  const label = useLabelTexture();

  const bodyGeo = useMemo(
    () => new THREE.LatheGeometry(bottleProfile(), lowPower ? 32 : 64),
    [lowPower],
  );
  const liquidGeo = useMemo(
    () => new THREE.CylinderGeometry(0.43, 0.4, 1.35, lowPower ? 24 : 48),
    [lowPower],
  );

  useEffect(() => {
    return () => {
      bodyGeo.dispose();
      liquidGeo.dispose();
      label?.dispose();
    };
  }, [bodyGeo, liquidGeo, label]);

  return (
    <group ref={ref} name="bottle">
      {/* MODELL-TAUSCH: Ab hier bis zum Ende der Gruppe ersetzt später das
          geladene .glb den Inhalt. Die Gruppe selbst, ihr Name und ihr Ref
          bleiben — die Timeline greift nur auf diese Gruppe zu. */}

      {/* Flüssigkeit zuerst: liegt innen und muss vor dem Glas gezeichnet werden */}
      <mesh geometry={liquidGeo} position={[0, -0.36, 0]} name="liquid">
        <meshStandardMaterial
          color="#2b6ea8"
          transparent
          opacity={0.72}
          roughness={0.15}
          metalness={0}
        />
      </mesh>

      {/* Flaschenkörper aus Glas */}
      <mesh geometry={bodyGeo} name="body">
        {lowPower ? (
          // Auf schwachen Geräten kostet Transmission zu viel: gleiche Anmutung
          // über ein einfaches transparentes Material mit starkem Glanz.
          <meshStandardMaterial
            color="#cfe4f5"
            transparent
            opacity={0.34}
            roughness={0.08}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshPhysicalMaterial
            color="#eaf4ff"
            transmission={0.92}
            thickness={0.5}
            ior={1.46}
            roughness={0.07}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.06}
            transparent
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/*
        Etikett, leicht vom Korpus abgesetzt damit es nicht z-fightet.
        Die Drehung um PI ist nötig: bei einer Zylindergeometrie liegt u=0
        auf der +Z-Achse, der mittig gezeichnete Text bei u=0.5 zeigt also
        ohne Drehung genau von der Kamera weg.
      */}
      <mesh position={[0, -0.28, 0]} rotation={[0, Math.PI, 0]} name="label">
        <cylinderGeometry args={[0.468, 0.468, 0.62, lowPower ? 32 : 64, 1, true]} />
        {/*
          Das Etikett leuchtet leicht selbst. Im dunklen Studio blieb ein rein
          beleuchtetes dunkelblaues Etikett ein schwarzes Rechteck — genau das
          Gegenteil von "Logo hervorheben". Produktaufnahmen machen das ebenso.
        */}
        <meshStandardMaterial
          map={label ?? undefined}
          emissiveMap={label ?? undefined}
          emissive="#ffffff"
          emissiveIntensity={0.55}
          roughness={0.5}
          metalness={0.05}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* Kragen */}
      <mesh position={[0, 0.83, 0]} name="collar">
        <cylinderGeometry args={[0.22, 0.21, 0.12, lowPower ? 20 : 40]} />
        <meshStandardMaterial color="#15181c" roughness={0.45} metalness={0.35} />
      </mesh>

      {/* Sprühkopf */}
      <group position={[0, 1.02, 0]} name="head">
        <mesh position={[0, 0.06, 0.02]}>
          <boxGeometry args={[0.3, 0.24, 0.5]} />
          <meshStandardMaterial color="#111418" roughness={0.38} metalness={0.4} />
        </mesh>
        {/* Düse, zeigt nach +Z — der Spray läuft in dieselbe Richtung */}
        <mesh position={[0, 0.06, 0.3]} rotation={[Math.PI / 2, 0, 0]} name="nozzle">
          <cylinderGeometry args={[0.05, 0.07, 0.16, 20]} />
          <meshStandardMaterial color="#0c0e11" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Abzug — wird in der Timeline bewegt */}
        <mesh position={[0, -0.1, 0.14]} rotation={[0.35, 0, 0]} name="trigger">
          <boxGeometry args={[0.14, 0.26, 0.07]} />
          <meshStandardMaterial color="#171b20" roughness={0.4} metalness={0.35} />
        </mesh>
        {/* Steigrohr, sichtbar durch das Glas */}
        <mesh position={[0, -0.75, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 1.6, 10]} />
          <meshStandardMaterial color="#20262c" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
});
