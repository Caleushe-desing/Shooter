import type { Dir } from "./types";
import { DIR_CLOCK, relativeToFacing } from "./types";

/** Yaw de cámara / “giro del mapa” en 3D (radianes). */
let spinYaw = 0;
let dragging = false;

export function setSpinYaw(yaw: number): void {
  spinYaw = yaw;
}

export function getSpinYaw(): number {
  return spinYaw;
}

export function adjustSpinYaw(delta: number): void {
  spinYaw += delta;
}

export function setSpinDragging(value: boolean): void {
  dragging = value;
}

export function isSpinDragging(): boolean {
  return dragging;
}

export function setCamYaw(yaw: number): void {
  spinYaw = yaw;
}

export function getCamYaw(): number {
  return spinYaw;
}

function shortest(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Yaw de cada rumbo (cardinales + diagonales por compat). */
export const DIR_YAW: Record<Dir, number> = {
  down: 0,
  downright: Math.PI / 4,
  right: Math.PI / 2,
  upright: (3 * Math.PI) / 4,
  up: Math.PI,
  upleft: (-3 * Math.PI) / 4,
  left: -Math.PI / 2,
  downleft: -Math.PI / 4,
};

/** Solo N/E/S/O — un desliz = 90°. */
const CARDINAL_YAWS: { d: Dir; y: number }[] = [
  { d: "down", y: 0 },
  { d: "right", y: Math.PI / 2 },
  { d: "up", y: Math.PI },
  { d: "left", y: -Math.PI / 2 },
];

export function yawToFacing(yaw: number): Dir {
  let best: Dir = "down";
  let bestDist = Infinity;
  for (const { d, y } of CARDINAL_YAWS) {
    let dist = Math.abs(shortest(yaw, y));
    if (d === "up") dist = Math.min(dist, Math.abs(shortest(yaw, -Math.PI)));
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

function toCardinal(dir: Dir): Dir {
  if (dir === "upleft" || dir === "upright") return "up";
  if (dir === "downleft" || dir === "downright") return "down";
  if (dir === "up" || dir === "down" || dir === "left" || dir === "right") return dir;
  return yawToFacing(DIR_YAW[dir]);
}

/**
 * Gira N pasos de 90° (solo cardinales).
 * steps > 0 = izquierda (A / desliz izq) · steps < 0 = derecha (D / desliz der).
 * Ej: 1 + 1 = 180° al mismo lado.
 */
export function stepFacing90(from: Dir, steps: number): Dir {
  const card = toCardinal(from);
  const i = DIR_CLOCK.indexOf(card);
  const base = i < 0 ? 0 : i;
  const next = ((base + steps) % 4 + 4) % 4;
  return DIR_CLOCK[next];
}

/** Un desliz / una tecla = exactamente 90°; el siguiente suma otros 90°. */
export function turnMap90(steps: number): Dir {
  const current = toCardinal(yawToFacing(spinYaw));
  const facing = stepFacing90(current, steps);
  spinYaw = DIR_YAW[facing];
  return facing;
}

export function screenToWorld3d(screen: Dir): Dir {
  return relativeToFacing(screen, yawToFacing(spinYaw));
}

export function screenToWorld(screen: Dir, viewMode: "3d" | "2d"): Dir {
  return viewMode === "3d" ? screenToWorld3d(screen) : screen;
}
