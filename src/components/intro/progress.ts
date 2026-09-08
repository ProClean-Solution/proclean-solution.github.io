/**
 * Fortschritt der Intro-Sequenz, 0 bis 1.
 *
 * Bewusst als Ref-Objekt statt als React-State: der Wert ändert sich in jedem
 * Frame des Scrollens. Über useState würde das sechzigmal pro Sekunde einen
 * Rerender des ganzen Baums auslösen. So liest ihn die Szene direkt im
 * Renderloop, und React sieht davon nichts.
 */
export interface IntroProgress {
  /** 0 = dunkel, 1 = Glas sauber, Website frei. */
  value: number;
}

export function createIntroProgress(): IntroProgress {
  return { value: 0 };
}

/**
 * Die Abschnitte des Films. Ein Abschnitt liefert seinen eigenen Fortschritt
 * von 0 bis 1, damit die Szene nicht überall mit Magiezahlen rechnet.
 */
export const BEATS = {
  /** Fast dunkel, nur Lichtkanten. */
  reveal: [0.0, 0.15],
  /** Flasche wird sichtbar, Kamera fährt näher. */
  emerge: [0.15, 0.3],
  /** Drehung. */
  turn: [0.3, 0.45],
  /** Logo zur Kamera. */
  logo: [0.45, 0.6],
  /** Kippen, Düse zielt auf das Glas. */
  aim: [0.6, 0.7],
  /** Abzug, Sprühbeginn. */
  trigger: [0.7, 0.8],
  /** Nebel im Raum. */
  mist: [0.8, 0.9],
  /** Glas wird sauber, Website erscheint. */
  clear: [0.88, 1.0],
} as const;

/** Fortschritt innerhalb eines Abschnitts, sauber auf 0..1 begrenzt. */
export function beat(progress: number, range: readonly [number, number]): number {
  const [start, end] = range;
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

/** Weiche Ein- und Ausblendung, ohne Ruckler an den Rändern. */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
