"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Bottle } from "./bottle";
import { Spray } from "./spray";
import { BEATS, beat, lerp, smoothstep, type IntroProgress } from "./progress";

/**
 * Die Filmszene.
 *
 * Alle Bewegung wird pro Frame aus dem Scroll-Fortschritt berechnet, nicht
 * abgespielt: Rückwärtsscrollen fährt die Sequenz exakt zurück. Deshalb setzt
 * jeder useFrame absolute Werte statt zu inkrementieren.
 *
 * Der Fortschritt kommt als Ref herein, damit kein einziger Rerender pro Frame
 * entsteht.
 */

interface SceneProps {
  progressRef: React.RefObject<IntroProgress>;
  lowPower: boolean;
}

function Studio({ progressRef, lowPower }: SceneProps) {
  const rig = useRef<THREE.Group>(null);
  const bottle = useRef<THREE.Group>(null);
  const spray = useRef<{ value: number }>({ value: 0 });
  const keyLight = useRef<THREE.SpotLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);
  const fillLight = useRef<THREE.PointLight>(null);
  const { camera, size } = useThree();

  useFrame(() => {
    const p = progressRef.current?.value ?? 0;

    // --- Licht: von einzelnen Kanten zur voll ausgeleuchteten Flasche ---
    const enthuellung = smoothstep(beat(p, BEATS.reveal));
    const auftauchen = smoothstep(beat(p, BEATS.emerge));

    if (rimLight.current) {
      // Kaltes Streiflicht zeichnet zuerst nur die Silhouette
      rimLight.current.intensity = lerp(2, 26, enthuellung) + auftauchen * 14;
    }
    if (keyLight.current) {
      keyLight.current.intensity = lerp(0, 42, auftauchen);
    }
    if (fillLight.current) {
      fillLight.current.intensity = lerp(0, 9, auftauchen);
    }

    // --- Flasche: Drehung, Logo zur Kamera, Kippen ---
    if (rig.current) {
      const drehung = smoothstep(beat(p, BEATS.turn));
      const logo = smoothstep(beat(p, BEATS.logo));
      const zielen = smoothstep(beat(p, BEATS.aim));

      /*
        Startet halb abgewandt und endet in der Dreiviertelansicht, nicht
        frontal. Frontal zeigte die Düse direkt in die Kamera — man schaute
        ins Rohr, und der Abzug verschwand hinter dem Gehäuse. Erst schräg
        liest man die Sprühmechanik, und das Etikett bleibt lesbar.
      */
      rig.current.rotation.y = lerp(-1.25, -0.8, drehung) + lerp(0, 0.35, logo);

      // Kippen: Düse senkt sich zur imaginären Glasfläche
      rig.current.rotation.x = lerp(0, 0.2, zielen);
      rig.current.rotation.z = lerp(0, -0.06, zielen);

      // Schwebt beim Auftauchen leicht nach oben in die Bildmitte
      const basisY = lerp(-0.35, 0, auftauchen);

      /*
        Am Schluss aus dem Bild. Beginnt bewusst vor der Glasreinigung und
        führt weiter hinaus als zuerst: die Kamera ist zu diesem Zeitpunkt
        herangefahren, dadurch stand die Flasche riesig über der Überschrift
        der Website, die gerade sichtbar wurde.
      */
      const abgang = smoothstep(beat(p, [0.83, 0.97] as const));
      rig.current.position.x = lerp(0, -5.4, abgang);
      rig.current.position.z = lerp(0, 2.4, abgang);
      // Absolut aus basisY, nicht aus dem aktuellen Wert: ein Lerp auf sich
      // selbst wäre inkrementell und liesse sich nicht sauber zurückscrollen.
      rig.current.position.y = lerp(basisY, -1.1, abgang);
      const schrumpf = lerp(1, 0.72, abgang);
      rig.current.scale.setScalar(schrumpf);

      // Abzug drücken
      const abzug = smoothstep(beat(p, BEATS.trigger));
      const trigger = rig.current.getObjectByName("trigger");
      if (trigger) trigger.rotation.x = lerp(0.34, 0.06, abzug);
    }

    // --- Spray: läuft über Abzug, Nebel und Reinigung ---
    const sprayStart = BEATS.trigger[0];
    const sprayEnde = BEATS.clear[1];
    spray.current.value = Math.min(1, Math.max(0, (p - sprayStart) / (sprayEnde - sprayStart)));

    // --- Kamera: langsamer Push-in, minimale Orbitbewegung ---
    const nah = smoothstep(beat(p, [0.05, 0.62] as const));
    /*
      Im Hochformat weiter weg. Sonst füllt die Flasche das ganze Bild und der
      Sprühkegel läuft oben aus dem Sichtfeld — auf dem Handy sah man vom Spray
      nur noch den Rand.
    */
    const hochformat = size.height / Math.max(1, size.width);
    const formatFaktor = hochformat > 1 ? 1 + (hochformat - 1) * 0.5 : 1;
    const abstand = lerp(6.4, 4.7, nah) * formatFaktor;
    const winkel = lerp(-0.16, 0.1, nah);
    camera.position.set(Math.sin(winkel) * abstand, lerp(0.6, 0.35, nah), Math.cos(winkel) * abstand);
    /*
      Blickpunkt bewusst über der Flaschenmitte: vorher wanderte der Sprühkopf
      beim Heranfahren aus dem oberen Bildrand — ausgerechnet das Teil, das die
      Flasche als Sprühflasche erkennbar macht.
    */
    camera.lookAt(0, lerp(0.2, 0.3, nah), 0);
  });

  return (
    <>
      {/* Dunkle Studioatmosphäre: fast schwarz, wenige kontrollierte Quellen */}
      <ambientLight intensity={0.08} color="#7f9dc0" />

      {/* Kaltes Rim Light von hinten links — zeichnet die Kante */}
      <pointLight ref={rimLight} position={[-3.2, 1.6, -2.4]} intensity={2} color="#5b9fe0" distance={14} />

      {/* Key Light von oben rechts, weich */}
      <spotLight
        ref={keyLight}
        position={[3.4, 5.2, 3.2]}
        angle={0.5}
        penumbra={0.9}
        intensity={0}
        color="#eaf3ff"
        distance={20}
      />

      {/* Aufhellung von vorn unten, damit das Etikett lesbar wird */}
      <pointLight ref={fillLight} position={[1.1, -1.4, 3.4]} intensity={0} color="#bcd6f0" distance={12} />

      {/* Kleines hartes Licht nur für den Sprühkopf: dunkler Kunststoff
          braucht eine scharfe Reflexion, sonst liest man seine Form nicht. */}
      <pointLight position={[1.5, 2.6, 2.2]} intensity={9} color="#ffffff" distance={7} />

      {/*
        Flasche und Sprühkegel sitzen in derselben Gruppe: der Strahl muss der
        Ausrichtung der Düse folgen, sonst steht er beim Kippen frei im Raum.
        Alle Bewegungen der Timeline greifen an dieser Gruppe an.
      */}
      <group ref={rig}>
        <Bottle ref={bottle} lowPower={lowPower} />
        {/* An der Düsenspitze. Leicht nach unten geneigt — eine positive
            Drehung um X würde +Z nach OBEN kippen, nicht nach vorn-unten. */}
        <group position={[0, 1.08, 0.6]} rotation={[-0.14, 0, 0]}>
          <Spray progressRef={spray} count={lowPower ? 700 : 2400} />
        </group>
      </group>
    </>
  );
}

export function IntroScene({ progressRef, lowPower }: SceneProps) {
  return (
    <Canvas
      // Adaptive Auflösung: auf schwachen Geräten bewusst grob.
      dpr={lowPower ? [1, 1.2] : [1, 1.75]}
      camera={{ position: [0, 0.5, 6.2], fov: 38, near: 0.1, far: 40 }}
      gl={{
        antialias: !lowPower,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "transparent" }}
    >
      <Studio progressRef={progressRef} lowPower={lowPower} />
    </Canvas>
  );
}
