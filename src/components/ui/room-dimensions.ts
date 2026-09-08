/**
 * Raumgeometrie aus der Quadratmeterzahl.
 *
 * Bewusst in einer eigenen Datei ohne three.js-Import: die Rückfallebene und
 * die Beschriftung brauchen diese Rechnung, dürfen aber auf keinen Fall die
 * 600 KB der 3D-Bibliothek ins Hauptbündel ziehen.
 */

/** Büroflächen sind selten quadratisch; 1,4:1 sieht nach Raum aus, nicht nach Würfel. */
export const RATIO = 1.4;

/** Faustzahl Arbeitsplatzfläche inklusive Verkehrsfläche. */
export const SQM_PER_DESK = 12;

export interface RoomDimensions {
  /** Meter */
  width: number;
  /** Meter */
  depth: number;
  desks: number;
}

export function roomFor(squareMeters: number): RoomDimensions {
  const width = Math.sqrt(squareMeters * RATIO);
  const depth = squareMeters / width;
  return {
    width,
    depth,
    desks: Math.max(1, Math.round(squareMeters / SQM_PER_DESK)),
  };
}
