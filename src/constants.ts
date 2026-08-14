/**
 * Colores actuales y vivos — baño limpio + acentos 2020s.
 * Lima eléctrica, azul vivo, coral; sin rosa retro ni cian apagado.
 */
export const PALETTE = {
  bg: "#070b12",
  fog: "#070b12",
  ink: "#f4f7ff",
  accent: "#b8ff3c",
  accentDim: "#8fd914",
  accentHot: "#ff4d6d",
  panel: "#121826",
  panelBorder: "#b8ff3c",
  // Piso: blanco brillante + gris frío
  floorA: "#ffffff",
  floorB: "#d9e2f2",
  floorGrout: "#4a5d7a",
  skirt: "#2a3548",
  // Paredes: porcelana blanca + azul actual
  wallA: "#ffffff",
  wallB: "#e8f1ff",
  wallC: "#cfe0ff",
  wallBase: "#5b8cff",
  wallTint: "#f5f8ff",
  door: "#00e5ff",
  doorGlow: "#00b7d4",
  paper: "#ffffff",
  paperCore: "#b8ff3c",
  poop: "#8b4518",
  poopPower: "#ff8c2a",
  poopGlow: "#c45a00",
  hemiSky: "#eaf2ff",
  hemiGround: "#1a2233",
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

/** Jabones saturados estilo marca actual. */
export const SOAP_COLORS = {
  blinky: "#ff3b5c",
  pinky: "#ff2ebd",
  inky: "#00e5ff",
  clyde: "#ff9f0a",
} as const;

export const SOAP_NAMES = {
  blinky: "Lejía",
  pinky: "Espuma",
  inky: "Gel",
  clyde: "Jabón",
} as const;
