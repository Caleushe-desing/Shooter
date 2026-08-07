export const COLORS = {
  sky: '#6FA8C8',
  skyHaze: '#A8BCC8',
  grass: '#5A8A48',
  wall: '#C96A4A',
  wallCap: '#F2E8D5',
  skin: '#C9956E',
} as const

export const PLAYER = {
  height: 1.72,
  radius: 0.35,
  speed: 4.2,
  runMul: 1.7,
  crouchMul: 0.42,
  lookSensitivity: 0.0022,
  pitchMin: -0.55,
  pitchMax: 0.4,
  pitchDefault: -0.28,
  spawn: { x: 0, y: 0, z: 4 },
  skin: '#C9956E',
} as const

/** Jump / crouch physics tuned for a ~1.72 m human. */
export const LOCOMOTION = {
  jumpSpeed: 6.4,
  crouchJumpSpeed: 5.0,
  gravity: 18,
  airControl: 0.75,
  camHeight: { stand: 1.7, crouch: 1.15 } as const,
  boomScale: { stand: 1, crouch: 0.9 } as const,
} as const

/** Chase cam locked on the character's back. */
export const CAMERA = {
  shoulder: 0.35,
  height: 1.7,
  lift: 0.22,
  distance: 3.6,
  near: 0.1,
  far: 80,
  fov: 60,
} as const

export const ARENA = {
  size: 20,
  wallHeight: 2.4,
  wallThickness: 0.35,
} as const

export function clampToArena(x: number, z: number, radius: number) {
  const half = ARENA.size / 2 - radius
  return {
    x: Math.max(-half, Math.min(half, x)),
    z: Math.max(-half, Math.min(half, z)),
  }
}
