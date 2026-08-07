export const COLORS = {
  black: '#000000',
  neonGreen: '#6FE04A',
  white: '#FFFFFF',
  tracer: '#5CC8FF',
  /** Natural outdoor daylight — less toy, more earthy. */
  sky: '#6FA8C8',
  skyZenith: '#3A6F9A',
  skyHorizon: '#C8D8E4',
  skyHaze: '#A8BCC8',
  grass: '#4A7A3A',
  grassLight: '#5A8A48',
  grassDark: '#3A5A2E',
  /** Warm suburban brick + cream coping. */
  wallCap: '#F2E8D5',
  brick: '#C96A4A',
  brickAlt: '#D47A58',
  mortar: '#E8DFD2',
  /** Soft cardboard / foam crates. */
  wood: '#F3E8D0',
  woodLight: '#FFF6E4',
  woodDark: '#D4C2A0',
  woodEdge: '#B8A88A',
  foamChip: '#FFF8EC',
  foamHole: '#8A7A62',
  /** Natural human skin. */
  skin: '#C9956E',
  skinLight: '#D8A882',
  skinShadow: '#A87452',
  hair: '#2A1E16',
  gunMetal: '#5A6570',
  gunMetalLight: '#7A8794',
  gunSteel: '#9AA6B2',
  gunGrip: '#6B4E3A',
  enemySkins: ['#C9956E', '#B88460', '#D4A070', '#A87452'] as const,
  enemyShirts: ['#6B5A4A', '#4A5A4A', '#5A4A3A', '#3A4A5A'] as const,
  enemyPants: ['#3A3A38', '#4A4038', '#2A3028', '#3A3530'] as const,
  enemyEye: '#1A1A1A',
  blood: '#8A2A2A',
  bloodDark: '#5A1818',
  uiAccent: '#8FBF6A',
  uiAccentHot: '#C86A4A',
  uiPanel: '#141820',
  uiPanelSoft: 'rgba(14, 18, 24, 0.88)',
} as const

export const PLAYER = {
  eyeHeight: 1.62,
  /** Body height scale for the nude human colonist. */
  height: 1.0,
  radius: 0.4,
  speed: 6.8,
  lookSensitivityDesktop: 0.0022,
  lookSensitivityMobile: 0.0034,
  pitchMin: -1.05,
  pitchMax: 0.85,
  spawn: { x: 0, y: 0, z: 8 },
  maxHealth: 100,
  skin: '#C9956E',
  skinLight: '#D8A882',
  skinShadow: '#A87452',
  hair: '#2A1E16',
} as const

/**
 * Classic third-person chase cam (GTA / San Andreas style):
 * camera sits rear-right so the pup reads in ¾ (back + side), with soft follow lag.
 */
export const CAMERA = {
  /** Rear-right boom — enough lateral offset to show the pup de costado. */
  shoulder: 1.45,
  height: 1.85,
  /** Slight lift on the lens so we look down onto the pup. */
  lift: 0.35,
  distance: 5.1,
  scopedDistance: 2.4,
  /** Look-down bias on the boom (radians). */
  pitchBias: 0.22,
  /** How far ahead of the pivots the camera looks (¾ framing). */
  lookAhead: 1.15,
  /** Soft chase lag — higher = snappier, lower = more cinematic. */
  followYaw: 6.5,
  followPitch: 8.5,
  /** Body turns toward move / look. */
  bodyTurn: 10,
  boomSpeed: 9,
  collisionPullSpeed: 28,
  minDistance: 1.1,
  collisionSkin: 0.55,
  near: 0.12,
  far: 2200,
  /**
   * Hip-fire reticle (% of viewport). Open space to the right of the pup.
   */
  aimLeftPct: 58,
  aimTopPct: 46,
} as const

/** NDC coords matching `CAMERA.aimLeftPct` / `aimTopPct` for hitscan. */
export function hipFireAimNdc(): { x: number; y: number } {
  return {
    x: (CAMERA.aimLeftPct / 100) * 2 - 1,
    y: 1 - (CAMERA.aimTopPct / 100) * 2,
  }
}

/** Telescopic sight (aim down scope). */
export const SCOPE = {
  baseFov: 65,
  zoomedFov: 30,
  transitionSpeed: 9,
  moveScale: 0.45,
} as const

