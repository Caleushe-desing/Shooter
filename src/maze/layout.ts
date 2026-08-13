import { keyCell } from "../game/types";
import type { Dir } from "../game/types";

/**
 * Laberinto estilo Pac-Man (19x22).
 * # muro  . caca  o caca grande  P jugador  - puerta de la casa  espacio = pasillo
 */
export const RAW_MAZE = [
  "###################",
  "#........#........#",
  "#o##.###.#.###.##o#",
  "#.##.###.#.###.##.#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.###.#.###.####",
  "#  #.#       #.#  #",
  "####.# ##-## #.####",
  "    .  #   #  .    ",
  "####.# ##### #.####",
  "#  #.#       #.#  #",
  "####.#.#####.#.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#o.#.....P.....#.o#",
  "##.#.#.#####.#.#.##",
  "#....#...#...#....#",
  "#.######.#.######.#",
  "#.................#",
  "###################",
] as const;

export const ROWS = RAW_MAZE.length;
export const COLS = RAW_MAZE[0].length;

export interface MazeData {
  rows: number;
  cols: number;
  cells: string[][];
  pellets: Set<string>;
  powerPellets: Set<string>;
  playerSpawn: { c: number; r: number };
  door: { c: number; r: number };
  houseCenter: { c: number; r: number };
  ghostOnly: Set<string>;
  blinkySpawn: { c: number; r: number };
  houseSpawns: { c: number; r: number }[];
  scatter: Record<"blinky" | "pinky" | "inky" | "clyde", { c: number; r: number }>;
}

function parseMaze(): MazeData {
  const width = RAW_MAZE[0].length;
  for (const row of RAW_MAZE) {
    if (row.length !== width) {
      throw new Error(`Fila de laberinto con longitud ${row.length}, se esperaba ${width}: "${row}"`);
    }
  }

  const cells = RAW_MAZE.map((row) => [...row]);
  const pellets = new Set<string>();
  const powerPellets = new Set<string>();
  let playerSpawn = { c: 9, r: 16 };
  let door = { c: 9, r: 9 };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = cells[r][c];
      if (ch === ".") pellets.add(keyCell(c, r));
      if (ch === "o") powerPellets.add(keyCell(c, r));
      if (ch === "P") playerSpawn = { c, r };
      if (ch === "-") door = { c, r };
    }
  }

  const ghostOnly = new Set<string>();
  ghostOnly.add(keyCell(door.c, door.r));
  for (const dc of [-1, 0, 1]) {
    ghostOnly.add(keyCell(door.c + dc, door.r + 1));
  }

  const houseCenter = { c: door.c, r: door.r + 1 };
  const blinkySpawn = { c: door.c, r: door.r - 1 };
  const houseSpawns = [
    { c: door.c, r: door.r + 1 },
    { c: door.c - 1, r: door.r + 1 },
    { c: door.c + 1, r: door.r + 1 },
  ];

  return {
    rows: ROWS,
    cols: COLS,
    cells,
    pellets,
    powerPellets,
    playerSpawn,
    door,
    houseCenter,
    ghostOnly,
    blinkySpawn,
    houseSpawns,
    scatter: {
      blinky: { c: COLS - 2, r: 0 },
      pinky: { c: 1, r: 0 },
      inky: { c: COLS - 2, r: ROWS - 1 },
      clyde: { c: 1, r: ROWS - 1 },
    },
  };
}

export const MAZE = parseMaze();

export function tileChar(c: number, r: number): string {
  if (r < 0 || r >= ROWS) return "#";
  if (c < 0 || c >= COLS) {
    if (r >= 0 && r < ROWS) {
      const row = RAW_MAZE[r];
      if (row[0] === " " || row[COLS - 1] === " ") return " ";
    }
    return "#";
  }
  return MAZE.cells[r][c];
}

export function isWall(c: number, r: number): boolean {
  const ch = tileChar(c, r);
  return ch === "#";
}

export function isDoor(c: number, r: number): boolean {
  return tileChar(c, r) === "-";
}

export function isGhostOnly(c: number, r: number): boolean {
  return MAZE.ghostOnly.has(keyCell(c, r));
}

export function isWalkable(c: number, r: number, ghost: boolean): boolean {
  if (isWall(c, r)) return false;
  if (!ghost && (isDoor(c, r) || isGhostOnly(c, r))) return false;
  return true;
}

export function wrapCol(c: number): number {
  if (c < 0) return c + COLS;
  if (c >= COLS) return c - COLS;
  return c;
}

export function neighbor(c: number, r: number, dir: Dir): { c: number; r: number } {
  switch (dir) {
    case "up":
      return { c, r: r - 1 };
    case "down":
      return { c, r: r + 1 };
    case "left":
      return { c: wrapCol(c - 1), r };
    case "right":
      return { c: wrapCol(c + 1), r };
  }
}

export function exits(c: number, r: number, ghost: boolean): Dir[] {
  const dirs: Dir[] = [];
  for (const dir of ["up", "left", "down", "right"] as Dir[]) {
    const n = neighbor(c, r, dir);
    if (isWalkable(n.c, n.r, ghost)) dirs.push(dir);
  }
  return dirs;
}
