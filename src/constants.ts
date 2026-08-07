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
  /** Vertical launch speed (m/s) — clears ~1.3 m pads/crates. */
  jumpSpeed: 6.5,
  /** Gravity while airborne (m/s²). */
  gravity: 16,
  lookSensitivity: 0.0022,
  /** Touch look — higher so a short drag turns farther. */
  lookSensitivityMobile: 0.0058,
  /**
   * Hold-to-turn rate (rad/s at full stick deflection).
   * Applied in PlayerController from mobileLookStick.
   */
  lookStickRate: 2.8,
  lookStickDeadzone: 10,
  /** Clamp finger offset (px) so max turn rate stays controllable. */
  lookStickMax: 120,
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
  /** Pull cam in before wall contact so the character stays visible. */
  collidePadding: 0.28,
  /** Never collapse the boom closer than this (meters along boom). */
  minBoomLength: 0.65,
  /** How fast the boom eases back out after clearing a wall. */
  collideOutSmooth: 12,
  /** First-person eye cam. */
  fpHeight: 1.58,
  fpNear: 0.05,
  fpFov: 72,
  /** Tiny forward so near plane clears the invisible body. */
  fpForward: 0.12,
  /** Top-down / 2D Pac-Man style — closer = larger on screen. */
  topHeight: 18,
  topHeightMin: 8,
  topHeightMax: 48,
  /** World meters of height change per wheel notch (≈100 deltaY). */
  topZoomWheel: 0.045,
  /** Buttons / keys step (meters). */
  topZoomStep: 2.2,
  topFov: 42,
  topNear: 1,
  topFar: 120,
} as const

export type CameraMode = 'third' | 'first' | 'top'

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
  /** Revolver cadence. */
  cooldown: 0.32,
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

/** Pac-Man survival loop — golden orbs + limited revolver. */
export const PICKUPS = {
  orbRadius: 0.38,
  orbHeight: 0.55,
  orbCollectDist: 1.05,
  orbPoints: 10,
  ammoBoxSize: 0.55,
  ammoCollectDist: 1.25,
  ammoPerBox: 3,
} as const

export const WEAPON_AMMO = {
  max: 6,
  start: 6,
} as const

/** Pursuing zombies (wireframe-ish capsules). */
export const ZOMBIE = {
  radius: 0.4,
  height: 1.7,
  speed: 2.55,
  chaseSpeed: 3.35,
  hp: 2,
  catchRange: 1.05,
  visionRange: 18,
  loseRange: 26,
  stunTime: 2.8,
  patrolSpeed: 1.65,
  color: '#4A6B3A',
  eyeColor: '#C8FF66',
  /** Initial spawn points (far from mid spawn). */
  spawns: [
    { x: -30, z: -16 },
    { x: 30, z: -16 },
    { x: -24, z: 26 },
    { x: 24, z: 26 },
    { x: 0, z: -30 },
    { x: 0, z: 40 },
    { x: -34, z: 8 },
    { x: 34, z: 8 },
  ],
  /** Shared patrol corners around the map. */
  waypoints: [
    { x: -28, z: -12 },
    { x: -28, z: 12 },
    { x: 0, z: 20 },
    { x: 28, z: 12 },
    { x: 28, z: -12 },
    { x: 0, z: -20 },
    { x: -18, z: 30 },
    { x: 18, z: 30 },
  ],
} as const

export type GameStatus = 'playing' | 'won' | 'lost'

export function clampToArena(x: number, z: number, radius: number) {
  const half = ARENA.size / 2 - radius
  return {
    x: Math.max(-half, Math.min(half, x)),
    z: Math.max(-half, Math.min(half, z)),
  }
}

/** Axis-aligned solid with footprint + vertical extent. */
export type SolidBox = {
  x: number
  z: number
  w: number
  d: number
  minY: number
  maxY: number
}

/** Vertical collision tuning (platforms / ledges). */
export const COLLISION = {
  /** Max lip the player can walk onto without jumping (meters). */
  stepHeight: 0.28,
  /** Extra reach when snapping feet onto a surface while falling. */
  landSnap: 0.2,
  /** Probe radius scale vs body radius for ground support checks. */
  supportRadiusScale: 0.72,
} as const

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

/** True when the solid sticks up enough to block at this body height. */
export function solidBlocksHorizontally(
  solid: SolidBox,
  feetY: number,
  bodyHeight: number,
  stepHeight: number = COLLISION.stepHeight,
): boolean {
  // Cleared / standing on top / can step onto — walk over, no side push.
  if (solid.maxY <= feetY + stepHeight) return false
  // Entirely above the head (ceiling handled separately).
  if (solid.minY >= feetY + bodyHeight - 0.05) return false
  return true
}

/**
 * Resolve circle vs solids on XZ, ignoring volumes the body has cleared
 * by jumping/stepping above their top.
 */
export function resolveCircleSolids(
  x: number,
  z: number,
  radius: number,
  solids: readonly SolidBox[],
  feetY: number,
  bodyHeight: number,
  stepHeight: number = COLLISION.stepHeight,
): { x: number; z: number } {
  let nx = x
  let nz = z
  for (let pass = 0; pass < 2; pass++) {
    for (const box of solids) {
      if (!solidBlocksHorizontally(box, feetY, bodyHeight, stepHeight)) continue
      const hit = resolveCircleAabb(nx, nz, radius, box)
      nx = hit.x
      nz = hit.z
    }
  }
  return { x: nx, z: nz }
}

function circleHitsSolidXZ(
  x: number,
  z: number,
  radius: number,
  box: SolidBox,
): boolean {
  const halfW = box.w * 0.5
  const halfD = box.d * 0.5
  const closestX = Math.max(box.x - halfW, Math.min(x, box.x + halfW))
  const closestZ = Math.max(box.z - halfD, Math.min(z, box.z + halfD))
  const dx = x - closestX
  const dz = z - closestZ
  return dx * dx + dz * dz <= radius * radius
}

/**
 * Highest walkable surface under/near the feet (arena floor = 0).
 * `maxReach` limits how far above the feet we still consider a top.
 */
export function findSupportY(
  x: number,
  z: number,
  feetY: number,
  radius: number,
  solids: readonly SolidBox[],
  maxReach: number = COLLISION.landSnap,
): number {
  let best = 0
  for (const box of solids) {
    if (!circleHitsSolidXZ(x, z, radius, box)) continue
    if (box.maxY <= feetY + maxReach && box.maxY > best) {
      best = box.maxY
    }
  }
  return best
}

/** Clamp rising head against solid undersides. */
export function resolveCeiling(
  feetY: number,
  velY: number,
  radius: number,
  x: number,
  z: number,
  bodyHeight: number,
  solids: readonly SolidBox[],
): { feetY: number; velY: number } {
  if (velY <= 0) return { feetY, velY }
  let y = feetY
  let vy = velY
  const head = y + bodyHeight
  for (const box of solids) {
    if (!circleHitsSolidXZ(x, z, radius, box)) continue
    if (head > box.minY && y < box.minY) {
      y = box.minY - bodyHeight
      vy = 0
    }
  }
  return { feetY: y, velY: vy }
}
