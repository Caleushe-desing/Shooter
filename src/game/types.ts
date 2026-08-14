export type Dir =
  | "up"
  | "down"
  | "left"
  | "right"
  | "upleft"
  | "upright"
  | "downleft"
  | "downright";

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

/** Vectores de tile (signos). Diagonales = 45°. */
export const DIR_VEC: Record<Dir, { c: number; r: number }> = {
  up: { c: 0, r: -1 },
  down: { c: 0, r: 1 },
  left: { c: -1, r: 0 },
  right: { c: 1, r: 0 },
  upleft: { c: -1, r: -1 },
  upright: { c: 1, r: -1 },
  downleft: { c: -1, r: 1 },
  downright: { c: 1, r: 1 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
  upleft: "downright",
  upright: "downleft",
  downleft: "upright",
  downright: "upleft",
};

/** Solo cardinales — fantasmas / IA. */
export const CARDINAL_DIRS: Dir[] = ["up", "left", "down", "right"];

/** Fantasmas eligen en este orden. */
export const DIR_PRIORITY: Dir[] = CARDINAL_DIRS;

/**
 * 8 rumbos en sentido horario desde “down” (yaw 0, +Z).
 * Pasos de 45°.
 */
export const DIR_CLOCK_8: Dir[] = [
  "down",
  "downright",
  "right",
  "upright",
  "up",
  "upleft",
  "left",
  "downleft",
];

export function isDiagonal(dir: Dir): boolean {
  const v = DIR_VEC[dir];
  return v.c !== 0 && v.r !== 0;
}

/** Clockwise from north — 4-way (2D swipe). */
export const DIR_CLOCK: Dir[] = ["up", "right", "down", "left"];

/**
 * Screen / stick intent relative to where the character faces (4-way).
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
