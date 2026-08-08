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
  pitchMin: -0.72,
  pitchMax: 0.28,
  /** Wide exploration angle — look slightly down over the soldier. */
  pitchDefault: -0.38,
  /** Stiff toy turn — mechanical, not cinematic. */
  turnRate: 18,
  /** Classic army-men green plastic. */
  plastic: '#3F8F3A',
  plasticDark: '#2E6B2A',
  plasticLight: '#58A852',
} as const

export const CAMERA = {
  /** Nearly centered behind the back for an open chase cam. */
  shoulder: 0.06,
  height: 1.45,
  crouchHeight: 0.78,
  /** How quickly the pivot follows stand ↔ crouch. */
  headFollow: 12,
  /** How quickly the collision capsule eases stand ↔ crouch. */
  capsuleLerp: 10,
  /** Raised boom for a No Man's Sky–style open third person. */
  lift: 2.4,
  /** Far chase distance — wide environmental read. */
  distance: 10.5,
  near: 0.15,
  far: 280,
  fov: 68,
  minBoomLength: 4.5,
  boomSkin: 0.35,
  boomLerp: 12,
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
