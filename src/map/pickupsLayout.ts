import { ARENA, PICKUPS, findSupportY, type SolidBox } from '../constants'
import { buildHavenInspiredMap } from './havenLayout'

export type Vec2 = { x: number; z: number }
export type AmmoSpawn = { x: number; y: number; z: number }

function pointInTallSolid(x: number, z: number, solids: SolidBox[], margin = 0.9): boolean {
  for (const s of solids) {
    if (s.maxY <= 1.15) continue
    const hw = s.w * 0.5 + margin
    const hd = s.d * 0.5 + margin
    if (Math.abs(x - s.x) <= hw && Math.abs(z - s.z) <= hd) return true
  }
  return false
}

function nearSpawn(x: number, z: number, clear = 5): boolean {
  return Math.hypot(x - 0, z - 10) < clear
}

/**
 * Hidden ammo crates scattered on streets, alleys, roofs and decks.
 * Heights snap to walkable support so crates sit on stairs / ledges.
 */
export function buildAmmoSpawns(count = PICKUPS.ammoCount): AmmoSpawn[] {
  const { solids } = buildHavenInspiredMap()
  const half = ARENA.size / 2 - 3
  const candidates: Vec2[] = [
    // Street / plaza hideouts
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
    { x: -22, z: 2 },
    { x: 22, z: 2 },
    { x: -14, z: 18 },
    { x: 14, z: 18 },
    { x: -32, z: 8 },
    { x: 32, z: 8 },
    { x: -10, z: 34 },
    { x: 10, z: 34 },
    { x: -4, z: -16 },
    { x: 4, z: -16 },
    { x: -20, z: -20 },
    { x: 20, z: -20 },
    { x: 0, z: 22 },
    { x: -16, z: -10 },
    { x: 16, z: -10 },
    // Elevated / cover-ish spots
    { x: -12, z: 8 },
    { x: 12, z: 8 },
    { x: -24, z: 24 },
    { x: 24, z: 24 },
    { x: 0, z: -8 },
    { x: -30, z: -6 },
    { x: 30, z: -6 },
  ]

  // Fill with jittered extras so crates feel hidden, not on rails.
  for (let i = 0; i < 40; i++) {
    const ang = (i / 40) * Math.PI * 2
    const rad = 10 + (i % 5) * 5
    candidates.push({
      x: Math.cos(ang) * rad + ((i * 3) % 5) - 2,
      z: Math.sin(ang) * rad + ((i * 7) % 5) - 2,
    })
  }

  const out: AmmoSpawn[] = []
  const seen = new Set<string>()

  for (const c of candidates) {
    if (out.length >= count) break
    const x = Math.max(-half, Math.min(half, c.x))
    const z = Math.max(-half, Math.min(half, c.z))
    if (nearSpawn(x, z, 6)) continue
    if (pointInTallSolid(x, z, solids, 1.15)) continue
    const key = `${x.toFixed(0)},${z.toFixed(0)}`
    if (seen.has(key)) continue
    // Reject if too close to another crate.
    let close = false
    for (const a of out) {
      if (Math.hypot(a.x - x, a.z - z) < 5.5) {
        close = true
        break
      }
    }
    if (close) continue
    const y = findSupportY(x, z, 2.5, 0.35, solids, 2.8)
    seen.add(key)
    out.push({ x, y, z })
  }

  // Deterministic fallbacks if filters were too strict.
  while (out.length < Math.min(count, 10)) {
    const a = (out.length / 10) * Math.PI * 2
    const x = Math.cos(a) * 18
    const z = Math.sin(a) * 18
    const y = findSupportY(x, z, 2.5, 0.35, solids, 2.8)
    out.push({ x, y, z })
  }

  return out
}

export const AMMO_SPAWNS = buildAmmoSpawns()
