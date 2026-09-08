"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Der Sprühnebel.
 *
 * Ein einziges THREE.Points mit eigenem Shader — die gesamte Bewegung läuft
 * auf der GPU. Auf der CPU wird pro Frame nur eine Uniform gesetzt, nicht ein
 * Array mit tausenden Positionen umgeschrieben. Das ist der Unterschied
 * zwischen "läuft auf dem Handy" und "läuft nicht".
 *
 * Jedes Partikel bekommt beim Aufbau einmalig seine Zufallswerte als Attribut:
 * Richtung im Kegel, Startzeit, Lebensdauer, Grösse, Turbulenz. Der Shader
 * rechnet daraus für jeden Zeitpunkt die Position.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;        // Sprühfortschritt, 0..1
  uniform float uSize;        // Grundgrösse in Pixel
  uniform float uPixelRatio;

  attribute float aBirth;     // wann das Partikel startet, 0..1
  attribute float aLife;      // wie lange es lebt
  attribute float aScale;     // individuelle Grösse
  attribute vec3  aDir;       // Richtung im Sprühkegel
  attribute vec3  aTurb;      // Turbulenzphasen

  varying float vAlpha;
  varying float vDepth;

  void main() {
    // Lebensphase: 0 = gerade ausgetreten, 1 = aufgelöst
    float age = (uTime - aBirth) / aLife;

    if (age < 0.0 || age > 1.0) {
      // Ausserhalb der Lebenszeit hinter die Kamera schieben statt zu zeichnen
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }

    // Grundbewegung entlang der Kegelrichtung, mit Abbremsen
    float travel = 1.0 - exp(-age * 2.6);
    vec3 pos = aDir * travel * 2.4;

    // Turbulenz: nimmt mit dem Alter zu, damit der Nebel nach vorn ausfranst
    float t = age * 6.28318;
    pos += vec3(
      sin(t * 1.7 + aTurb.x) * 0.06,
      sin(t * 1.3 + aTurb.y) * 0.05 - age * age * 0.12,  // leichtes Absinken
      cos(t * 1.9 + aTurb.z) * 0.06
    ) * age;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Tröpfchen wachsen beim Auffächern
    float grow = 0.35 + age * 0.9;
    gl_PointSize = uSize * aScale * grow * uPixelRatio / max(0.4, -mvPosition.z);

    // Dicht an der Düse, weiche Auflösung nach vorn
    vAlpha = smoothstep(0.0, 0.06, age) * (1.0 - smoothstep(0.35, 1.0, age));
    vDepth = -mvPosition.z;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vDepth;

  void main() {
    if (vAlpha <= 0.001) discard;

    // Weiches rundes Tröpfchen statt hartem Quadrat
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float mask = 1.0 - smoothstep(0.12, 0.5, d);
    if (mask <= 0.001) discard;

    // Tiefenabfall: was weit vorn ist, verliert sich im Dunkeln
    float depthFade = 1.0 - smoothstep(2.0, 7.0, vDepth);

    gl_FragColor = vec4(uColor, mask * vAlpha * uOpacity * depthFade);
  }
`;

export interface SprayProps {
  /** Fortschritt des Sprühvorgangs, 0..1. Kommt aus der Scroll-Timeline. */
  progressRef: React.RefObject<{ value: number }>;
  /** Weniger Partikel auf schwächeren Geräten. */
  count?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function Spray({
  progressRef,
  count = 1800,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: SprayProps) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3); // bleibt 0, der Shader rechnet
    const birth = new Float32Array(count);
    const life = new Float32Array(count);
    const scale = new Float32Array(count);
    const dir = new Float32Array(count * 3);
    const turb = new Float32Array(count * 3);

    // Sprühkegel: eng an der Düse, nach vorn breiter.
    const spreadRad = THREE.MathUtils.degToRad(15);

    for (let i = 0; i < count; i++) {
      // Gleichverteilung im Kegel; sqrt vermeidet die Häufung in der Mitte
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.sqrt(Math.random()) * spreadRad;
      const sinPhi = Math.sin(phi);

      dir[i * 3] = Math.cos(theta) * sinPhi;
      dir[i * 3 + 1] = Math.sin(theta) * sinPhi;
      dir[i * 3 + 2] = Math.cos(phi);

      birth[i] = Math.random() * 0.72;
      life[i] = 0.28 + Math.random() * 0.4;
      // Wenige grosse, viele winzige Tröpfchen — das macht den feinen Nebel aus
      scale[i] = 0.25 + Math.pow(Math.random(), 2.4) * 1.5;

      turb[i * 3] = Math.random() * 6.283;
      turb[i * 3 + 1] = Math.random() * 6.283;
      turb[i * 3 + 2] = Math.random() * 6.283;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aBirth", new THREE.BufferAttribute(birth, 1));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    geo.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    geo.setAttribute("aTurb", new THREE.BufferAttribute(turb, 3));
    // Ohne Bounding Sphere wirft three beim Frustum Culling; wir zeichnen ohnehin immer.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 1.2), 4);
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 20 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color("#dbeaf7") },
      uOpacity: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const p = progressRef.current?.value ?? 0;
    if (!material.current) return;
    uniforms.uTime.value = p;
    // Der Strahl setzt kurz nach dem Abzug ein und verebbt zum Schluss.
    uniforms.uOpacity.value = p > 0 && p < 1 ? 0.9 : 0;
    /*
      Bewusst bei 1.5 gedeckelt: die Punktgrösse wird mit der Pixeldichte
      multipliziert, und auf einem Handy mit dreifacher Dichte wurden aus dem
      feinen Nebel deutlich sichtbare weisse Kugeln.
    */
    uniforms.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 1.5);
  });

  return (
    <points position={position} rotation={rotation} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={material}
        args={[
          {
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </points>
  );
}
