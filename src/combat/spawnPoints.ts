import {
  ARENA,
  GHOST,
  PLAYER,
  PORTAL,
  type SolidBox,
} from '../constants'
import { buildHavenInspiredMap } from '../map/havenLayout'

const MAP_SOLIDS = buildHavenInspiredMap().solids

function hitsSolid(x: number, z: number, radius: number, solids: readonly SolidBox[]) {
  for (const box of solids) {
    const halfW = box.w * 0.5 + radius
    const halfD = box.d * 0.5 + radius
    if (Math.abs(x - box.x) <= halfW && Math.abs(z - box.z) <= halfD) return true
  }
  return false
}

function isFree(
  x: number,
  z: number,
  placed: { x: number; z: number }[],
  minSep: number,
) {
  const r = GHOST.radius + 0.35
  if (hitsSolid(x, z, r, MAP_SOLIDS)) return false
  if (Math.hypot(x - PLAYER.spawn.x, z - PLAYER.spawn.z) < GHOST.clearPlayer) return false
  if (Math.hypot(x - PORTAL.x, z - PORTAL.z) < PORTAL.radius + 2) return false
  for (const p of placed) {
    if (Math.hypot(x - p.x, z - p.z) < minSep) return false
  }
  return true
}

/** Pick N random free spots on the arena for initial ghost placement. */
export function randomGhostSpawns(count: number): { x: number; z: number }[] {
  const half = ARENA.size / 2 - 6
  const placed: { x: number; z: number }[] = []

  for (let i = 0; i < count; i++) {
    let found = false
    for (let attempt = 0; attempt < 80; attempt++) {
      const x = (Math.random() * 2 - 1) * half
      const z = (Math.random() * 2 - 1) * half
      if (!isFree(x, z, placed, GHOST.minSeparation)) continue
      placed.push({ x, z })
      found = true
      break
    }
    if (!found) {
      // Fallback ring around mid so we always place all 8.
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const rad = 14 + (i % 3) * 6
      placed.push({
        x: Math.cos(a) * rad,
        z: Math.sin(a) * rad,
      })
    }
  }

  return placed
}
