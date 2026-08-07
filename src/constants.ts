export const COLORS = {
  sky: '#7BA8C4',
  skyHaze: '#A8BCC8',
  grass: '#5A8A48',
  /** Packed earth / plaza sand (Haven-like warm ground). */
  sand: '#C4B48A',
  stone: '#B8A890',
  stoneDark: '#8A7A68',
  brick: '#C96A4A',
  plaster: '#D8C8B0',
  wood: '#8B5A3C',
  roof: '#6B4A3A',
  roofGreen: '#4A6B52',
  wall: '#C96A4A',
  wallCap: '#F2E8D5',
  skin: '#C9956E',
} as const

export const PLAYER = {
  height: 1.72,
  radius: 0.35,
  speed: 4.2,
  runMul: 1.7,
  /** Vertical launch speed (m/s). */
  jumpSpeed: 5.2,
  /** Gravity while airborne (m/s²). */
  gravity: 16,
  lookSensitivity: 0.0022,
  /** Touch look drag — slightly snappier than mouse. */
  lookSensitivityMobile: 0.0032,
  pitchMin: -0.55,
  pitchMax: 0.4,
  pitchDefault: -0.28,
  /** Mid lane spawn facing north toward sites. */
  spawn: { x: 0, y: 0, z: 10 },
  skin: '#C9956E',
} as const

/** Chase cam — close over-the-shoulder TPS (character fills frame). */
export const CAMERA = {
  shoulder: 0.4,
  height: 1.55,
  lift: 0.18,
  distance: 2.45,
  near: 0.1,
  far: 220,
  fov: 58,
} as const

/**
 * Third-person aim: tiny off-center point; shots leave the character
 * toward the world point under that reticle (NDC derived from px + viewport).
 */
export const WEAPON = {
  /** Screen offset from center (px) — slight right bias for shoulder cam. */
  crosshairOffsetX: 28,
  crosshairOffsetY: -4,
  /** How far along the look ray we place the aim target. */
  aimDistance: 90,
  /** Muzzle on the character (local to facing). */
  muzzleHeight: 1.22,
  muzzleShoulder: 0.22,
  muzzleForward: 0.38,
  cooldown: 0.14,
  speed: 95,
  range: 90,
  tracerRadius: 0.03,
  tracerLength: 0.95,
} as const

export const ARENA = {
  /** Playable square (meters). */
  size: 96,
  wallHeight: 3.6,
  wallThickness: 0.9,
} as const

export function clampToArena(x: number, z: number, radius: number) {
  const half = ARENA.size / 2 - radius
  return {
    x: Math.max(-half, Math.min(half, x)),
    z: Math.max(-half, Math.min(half, z)),
  }
}

/** Axis-aligned solid for horizontal collision (footprint). */
export type SolidBox = {
  x: number
  z: number
  w: number
  d: number
}

/**
 * Push a circle out of an AABB on XZ.
 * Returns corrected position.
 */
export function resolveCircleAabb(
  x: number,
  z: number,
  radius: number,
  box: SolidBox,
): { x: number; z: number } {
  const halfW = box.w * 0.5
  const halfD = box.d * 0.5
  const minX = box.x - halfW
  const maxX = box.x + halfW
  const minZ = box.z - halfD
  const maxZ = box.z + halfD

  const closestX = Math.max(minX, Math.min(x, maxX))
  const closestZ = Math.max(minZ, Math.min(z, maxZ))
  let dx = x - closestX
  let dz = z - closestZ
  const distSq = dx * dx + dz * dz

  if (distSq >= radius * radius) return { x, z }

  // Center inside the box — push out via nearest face.
  if (distSq < 1e-8) {
    const left = x - minX
    const right = maxX - x
    const bottom = z - minZ
    const top = maxZ - z
    const m = Math.min(left, right, bottom, top)
    if (m === left) return { x: minX - radius, z }
    if (m === right) return { x: maxX + radius, z }
    if (m === bottom) return { x, z: minZ - radius }
    return { x, z: maxZ + radius }
  }

  const dist = Math.sqrt(distSq)
  const push = (radius - dist) / dist
  return { x: x + dx * push, z: z + dz * push }
}
