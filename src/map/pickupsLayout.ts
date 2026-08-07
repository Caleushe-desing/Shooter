import { ARENA, type SolidBox } from '../constants'
import { buildHavenInspiredMap } from './havenLayout'

export type Vec2 = { x: number; z: number }

/** Cobble street pads used for pickup placement. */
const STREET_PADS = [
  { x: -28, z: 0, w: 28, d: 36 },
  { x: 28, z: 0, w: 28, d: 36 },
  { x: 0, z: 2, w: 18, d: 52 },
  { x: 0, z: 30, w: 32, d: 22 },
] as const

function pointInSolid(x: number, z: number, solids: SolidBox[], margin = 0.9): boolean {
  for (const s of solids) {
    // Skip walkable pads / low lips — orbs sit on streets and plazas.
    if (s.maxY <= 1.15) continue
    const hw = s.w * 0.5 + margin
    const hd = s.d * 0.5 + margin
    if (Math.abs(x - s.x) <= hw && Math.abs(z - s.z) <= hd) return true
  }
  return false
}

function nearSpawn(x: number, z: number, clear = 4): boolean {
  return Math.hypot(x - 0, z - 10) < clear
}

/**
 * Golden orbs along streets, plazas and corners.
 * Deterministic grid + corner extras.
 */
export function buildOrbSpawns(): Vec2[] {
  const { solids } = buildHavenInspiredMap()
  const orbs: Vec2[] = []
  const seen = new Set<string>()

  const push = (x: number, z: number) => {
    const key = `${x.toFixed(1)},${z.toFixed(1)}`
    if (seen.has(key)) return
    if (nearSpawn(x, z)) return
    const half = ARENA.size / 2 - 2
    if (Math.abs(x) > half || Math.abs(z) > half) return
    if (pointInSolid(x, z, solids, 1.1)) return
    seen.add(key)
    orbs.push({ x, z })
  }

  for (const pad of STREET_PADS) {
    const step = 4.5
    const x0 = pad.x - pad.w * 0.5 + 2.2
    const x1 = pad.x + pad.w * 0.5 - 2.2
    const z0 = pad.z - pad.d * 0.5 + 2.2
    const z1 = pad.z + pad.d * 0.5 - 2.2
    for (let x = x0; x <= x1; x += step) {
      for (let z = z0; z <= z1; z += step) {
        push(x, z)
      }
    }
    // Corners of each plaza
    push(pad.x - pad.w * 0.4, pad.z - pad.d * 0.4)
    push(pad.x + pad.w * 0.4, pad.z - pad.d * 0.4)
    push(pad.x - pad.w * 0.4, pad.z + pad.d * 0.4)
    push(pad.x + pad.w * 0.4, pad.z + pad.d * 0.4)
  }

  // Connector alleys / mid cover
  const extras: Vec2[] = [
    { x: -16, z: 22 },
    { x: 16, z: 22 },
    { x: -6, z: 8 },
    { x: 6, z: 8 },
    { x: 0, z: -8 },
    { x: -20, z: -8 },
    { x: 20, z: -8 },
    { x: 0, z: 18 },
    { x: -12, z: 0 },
    { x: 12, z: 0 },
    { x: -24, z: 12 },
    { x: 24, z: 12 },
    { x: 0, z: 36 },
    { x: -8, z: 28 },
    { x: 8, z: 28 },
  ]
  for (const e of extras) push(e.x, e.z)

  return orbs
}

/** Ammo crates in strategic spots (away from spawn). */
export function buildAmmoSpawns(): Vec2[] {
  const { solids } = buildHavenInspiredMap()
  const candidates: Vec2[] = [
    { x: -28, z: -14 },
    { x: 28, z: -14 },
    { x: -26, z: 14 },
    { x: 26, z: 14 },
    { x: 0, z: -22 },
    { x: -18, z: 30 },
    { x: 18, z: 30 },
    { x: 0, z: 38 },
    { x: -8, z: -4 },
    { x: 8, z: -4 },
  ]
  return candidates.filter((p) => !pointInSolid(p.x, p.z, solids, 1.2) && !nearSpawn(p.x, p.z, 6))
}

export const ORB_SPAWNS = buildOrbSpawns()
export const AMMO_SPAWNS = buildAmmoSpawns()
