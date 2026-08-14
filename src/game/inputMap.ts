import type { Dir } from "./types";
import { DIR_CLOCK_8, relativeToFacing } from "./types";

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

/** Yaw de cada rumbo — pasos de 45°. */
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

export function snapYaw45(yaw: number): number {
  const step = Math.PI / 4;
  return Math.round(yaw / step) * step;
}

export function yawToFacing(yaw: number): Dir {
  let best: Dir = "down";
  let bestDist = Infinity;
  for (const d of DIR_CLOCK_8) {
    let dist = Math.abs(shortest(yaw, DIR_YAW[d]));
    if (d === "up") dist = Math.min(dist, Math.abs(shortest(yaw, -Math.PI)));
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

export function screenToWorld3d(screen: Dir): Dir {
  // 4-way screen intents relative to nearest cardinal of current spin
  const facing4 = yawToFacing(spinYaw);
  const card =
    facing4 === "upleft" || facing4 === "upright"
      ? "up"
      : facing4 === "downleft" || facing4 === "downright"
        ? "down"
        : facing4;
  return relativeToFacing(screen, card);
}

export function screenToWorld(screen: Dir, viewMode: "3d" | "2d"): Dir {
  return viewMode === "3d" ? screenToWorld3d(screen) : screen;
}
