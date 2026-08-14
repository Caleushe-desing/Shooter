import type { Dir } from "./types";
import { DIR_CLOCK, relativeToFacing } from "./types";

/** Yaw suave de la cámara 3D (radianes). Actualizado por CameraRig. */
let camYaw = 0;

export function setCamYaw(yaw: number): void {
  camYaw = yaw;
}

export function getCamYaw(): number {
  return camYaw;
}

function shortest(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Cuantiza yaw de cámara a la dirección cardinal hacia la que mira. */
export function yawToFacing(yaw: number): Dir {
  const targets: { d: Dir; y: number }[] = [
    { d: "down", y: 0 },
    { d: "right", y: Math.PI / 2 },
    { d: "up", y: Math.PI },
    { d: "left", y: -Math.PI / 2 },
  ];
  let best: Dir = "down";
  let bestDist = Infinity;
  for (const { d, y } of targets) {
    let dist = Math.abs(shortest(yaw, y));
    if (d === "up") dist = Math.min(dist, Math.abs(shortest(yaw, -Math.PI)));
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

/**
 * Intento en pantalla → dirección del mapa según la cámara 3D.
 * Arriba en pantalla = hacia adelante (lo que ves al fondo).
 */
export function screenToWorld3d(screen: Dir): Dir {
  return relativeToFacing(screen, yawToFacing(camYaw));
}

export function screenToWorld(screen: Dir, viewMode: "3d" | "2d"): Dir {
  return viewMode === "3d" ? screenToWorld3d(screen) : screen;
}

// silence unused if tree-shaken oddly
void DIR_CLOCK;
