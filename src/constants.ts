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
  pitchMin: -0.62,
  pitchMax: 0.32,
  /** Look down over the back — OTS depth read of the room. */
  pitchDefault: -0.26,
  /** Stiff toy turn — mechanical, not cinematic. */
  turnRate: 18,
  /** Classic army-men green plastic. */
  plastic: '#3F8F3A',
  plasticDark: '#2E6B2A',
  plasticLight: '#58A852',
} as const

export const CAMERA = {
  /**
   * Strong right-shoulder boom so the soldier sits in the left third of
   * the frame and the crosshair looks into clear space on the right/center.
   */
  shoulder: 0.92,
  /** Pivot above the shoulders. */
  height: 1.58,
  crouchHeight: 0.95,
  headFollow: 14,
  capsuleLerp: 10,
  /** Raise the lens above the back for a downward OTS angle. */
  lift: 0.62,
  /** Close chase — still under ~3 m. */
  distance: 2.7,
  near: 0.08,
  far: 220,
  fov: 52,
  minBoomLength: 1.05,
  boomSkin: 0.28,
  boomLerp: 16,
  /** World-space aim point distance for lookAt / crosshair alignment. */
  aimDistance: 32,
  /** Muzzle / sight height. */
  aimHeight: 1.28,
  /**
   * Lateral aim origin bias (along character right). Keeps the view ray
   * off the body so the crosshair is never buried in the backpack.
   */
  aimShoulder: 0.42,
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
