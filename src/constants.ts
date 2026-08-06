export const COLORS = {
  black: '#000000',
  neonGreen: '#00FF00',
  white: '#FFFFFF',
  tracer: '#00BFFF',
  /** Daylight environment. */
  sky: '#8FC3EC',
  skyHaze: '#CFE3F2',
  grass: '#3E7A30',
  /** Concrete coping on top of the brick perimeter. */
  wallCap: '#B9B3A6',
  /** Styrofoam / plumavit crate faces + trim (soft, pierceable). */
  wood: '#E8E2D4',
  woodLight: '#F5F1E6',
  woodDark: '#C9C2B0',
  woodEdge: '#9AA3A0',
  foamChip: '#F7F3E8',
  foamHole: '#5A554C',
  /** Solid FPS viewmodel: human skin + gun metal. */
  skin: '#C68642',
  skinLight: '#E0AC69',
  skinShadow: '#8D5524',
  gunMetal: '#2A2E33',
  gunMetalLight: '#4A515A',
  gunSteel: '#6B737C',
  gunGrip: '#1A1410',
  /** Hostile humans that chase the player. */
  enemySkins: ['#C68642', '#8D5524', '#E0AC69', '#5C3A21'] as const,
  enemyShirts: ['#B3202E', '#1E4FA3', '#2E7D32', '#7B1FA2', '#C25E00'] as const,
  enemyPants: ['#1C2430', '#2B2B2B', '#243447', '#3A2C1E'] as const,
  enemyEye: '#FF3B30',
  blood: '#8E0F1A',
  bloodDark: '#4A0710',
  /** Birds flushed out from behind the crates. */
  birdBodies: ['#2E2A26', '#4A3B2E', '#1F2A33', '#5A4632'] as const,
  birdBelly: '#D8CFC0',
  birdBeak: '#E9A13B',
  feather: '#EDE7DA',
  featherDark: '#6B5B49',
} as const

export const PLAYER = {
  eyeHeight: 1.65,
  radius: 0.45,
  speed: 7.5,
  lookSensitivityDesktop: 0.0022,
  lookSensitivityMobile: 0.0034,
  pitchMin: -1.2,
  pitchMax: 1.2,
  spawn: { x: 0, y: 1.65, z: 8 },
  maxHealth: 100,
} as const

/** Hostile humans that hunt the player down. */
export const ENEMY = {
  baseCount: 6,
  perRound: 2,
  maxCount: 16,
  firstSpawnDelayMs: 2200,
  spawnIntervalMs: 2600,
  spawnRingMin: 11,
  spawnRingMax: 13,
  /** Keep spawns this far from the player so nobody appears on top of them. */
  spawnMinPlayerDistance: 9,
  speedMin: 1.15,
  speedMax: 1.75,
  speedPerRound: 0.14,
  radius: 0.42,
  /** Distance at which an enemy grabs the player. */
  grabDistance: 1.25,
  grabDamagePerSec: 16,
  /** Torso / head hit spheres (fallback when mesh raycast misses). */
  torsoY: 1.12,
  torsoRadius: 0.42,
  headY: 1.62,
  headRadius: 0.22,
  pointsPerKill: 150,
  headshotBonus: 100,
  corpseFadeMs: 2800,
  spawnRiseMs: 420,
} as const

export const ARENA = {
  size: 28,
  wallHeight: 4,
  wallThickness: 0.4,
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
  tracerMaxDistance: 55,
  fireCooldownMs: 180,
  explosionFragments: 14,
  /** Foam crate pierce VFX. Holes persist for the whole round. */
  pierceChips: 7,
  pierceHoleMax: 240,
  pierceHoleRadius: 0.06,
} as const

/** Birds that burst out from behind the crates as bonus targets. */
export const BIRD = {
  firstFlockDelayMs: 5000,
  flockIntervalMinMs: 7000,
  flockIntervalMaxMs: 13000,
  flockMin: 2,
  flockMax: 4,
  /** Stagger between birds of the same flock. */
  flockStaggerMs: 130,
  speedMin: 3.4,
  speedMax: 5,
  climbMin: 3.2,
  climbMax: 4.6,
  /** Vertical speed decay so they level off instead of rocketing away. */
  climbDamping: 0.72,
  bobAmplitude: 0.55,
  bobSpeed: 3.4,
  flapSpeed: 17,
  hitRadius: 0.48,
  size: 0.38,
  points: 75,
  maxAltitude: 16,
  maxRange: 34,
  lifetimeMs: 14000,
  featherFadeMs: 1800,
} as const

export type Collider = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Static obstacle boxes (center + half extents on XZ). */
export const OBSTACLES: { x: number; z: number; w: number; d: number; h: number }[] = [
  { x: -6, z: -2, w: 2, d: 2, h: 2.5 },
  { x: 5, z: -5, w: 2.5, d: 2, h: 3 },
  { x: 0, z: -8, w: 3, d: 1.5, h: 2 },
  { x: -8, z: 4, w: 1.8, d: 1.8, h: 2.2 },
  { x: 8, z: 2, w: 2, d: 3, h: 2.8 },
  { x: 3, z: 6, w: 1.5, d: 1.5, h: 1.8 },
  { x: -3, z: -10, w: 2, d: 2, h: 2.4 },
]

export function buildColliders(): Collider[] {
  const half = ARENA.size / 2
  const t = ARENA.wallThickness
  const walls: Collider[] = [
    { minX: -half - t, maxX: half + t, minZ: -half - t, maxZ: -half },
    { minX: -half - t, maxX: half + t, minZ: half, maxZ: half + t },
    { minX: -half - t, maxX: -half, minZ: -half, maxZ: half },
    { minX: half, maxX: half + t, minZ: -half, maxZ: half },
  ]

  const boxes = OBSTACLES.map((o) => ({
    minX: o.x - o.w / 2,
    maxX: o.x + o.w / 2,
    minZ: o.z - o.d / 2,
    maxZ: o.z + o.d / 2,
  }))

  return [...walls, ...boxes]
}

export const COLLIDERS = buildColliders()

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
