/** Direction helpers (screen = world with fixed camera). */

import type { Dir } from "./types";

/** Yaw del modelo del quiltro / enemigos (radianes). */
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

/** Con cámara fija, el desliz/tecla ya es dirección de mundo. */
export function screenToWorld(screen: Dir, _viewMode: "3d" | "2d"): Dir {
  return screen;
}
