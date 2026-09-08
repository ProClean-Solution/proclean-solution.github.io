"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { RATIO, roomFor } from "./room-dimensions";

/**
 * Der Raum in 3D.
 *
 * Prozedural erzeugt, ohne eine einzige Asset-Datei: Boden, Wände und
 * Arbeitsplätze entstehen aus der Quadratmeterzahl, die im Rechner steht.
 * Das ist der Punkt — die abstrakte Zahl "150 m²" bekommt eine Grösse, die
 * man sieht und drehen kann.
 *
 * Der Boden wechselt mit `clean` seine Rauheit: schmutzig ist matt und
 * schluckt das Licht, sauber spiegelt. Genau das ist der sichtbare
 * Unterschied, den die Arbeit macht.
 */

function Desk(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      {/* Tischplatte */}
      <mesh position={[0, 0.73, 0]}>
        <boxGeometry args={[1.5, 0.06, 0.75]} />
        <meshStandardMaterial color="#ddd6cb" roughness={0.45} />
      </mesh>
      {/*
        Schlanker Mittelfuss statt vier Beine: ein Block in Tischgrösse las
        sich aus der Schrägen als schwarzer Klotz und schluckte die Platte.
        Ein Mesh pro Tisch statt vier hält ausserdem die Draw Calls unten.
      */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.14, 0.72, 0.5]} />
        <meshStandardMaterial color="#6b635a" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Bildschirm */}
      <mesh position={[0, 1.0, -0.22]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.58, 0.34, 0.025]} />
        <meshStandardMaterial color="#1b1814" roughness={0.25} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Room({ squareMeters, clean }: { squareMeters: number; clean: boolean }) {
  const group = useRef<THREE.Group>(null);
  const drag = useRef({ active: false, lastX: 0, velocity: 0.0016 });

  const { width, depth, desks } = useMemo(() => roomFor(squareMeters), [squareMeters]);

  /** Tische im Raster verteilen, mit Abstand zu den Wänden. */
  const positions = useMemo(() => {
    const cols = Math.max(1, Math.round(Math.sqrt(desks * RATIO)));
    const rows = Math.max(1, Math.ceil(desks / cols));
    const stepX = (width - 2) / Math.max(1, cols);
    const stepZ = (depth - 2) / Math.max(1, rows);
    const out: Array<[number, number]> = [];
    for (let i = 0; i < desks; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      out.push([
        -width / 2 + 1 + stepX * (c + 0.5),
        -depth / 2 + 1 + stepZ * (r + 0.5),
      ]);
    }
    return out;
  }, [desks, width, depth]);

  useFrame((_, delta) => {
    if (!group.current || drag.current.active) return;
    // Langsame Eigendrehung, solange niemand zieht.
    group.current.rotation.y += drag.current.velocity * delta * 60;
  });

  const onPointerDown = (e: THREE.Event & { clientX?: number }) => {
    drag.current.active = true;
    drag.current.lastX = (e as unknown as PointerEvent).clientX ?? 0;
  };

  const onPointerMove = (e: THREE.Event & { clientX?: number }) => {
    if (!drag.current.active || !group.current) return;
    const x = (e as unknown as PointerEvent).clientX ?? 0;
    group.current.rotation.y += (x - drag.current.lastX) * 0.006;
    drag.current.lastX = x;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  const bodenFarbe = clean ? "#e9e5df" : "#3a352d";

  return (
    <group
      ref={group}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      {/* Boden — der eigentliche Unterschied zwischen vorher und nachher */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={bodenFarbe}
          roughness={clean ? 0.18 : 0.95}
          metalness={clean ? 0.12 : 0}
        />
      </mesh>

      {/* Zwei Wände, damit der Raum Tiefe bekommt, ohne die Sicht zu verstellen */}
      <mesh position={[0, 1.6, -depth / 2]}>
        <planeGeometry args={[width, 3.2]} />
        <meshStandardMaterial color="#221f1b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-width / 2, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, 3.2]} />
        <meshStandardMaterial color="#1d1a17" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {positions.map(([x, z], i) => (
        <Desk key={i} position={[x, 0, z]} rotation={[0, i % 2 ? Math.PI : 0, 0]} />
      ))}
    </group>
  );
}

/** Kamera folgt der Raumgrösse, damit grosse Flächen nicht aus dem Bild wachsen. */
function Rig({ squareMeters }: { squareMeters: number }) {
  const { width, depth } = roomFor(squareMeters);
  const abstand = Math.max(width, depth) * 0.92 + 4;
  return (
    <>
      <perspectiveCamera />
      <group position={[0, 0, 0]}>
        <ambientLight intensity={0.32} />
        <directionalLight position={[abstand * 0.7, abstand * 1.2, abstand * 0.5]} intensity={2.1} />
        {/* Warmes Streiflicht in der Akzentfarbe, tief und nah an der Wand */}
        <pointLight position={[-width * 0.4, 2.2, depth * 0.35]} intensity={38} color="#d9a93a" />
        {/* Kühles Gegenlicht, damit die Rückwand nicht ins Schwarz absäuft */}
        <pointLight position={[width * 0.5, 2.8, -depth * 0.3]} intensity={16} color="#9fb6d0" />
      </group>
    </>
  );
}

export function RoomScene({
  squareMeters,
  clean = true,
}: {
  squareMeters: number;
  clean?: boolean;
}) {
  const { width, depth } = roomFor(squareMeters);
  // Näher heran als die erste Fassung: dort schwamm der Raum in Schwarz.
  const abstand = Math.max(width, depth) * 0.92 + 4;

  return (
    <Canvas
      // Auf Retina-Displays kostet dpr 3 das Dreifache und sieht kaum besser aus.
      dpr={[1, 1.6]}
      camera={{ position: [abstand * 0.62, abstand * 0.48, abstand * 0.82], fov: 46 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      <Rig squareMeters={squareMeters} />
      <Room squareMeters={squareMeters} clean={clean} />
    </Canvas>
  );
}