export const ARENA = {
  /** Legacy crate clearing size near spawn (open world uses WORLD). */
  size: 28,
  wallHeight: 4,
  wallThickness: 0.4,
} as const

/** Hostile bandits still roam the open country. */
export const ENEMY = {
  baseCount: 3,
  perRound: 1,
  maxCount: 8,
  firstSpawnDelayMs: 8000,
  spawnIntervalMs: 5000,
  spawnRingMin: 22,
  spawnRingMax: 36,
  spawnMinPlayerDistance: 14,
  speedMin: 1.0,
  speedMax: 1.45,
  speedPerRound: 0.1,
  radius: 0.42,
  grabDistance: 1.25,
  grabDamagePerSec: 12,
  torsoY: 1.12,
  torsoRadius: 0.42,
  headY: 1.62,
  headRadius: 0.22,
  pointsPerKill: 150,
  headshotBonus: 100,
  corpseFadeMs: 2800,
  spawnRiseMs: 420,
} as const

/** Mobile look/fire zone: hard press fires; light drag only looks. */
export const TOUCH_FIRE = {
  /** Absolute pressure (0–1) that counts as a hard press. */
  pressureThreshold: 0.55,
  /** Extra pressure above the initial contact required to fire. */
  pressureDelta: 0.14,
  /** Ignore tiny pressure noise when detecting real force sensors. */
  pressureVariance: 0.04,
  /** Movement (px) that cancels the no-force tap fallback. */
  dragCancelPx: 16,
  /** Max contact time (ms) for the no-force tap fallback. */
  tapMaxMs: 240,
} as const

export const COMBAT = {
  tracerSpeed: 120,
  tracerLength: 1.1,
  tracerRadius: 0.045,
  tracerMaxDistance: 90,
  fireCooldownMs: 180,
  explosionFragments: 14,
  pierceChips: 7,
  pierceHoleMax: 240,
  pierceHoleRadius: 0.06,
} as const

export type Collider = {
  minX: number
  maxX: number
  minY?: number
  maxY?: number
  minZ: number
  maxZ: number
}

/** Static obstacle boxes near spawn (center + half extents on XZ). */
export const OBSTACLES: { x: number; z: number; w: number; d: number; h: number }[] = [
  { x: -6, z: -2, w: 2, d: 2, h: 2.5 },
  { x: 5, z: -5, w: 2.5, d: 2, h: 3 },
  { x: 0, z: -8, w: 3, d: 1.5, h: 2 },
  { x: -8, z: 4, w: 1.8, d: 1.8, h: 2.2 },
  { x: 8, z: 2, w: 2, d: 3, h: 2.8 },
]

export function buildColliders(): Collider[] {
  // Open world: only spawn crates here. Trees / rim come from worldStore.
  return OBSTACLES.map((o) => ({
    minX: o.x - o.w / 2,
    maxX: o.x + o.w / 2,
    minZ: o.z - o.d / 2,
    maxZ: o.z + o.d / 2,
  }))
}

export const COLLIDERS = buildColliders()

export function mergeColliders(extra: Collider[] = []): Collider[] {
  return [...COLLIDERS, ...extra]
}

export function resolveCircleBoxCollision(
  x: number,
  z: number,
  radius: number,
  colliders: Collider[] = COLLIDERS,
): { x: number; z: number } {
  let px = x
  let pz = z

  for (const c of colliders) {
    const closestX = Math.max(c.minX, Math.min(px, c.maxX))
    const closestZ = Math.max(c.minZ, Math.min(pz, c.maxZ))
    const dx = px - closestX
    const dz = pz - closestZ
    const distSq = dx * dx + dz * dz
    if (distSq >= radius * radius) continue

    if (distSq === 0) {
      const left = Math.abs(px - c.minX)
      const right = Math.abs(c.maxX - px)
      const top = Math.abs(pz - c.minZ)
      const bottom = Math.abs(c.maxZ - pz)
      const min = Math.min(left, right, top, bottom)
      if (min === left) px = c.minX - radius
      else if (min === right) px = c.maxX + radius
      else if (min === top) pz = c.minZ - radius
      else pz = c.maxZ + radius
      continue
    }

    const dist = Math.sqrt(distSq)
    const push = (radius - dist) / dist
    px += dx * push
    pz += dz * push
  }

  return { x: px, z: pz }
}
