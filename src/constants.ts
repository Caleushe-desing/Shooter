export const COLORS = {
  black: '#000000',
  neonGreen: '#6FE04A',
  white: '#FFFFFF',
  tracer: '#5CC8FF',
  /** Sims-like daylight: bright, saturated, suburban. */
  sky: '#7EC8F5',
  skyZenith: '#4BA3E3',
  skyHorizon: '#E8F4FC',
  skyHaze: '#D6ECF8',
  grass: '#5CB85A',
  grassLight: '#7ED957',
  grassDark: '#3F9A45',
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
  /** Soft, even Sim-like skin. */
  skin: '#F0C5A0',
  skinLight: '#F8D9BC',
  skinShadow: '#D4A07A',
  gunMetal: '#5A6570',
  gunMetalLight: '#7A8794',
  gunSteel: '#9AA6B2',
  gunGrip: '#6B4E3A',
  /** Bright Sim wardrobe palette. */
  enemySkins: ['#F0C5A0', '#E8B888', '#D4A070', '#C9946A'] as const,
  enemyShirts: ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#C77DFF', '#FF8C42'] as const,
  enemyPants: ['#4A6FA5', '#6B7280', '#3D5A80', '#5B6B4A'] as const,
  enemyEye: '#2B2B2B',
  blood: '#E85A5A',
  bloodDark: '#C43D3D',
  /** UI — plumbob-adjacent greens and soft panels. */
  uiAccent: '#6FE04A',
  uiAccentHot: '#FF7A59',
  uiPanel: '#1A2430',
  uiPanelSoft: 'rgba(26, 36, 48, 0.72)',
} as const

export const PLAYER = {
  eyeHeight: 1.65,
  /** Body height scale for the bipedal pup avatar. */
  height: 1.0,
  radius: 0.45,
  speed: 7.5,
  lookSensitivityDesktop: 0.0022,
  lookSensitivityMobile: 0.0034,
  pitchMin: -1.05,
  pitchMax: 0.85,
  spawn: { x: 0, y: 0, z: 8 },
  maxHealth: 100,
  /** Soft toy-dog fur palette + plumbob collar. */
  fur: '#D4A574',
  furLight: '#E8C9A0',
  furDark: '#B8895A',
  belly: '#F5E6D3',
  nose: '#2B2B2B',
  collar: '#6FE04A',
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
  far: 600,
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
