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
  pitchMax: 0.4,
  /** Close TPS — slight downward bias, not a high overview. */
  pitchDefault: -0.1,
  /** Stiff toy turn — mechanical, not cinematic. */
  turnRate: 18,
  /** Classic army-men green plastic. */
  plastic: '#3F8F3A',
  plasticDark: '#2E6B2A',
  plasticLight: '#58A852',
} as const

export const CAMERA = {
  /** Right over-the-shoulder offset (classic ARK / NMS close TPS). */
  shoulder: 0.5,
  /** Pivot at upper chest / eye line. */
  height: 1.42,
  crouchHeight: 0.82,
  headFollow: 14,
  capsuleLerp: 10,
  /** Small vertical boom lift — keeps the soldier large on screen. */
  lift: 0.15,
  /** ~2.5 m behind the model (max ~3 m). */
  distance: 2.55,
  near: 0.08,
  far: 220,
  fov: 54,
  minBoomLength: 0.95,
  boomSkin: 0.28,
  boomLerp: 16,
  /** World-space aim point distance for lookAt / crosshair alignment. */
  aimDistance: 28,
  /** Weapon / muzzle height used to align the view ray with the pistol. */
  aimHeight: 1.22,
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
