/**
 * Temática Chile actual: la cagá de Santiago de noche.
 * Colores Valparaíso / neón urbano — rompe el “baño limpio”.
 */
export const PALETTE = {
  bg: "#090614",
  fog: "#090614",
  ink: "#fff7fb",
  accent: "#ff2d95",
  accentDim: "#ff6bb5",
  accentHot: "#ffe600",
  panel: "#160b24",
  panelBorder: "#ff2d95",
  // Asfalto + cruce peatonal
  floorA: "#2a2f3a",
  floorB: "#1c212b",
  floorGrout: "#ffe600",
  skirt: "#12151c",
  // Muros: bloques muralistas (Valpo)
  wallA: "#ff2d95",
  wallB: "#00d4c8",
  wallC: "#ffe600",
  wallBase: "#3d2a7a",
  wallTint: "#ffffff",
  door: "#7c5cff",
  doorGlow: "#b49bff",
  paper: "#f4c27a", // quiltro pelaje
  paperCore: "#2b1a10",
  poop: "#ffe600", // moneda
  poopPower: "#7cfc00", // completo palta
  poopGlow: "#ff2d95",
  hemiSky: "#ffd6ec",
  hemiGround: "#1a0a28",
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

/** Enemigos de la calle chilena actual. */
export const SOAP_COLORS = {
  blinky: "#e30613", // Micro Red
  pinky: "#e8e8e8", // Gaviota
  inky: "#00c853", // Delivery
  clyde: "#ffd600", // Inspector / cono
} as const;

export const SOAP_NAMES = {
  blinky: "Micro",
  pinky: "Gaviota",
  inky: "Delivery",
  clyde: "Inspector",
} as const;

export const THEME = {
  title: "CACAMAN",
  tagline: "Un quiltro en la cagá de Santiago",
  collectLabel: "Lucas",
  powerLabel: "¡COMPLETO!",
  ready: "¡CACHAI!",
  death: "¡TE PILLARON!",
  clear: "¡BARRIO LIMPIO!",
  gameover: "Quedaste en la calle",
  frightened: "¡VAN PA'TRÁS!",
} as const;
