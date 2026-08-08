import { ARENA } from '../constants'

/** Axis-aligned solid used for buildings and collision. */
export type SolidAABB = {
  id: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
}

export type PlazaSpec = {
  radius: number
  height: number
  platformColor: string
  ringColor: string
}

export type ProceduralMap = {
  seed: number
  plaza: PlazaSpec
  solids: SolidAABB[]
  spawn: { x: number; z: number }
}

const BUILDING_COLORS = [
  '#8B7355',
  '#6E7A6B',
  '#9A8B7A',
  '#7A6F5D',
  '#5C6B6E',
  '#A09078',
  '#6B5E52',
  '#7D8A7A',
] as const

export const PLAZA = {
  radius: 9,
  height: 0.18,
  clearMargin: 3.5,
  streetWidth: 5.5,
  platformColor: '#C4B49A',
  ringColor: '#8A7A62',
  flagPoleColor: '#3A3A3A',
  flagColor: '#D94A3D',
} as const

/** Mulberry32 — deterministic PRNG from a 32-bit seed. */
function createRng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function overlaps(a: SolidAABB, b: SolidAABB, gap: number) {
  const aw = a.width * 0.5 + gap
  const ad = a.depth * 0.5 + gap
  const bw = b.width * 0.5 + gap
  const bd = b.depth * 0.5 + gap
  return (
    Math.abs(a.x - b.x) < aw + bw &&
    Math.abs(a.z - b.z) < ad + bd
  )
}

function blocksPlazaOrStreets(solid: SolidAABB, plazaClear: number, streetHalf: number) {
  const hw = solid.width * 0.5
  const hd = solid.depth * 0.5
  const minX = solid.x - hw
  const maxX = solid.x + hw
  const minZ = solid.z - hd
  const maxZ = solid.z + hd

  // Keep a clear disk around the central plaza.
  const nearestX = Math.max(minX, Math.min(0, maxX))
  const nearestZ = Math.max(minZ, Math.min(0, maxZ))
  if (nearestX * nearestX + nearestZ * nearestZ < plazaClear * plazaClear) return true

  // Keep cardinal streets open so the plaza stays reachable.
  const crossesNS = minX < streetHalf && maxX > -streetHalf
  const crossesEW = minZ < streetHalf && maxZ > -streetHalf
  if (crossesNS || crossesEW) return true

  return false
}

/**
 * Build a simple city block layout: solid buildings with walkable streets
 * and a permanently clear central plaza for King of the Hill.
 */
export function generateProceduralMap(seed = (Math.random() * 0xffffffff) >>> 0): ProceduralMap {
  const rng = createRng(seed || 1)
  const half = ARENA.size * 0.5
  const margin = 3
  const plazaClear = PLAZA.radius + PLAZA.clearMargin
  const streetHalf = PLAZA.streetWidth * 0.5
  const streetGap = 2.2

  const solids: SolidAABB[] = []
  const targetCount = 22 + Math.floor(rng() * 8)

  for (let i = 0; i < targetCount * 8 && solids.length < targetCount; i++) {
    const width = 3.2 + rng() * 5.5
    const depth = 3.2 + rng() * 5.5
    const height = 2.4 + rng() * 4.8
    const x = (rng() * 2 - 1) * (half - margin - width * 0.5)
    const z = (rng() * 2 - 1) * (half - margin - depth * 0.5)
    const color = BUILDING_COLORS[Math.floor(rng() * BUILDING_COLORS.length)]!

    const candidate: SolidAABB = {
      id: `b${solids.length}`,
      x,
      z,
      width,
      depth,
      height,
      color,
    }

    if (blocksPlazaOrStreets(candidate, plazaClear, streetHalf)) continue
    if (solids.some((s) => overlaps(s, candidate, streetGap))) continue

    solids.push(candidate)
  }

  // Light outer walls for silhouette — still leave street openings on axes.
  const wallH = 2.2 + rng() * 1.2
  const wallT = 1.4
  const wallLen = ARENA.size - plazaClear * 2
  const wallColor = '#5A5348'
  const wallOffset = half - wallT * 0.5 - 0.4

  const wallCandidates: Omit<SolidAABB, 'id'>[] = [
    { x: 0, z: -wallOffset, width: wallLen * (0.35 + rng() * 0.15), depth: wallT, height: wallH, color: wallColor },
    { x: 0, z: wallOffset, width: wallLen * (0.35 + rng() * 0.15), depth: wallT, height: wallH, color: wallColor },
    { x: -wallOffset, z: 0, width: wallT, depth: wallLen * (0.35 + rng() * 0.15), height: wallH, color: wallColor },
    { x: wallOffset, z: 0, width: wallT, depth: wallLen * (0.35 + rng() * 0.15), height: wallH, color: wallColor },
  ]

  for (const w of wallCandidates) {
    // Shift wall segments off the street axes with a random lateral nudge.
    const nudge = (rng() * 2 - 1) * (half * 0.35)
    const solid: SolidAABB = {
      id: `w${solids.length}`,
      ...w,
      x: w.width > w.depth ? nudge : w.x,
      z: w.depth > w.width ? nudge : w.z,
    }
    if (blocksPlazaOrStreets(solid, plazaClear, streetHalf)) continue
    if (solids.some((s) => overlaps(s, solid, 1))) continue
    solids.push(solid)
  }

  // Spawn just south of the plaza, on the open N–S street.
  const spawn = {
    x: (rng() * 2 - 1) * 1.2,
    z: plazaClear + 1.5 + rng() * 1.5,
  }

  return {
    seed,
    plaza: {
      radius: PLAZA.radius,
      height: PLAZA.height,
      platformColor: PLAZA.platformColor,
      ringColor: PLAZA.ringColor,
    },
    solids,
    spawn,
  }
}

/** Circle (xz) vs AABB solids — returns resolved position. */
export function resolveCircleSolids(
  x: number,
  z: number,
  radius: number,
  solids: readonly SolidAABB[],
) {
  let px = x
  let pz = z
  for (const s of solids) {
    const hw = s.width * 0.5 + radius
    const hd = s.depth * 0.5 + radius
    const dx = px - s.x
    const dz = pz - s.z
    if (Math.abs(dx) >= hw || Math.abs(dz) >= hd) continue

    const ox = hw - Math.abs(dx)
    const oz = hd - Math.abs(dz)
    if (ox < oz) {
      px = s.x + Math.sign(dx || 1) * hw
    } else {
      pz = s.z + Math.sign(dz || 1) * hd
    }
  }
  return { x: px, z: pz }
}
