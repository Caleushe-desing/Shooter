import type { Dir } from "./types";
import { relativeToFacing } from "./types";

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

/** @deprecated alias — misma fuente que el giro del mapa */
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

export const DIR_YAW: Record<Dir, number> = {
  up: Math.PI,
  down: 0,
  left: -Math.PI / 2,
  right: Math.PI / 2,
};

export function screenToWorld3d(screen: Dir): Dir {
  return relativeToFacing(screen, yawToFacing(spinYaw));
}

export function screenToWorld(screen: Dir, viewMode: "3d" | "2d"): Dir {
  return viewMode === "3d" ? screenToWorld3d(screen) : screen;
}
