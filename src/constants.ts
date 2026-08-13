export const TILE = 1.15;

export const PLAYER_SPEED = 4.35;
export const GHOST_SPEED = 3.95;
export const FRIGHTENED_SPEED = 2.35;
export const EATEN_SPEED = 7.2;
export const TUNNEL_GHOST_SPEED = 2.1;

export const READY_SECONDS = 2.15;
export const DEATH_SECONDS = 2.1;
export const LEVEL_CLEAR_SECONDS = 3.2;
export const FRIGHTENED_SECONDS = 6.4;

export const START_LIVES = 3;

export const PELLET_SCORE = 10;
export const POWER_SCORE = 50;
export const GHOST_SCORES = [200, 400, 800, 1600] as const;

export const SCATTER_CHASE: { mode: "scatter" | "chase"; seconds: number }[] = [
  { mode: "scatter", seconds: 7 },
  { mode: "chase", seconds: 20 },
  { mode: "scatter", seconds: 7 },
  { mode: "chase", seconds: 20 },
  { mode: "scatter", seconds: 5 },
  { mode: "chase", seconds: 9999 },
];

export const SOAP_COLORS = {
  blinky: "#e23d3d",
  pinky: "#ff7eb3",
  inky: "#3ecfcf",
  clyde: "#ff9f43",
} as const;

export const SOAP_NAMES = {
  blinky: "Lejía",
  pinky: "Espuma",
  inky: "Gel",
  clyde: "Jabón",
} as const;
