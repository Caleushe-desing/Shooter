/** Sprint stamina: full drain and full recharge share the same duration. */
export const STAMINA = {
  duration: 5,
} as const

export const PLAYER = {
  height: 1.72,
  /** Capsule height while fully crouched (top drops; feet stay planted). */
  crouchHeight: 0.86,
  radius: 0.32,
  speed: 3.6,
  /** Tactical crouch move speed = 40% of normal walk. */
  crouchSpeedMul: 0.4,
  runMul: 1.85,
  jumpSpeed: 7.0,
  gravity: 18,
  /** Max lip height treated as walkable instead of a blocking wall. */
  stepHeight: 0.55,
  lookSensitivity: 0.0022,
  lookSensitivityMobile: 0.0058,
  pitchMin: -0.55,
  pitchMax: 0.5,
  pitchDefault: -0.18,
  /** Stiff toy turn — mechanical, not cinematic. */
  turnRate: 18,
  /** Classic army-men green plastic. */
  plastic: '#3F8F3A',
  plasticDark: '#2E6B2A',
  plasticLight: '#58A852',
} as const

export const CAMERA = {
  shoulder: 0.4,
  height: 1.48,
  crouchHeight: 0.78,
  /** How quickly the pivot follows stand ↔ crouch. */
  headFollow: 12,
  /** How quickly the collision capsule eases stand ↔ crouch. */
  capsuleLerp: 10,
  lift: 0.18,
  distance: 2.8,
  near: 0.1,
  far: 220,
  fov: 58,
  minBoomLength: 0.55,
  boomSkin: 0.28,
  boomLerp: 14,
} as const

/** Interior footprint of the giant living room (xz). */
export const ARENA = {
  size: 64,
} as const

export type GameStatus = 'playing'

export function clampToArena(x: number, z: number, radius: number) {
  const half = ARENA.size / 2 - radius
  return {
    x: Math.max(-half, Math.min(half, x)),
    z: Math.max(-half, Math.min(half, z)),
  }
}
