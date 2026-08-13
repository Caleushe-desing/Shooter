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
