export const COLORS = {
  sky: '#c8d0d8',
  skyHaze: '#d8dee6',
  ground: '#6FA85A',
} as const

/** Sprint stamina: full drain and full recharge share the same duration. */
export const STAMINA = {
  duration: 5,
} as const

export const PLAYER = {
  height: 1.72,
  radius: 0.35,
  speed: 4,
  runMul: 2,
  jumpSpeed: 7.2,
  gravity: 18,
  /** Max lip height treated as walkable instead of a blocking wall. */
  stepHeight: 0.55,
  lookSensitivity: 0.0022,
  lookSensitivityMobile: 0.0058,
  pitchMin: -0.55,
  pitchMax: 0.45,
  pitchDefault: -0.22,
  /** How quickly the body turns toward move direction. */
  turnRate: 12,
  spawn: { x: 0, y: 0, z: 0 },
  skin: '#C9956E',
  tunic: '#4A5D4E',
  pants: '#2F3A42',
} as const

export const CAMERA = {
  shoulder: 0.45,
  height: 1.55,
  lift: 0.2,
  distance: 2.6,
  near: 0.1,
  far: 200,
  fov: 58,
  /** Closest the boom may pull in when blocked by geometry. */
  minBoomLength: 0.55,
  /** Keep the lens this far outside a hit surface. */
  boomSkin: 0.28,
  /** Smooth factor for boom pull-in / release. */
  boomLerp: 14,
} as const

export const ARENA = {
  size: 80,
} as const

export type GameStatus = 'playing'

export function clampToArena(x: number, z: number, radius: number) {
  const half = ARENA.size / 2 - radius
  return {
    x: Math.max(-half, Math.min(half, x)),
    z: Math.max(-half, Math.min(half, z)),
  }
}
