export type Dir = "up" | "down" | "left" | "right";

export type GhostId = "blinky" | "pinky" | "inky" | "clyde";

export type GhostMode = "scatter" | "chase" | "frightened" | "eaten" | "house";

export type GameStatus =
  | "menu"
  | "ready"
  | "playing"
  | "paused"
  | "dying"
  | "levelclear"
  | "gameover";

export const DIR_VEC: Record<Dir, { c: number; r: number }> = {
  up: { c: 0, r: -1 },
  down: { c: 0, r: 1 },
  left: { c: -1, r: 0 },
  right: { c: 1, r: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const DIR_PRIORITY: Dir[] = ["up", "left", "down", "right"];

/** Clockwise from north — used for camera-relative / facing-relative input. */
export const DIR_CLOCK: Dir[] = ["up", "right", "down", "left"];

/**
 * Screen / stick intent relative to where the character faces.
 * "up" on screen = keep going forward (facing).
 */
export function relativeToFacing(screen: Dir, facing: Dir): Dir {
  const face = DIR_CLOCK.indexOf(facing);
  const intent = DIR_CLOCK.indexOf(screen);
  if (face < 0 || intent < 0) return screen;
  return DIR_CLOCK[(face + intent) % 4];
}

export function keyCell(c: number, r: number): string {
  return `${c},${r}`;
}

export interface Actor {
  col: number;
  row: number;
  dir: Dir;
  queued: Dir | null;
}

export interface GhostState extends Actor {
  id: GhostId;
  mode: GhostMode;
  houseTimer: number;
  frightened: boolean;
}

export interface FloatingScore {
  id: number;
  x: number;
  z: number;
  text: string;
  age: number;
}
