/**
 * Arcade 80s — neón, flat, muchos colores.
 * Sigue siendo Chile callejero, pero look de máquina recreativa.
 */
export const PALETTE = {
  bg: "#000000",
  fog: "#000000",
  ink: "#ffffff",
  accent: "#ff00aa",
  accentDim: "#ff66cc",
  accentHot: "#ffff00",
  panel: "#000000",
  panelBorder: "#00ffff",
  floorA: "#111111",
  floorB: "#222222",
  floorGrout: "#ffff00",
  skirt: "#000000",
  wallA: "#ff00aa",
  wallB: "#00ffff",
  wallC: "#ffff00",
  wallBase: "#ff6600",
  wallTint: "#ffffff",
  door: "#aa00ff",
  doorGlow: "#ff00ff",
  paper: "#ffcc00", // quiltro arcade
  paperCore: "#ff6600",
  poop: "#ffff00",
  poopPower: "#00ff66",
  poopGlow: "#ff00aa",
  hemiSky: "#ffffff",
  hemiGround: "#000000",
} as const;

/** Paredes del laberinto: arcoíris 80s. */
export const NEON_WALLS = [
  "#ff00aa",
  "#00ffff",
  "#ffff00",
  "#ff6600",
  "#00ff66",
  "#ff0044",
  "#44aaff",
  "#ffaa00",
  "#aa00ff",
  "#66ff00",
] as const;

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
  blinky: "#ff0044",
  pinky: "#ffffff",
  inky: "#00ff66",
  clyde: "#ffff00",
} as const;

export const SOAP_NAMES = {
  blinky: "Micro",
  pinky: "Gaviota",
  inky: "Delivery",
  clyde: "Inspector",
} as const;

export const THEME = {
  title: "CACAMAN",
  tagline: "Arcade 80s · quiltro en Santiago",
  collectLabel: "Lucas",
  powerLabel: "¡COMPLETO!",
  ready: "¡CACHAI!",
  death: "¡TE PILLARON!",
  clear: "¡BARRIO LIMPIO!",
  gameover: "GAME OVER",
  frightened: "¡POWER!",
} as const;
