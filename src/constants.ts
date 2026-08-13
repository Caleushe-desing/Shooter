/** Digital bathroom palette — ceramic / neon arcade, still “baño”. */
export const PALETTE = {
  bg: "#0b1520",
  fog: "#0b1520",
  ink: "#e8fbff",
  accent: "#5dffd2",
  accentDim: "#2ec4a0",
  accentHot: "#ffe566",
  panel: "#102033",
  panelBorder: "#3dffe0",
  floorA: "#d7f7f2",
  floorB: "#b8ebe6",
  floorGrout: "#5a8f9a",
  skirt: "#3d6a78",
  wallA: "#f2fffe",
  wallB: "#d4f4f8",
  wallC: "#e8fbff",
  wallBase: "#9fd4de",
  wallTint: "#e8f9ff",
  door: "#49e0ff",
  doorGlow: "#00b8e0",
  paper: "#f5fffd",
  paperCore: "#7ad1c6",
  poop: "#6e3d18",
  poopPower: "#c47a2a",
  poopGlow: "#5a3010",
  hemiSky: "#d9fff8",
  hemiGround: "#1a3040",
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

/** Neon soap bars — bathroom cleaners, arcade-bright. */
export const SOAP_COLORS = {
  blinky: "#ff3b5c",
  pinky: "#ff6ad5",
  inky: "#2de2e6",
  clyde: "#ffb347",
} as const;

export const SOAP_NAMES = {
  blinky: "Lejía",
  pinky: "Espuma",
  inky: "Gel",
  clyde: "Jabón",
} as const;
