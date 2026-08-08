export const COLORS = {
  sky: '#7BA8C4',
  skyHaze: '#A8BCC8',
  ground: '#6A8A58',
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
  jumpSpeed: 6.5,
  gravity: 16,
  lookSensitivity: 0.0022,
  lookSensitivityMobile: 0.0058,
  lookStickRate: 3.4,
  lookStickDeadzone: 10,
  lookStickMax: 120,
  pitchMin: -0.55,
  pitchMax: 0.4,
  pitchDefault: -0.28,
  spawn: { x: 0, y: 0, z: 0 },
  skin: '#C9956E',
} as const

export const CAMERA = {
  shoulder: 0.4,
  height: 1.55,
  lift: 0.18,
  distance: 2.45,
  near: 0.1,
  far: 220,
  fov: 58,
  minBoomLength: 0.65,
  fpHeight: 1.58,
  fpNear: 0.05,
  fpFov: 72,
  fpForward: 0.12,
  topHeight: 18,
  topHeightMin: 8,
  topHeightMax: 48,
  topZoomWheel: 0.045,
  topZoomStep: 2.2,
  topFov: 42,
  topNear: 1,
  topFar: 120,
} as const

export const ARENA = {
  size: 80,
} as const

export type CameraMode = 'third' | 'first' | 'top'
export type GameStatus = 'playing'

export function clampToArena(x: number, z: number, radius: number) {
  const half = ARENA.size / 2 - radius
  return {
    x: Math.max(-half, Math.min(half, x)),
    z: Math.max(-half, Math.min(half, z)),
  }
}
