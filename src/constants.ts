/**
 * Retro WC pop — porcelana, menta y coral.
 * Vivo y de baño, sin cian apagado ni púrpura.
 */
export const PALETTE = {
  bg: "#1a1220",
  fog: "#1a1220",
  ink: "#fff6fb",
  accent: "#ff6b9d",
  accentDim: "#ff9ec0",
  accentHot: "#ffe566",
  panel: "#2a1830",
  panelBorder: "#ff6b9d",
  // Checker floor: white porcelain + soft pink
  floorA: "#fff8fb",
  floorB: "#ffd0e0",
  floorGrout: "#c98aa0",
  skirt: "#8b4d66",
  // Mint subway tiles on walls
  wallA: "#e8fff6",
  wallB: "#b6f5d9",
  wallC: "#ffffff",
  wallBase: "#6fd6b0",
  wallTint: "#f2fffa",
  door: "#ffe566",
  doorGlow: "#ffb703",
  paper: "#ffffff",
  paperCore: "#ffb3cc",
  poop: "#7a4018",
  poopPower: "#e8913a",
  poopGlow: "#8a4a12",
  hemiSky: "#ffe8f2",
  hemiGround: "#3a2040",
} as const;

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

/** Jabones de baño bien saturados. */
export const SOAP_COLORS = {
  blinky: "#ff3355",
  pinky: "#ff5ec8",
  inky: "#3dffe0",
  clyde: "#ff9f1c",
} as const;

export const SOAP_NAMES = {
  blinky: "Lejía",
  pinky: "Espuma",
  inky: "Gel",
  clyde: "Jabón",
} as const;
