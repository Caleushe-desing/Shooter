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
  /** Base walk speed (m/s). Gait multipliers live in LOCOMOTION. */
  speed: 5.4,
  lookSensitivityDesktop: 0.0022,
  lookSensitivityMobile: 0.0034,
  /**
   * Boom cam at +Z: negative pitch = lens above (look down), positive = lens below (look up).
   */
  pitchMin: -0.72,
  pitchMax: 0.42,
  /** Default look-down so the mira starts on the patio, not the sky. */
  pitchDefault: -0.22,
  spawn: { x: 0, y: 0, z: 5 },
  maxHealth: 100,
  skin: '#C9956E',
  skinLight: '#D8A882',
  skinShadow: '#A87452',
  hair: '#2A1E16',
} as const

export type Stance = 'stand' | 'crouch' | 'prone'

/** Run / walk / crouch / prone / jump tuning. */
export const LOCOMOTION = {
  walk: 1,
  slow: 0.42,
  run: 1.65,
  crouch: 0.38,
  prone: 0.22,
  airControl: 0.72,
  jumpSpeed: 7.2,
  crouchJumpSpeed: 5.6,
  gravity: 18,
  /** Camera pivot heights by stance. */
  camHeight: { stand: 1.85, crouch: 1.15, prone: 0.55 } as const,
  /** Eye / aim height by stance. */
  eyeHeight: { stand: 1.62, crouch: 1.05, prone: 0.38 } as const,
  /** Boom distance scale when crouched / prone (closer). */
  boomScale: { stand: 1, crouch: 0.88, prone: 0.72 } as const,
} as const

/**
 * Back-locked chase cam: stay behind the character so the back is always visible.
 * Tiny shoulder offset keeps a light OTS mira without showing the face.
 */
export const CAMERA = {
  /** Near-center boom — prefer espalda, not perfil. */
  shoulder: 0.42,
  height: 1.85,
  /** Slight lift on the lens so we look down onto the body. */
  lift: 0.28,
  distance: 4.6,
  scopedDistance: 2.2,
  /** Extra look-down on the boom (negative = camera higher, mira on the ground/character). */
  pitchBias: -0.08,
  /** Look ahead along the facing so framing stays on the back / horizon. */
  lookAhead: 1.35,
  /** Snappy follow — less lag means less time seeing the side. */
  followYaw: 16,
  followPitch: 12,
  /** Body snaps to look yaw so the back always faces the camera. */
  bodyTurn: 22,
  boomSpeed: 9,
  collisionPullSpeed: 28,
  minDistance: 1.1,
  collisionSkin: 0.55,
  /** Keep lens above the patio floor (low — flat arena, avoid lookAt sky yank). */
  groundClearance: 0.28,
  near: 0.12,
  far: 120,
  /**
   * Hip-fire reticle — slight OTS while the body still fills the left/back of frame.
   */
  aimLeftPct: 56,
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
  /** Small boxed patio (half-extent on X/Z). */
  size: 22,
  wallHeight: 3.6,
  wallThickness: 0.45,
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

/** Wooden crates / lumber stacks inside the patio. */
export const OBSTACLES: { x: number; z: number; w: number; d: number; h: number }[] = [
  { x: -5.5, z: -3.5, w: 1.8, d: 1.8, h: 1.6 },
  { x: 4.8, z: -6.2, w: 2.2, d: 1.6, h: 2.1 },
  { x: -1.2, z: -7.5, w: 2.6, d: 1.2, h: 1.1 },
  { x: 7.2, z: 1.5, w: 1.5, d: 2.4, h: 1.8 },
  { x: -7.4, z: 3.2, w: 1.7, d: 1.7, h: 2.4 },
  { x: 2.4, z: 6.8, w: 2.0, d: 1.4, h: 1.3 },
  { x: -3.8, z: 7.0, w: 1.4, d: 1.4, h: 0.9 },
  { x: 6.0, z: -2.0, w: 1.2, d: 1.2, h: 2.8 },
  { x: -6.5, z: -7.0, w: 2.4, d: 1.0, h: 0.7 },
]

function buildWallColliders(): Collider[] {
  const half = ARENA.size / 2
  // Thicker than the mesh so fast run frames can't tunnel out.
  const t = Math.max(ARENA.wallThickness, 0.9)
  const inset = 0.15
  return [
    { minX: -half - t, maxX: half + t, minZ: -half - t, maxZ: -half + inset },
    { minX: -half - t, maxX: half + t, minZ: half - inset, maxZ: half + t },
    { minX: -half - t, maxX: -half + inset, minZ: -half, maxZ: half },
    { minX: half - inset, maxX: half + t, minZ: -half, maxZ: half },
  ]
}

/** Keep the player inside the patio even if a frame tunnels a thin wall. */
export function clampToArena(x: number, z: number, radius: number): { x: number; z: number } {
  const limit = ARENA.size / 2 - radius - 0.08
  return {
    x: Math.max(-limit, Math.min(limit, x)),
    z: Math.max(-limit, Math.min(limit, z)),
  }
}

export function buildColliders(): Collider[] {
  const crates = OBSTACLES.map((o) => ({
    minX: o.x - o.w / 2,
    maxX: o.x + o.w / 2,
    minZ: o.z - o.d / 2,
    maxZ: o.z + o.d / 2,
  }))
  return [...crates, ...buildWallColliders()]
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
