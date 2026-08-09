import { ARENA, ENEMY, PLAYER, type SolidBox } from '../constants'
import { buildHavenInspiredMap } from '../map/havenLayout'
import { ORB_SPAWNS } from '../map/pickupsLayout'

const MAP_SOLIDS = buildHavenInspiredMap().solids

function hitsSolid(x: number, z: number, radius: number, solids: readonly SolidBox[]) {
  for (const box of solids) {
    if (box.maxY <= 1.1) continue
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
  const r = ENEMY.radius + 0.35
  if (hitsSolid(x, z, r, MAP_SOLIDS)) return false
  if (Math.hypot(x - PLAYER.spawn.x, z - PLAYER.spawn.z) < ENEMY.clearPlayer) return false
  for (const p of placed) {
    if (Math.hypot(x - p.x, z - p.z) < minSep) return false
  }
  return true
}

/** Prefer spots near orbs so hunters start as orb guards. */
export function randomEnemySpawns(count: number): { x: number; z: number }[] {
  const half = ARENA.size / 2 - 6
  const placed: { x: number; z: number }[] = []
  const orbPool = ORB_SPAWNS.length > 0 ? ORB_SPAWNS : [{ x: 0, z: -8 }]

  for (let i = 0; i < count; i++) {
    let found = false
    const orb = orbPool[i % orbPool.length]
    for (let attempt = 0; attempt < 60; attempt++) {
      const ang = Math.random() * Math.PI * 2
      const rad = 3 + Math.random() * 5
      const x = orb.x + Math.cos(ang) * rad
      const z = orb.z + Math.sin(ang) * rad
      if (Math.abs(x) > half || Math.abs(z) > half) continue
      if (!isFree(x, z, placed, ENEMY.minSeparation)) continue
      placed.push({ x, z })
      found = true
      break
    }
    if (!found) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const x = (Math.random() * 2 - 1) * half
        const z = (Math.random() * 2 - 1) * half
        if (!isFree(x, z, placed, ENEMY.minSeparation)) continue
        placed.push({ x, z })
        found = true
        break
      }
    }
    if (!found) {
      const a = (i / count) * Math.PI * 2
      const rad = 16 + (i % 3) * 5
      placed.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad })
    }
  }

  return placed
}

/**
 * Pick a random walkable patrol point. Prefers points away from the hunter's
 * current position so they actually roam.
 */
export function randomPatrolPoint(
  fromX: number,
  fromZ: number,
  minDist = 6,
  maxDist = 22,
): { x: number; z: number } {
  const half = ARENA.size / 2 - 4
  const rClear = ENEMY.radius + 0.45

  for (let attempt = 0; attempt < 40; attempt++) {
    const ang = Math.random() * Math.PI * 2
    const rad = minDist + Math.random() * (maxDist - minDist)
    const x = fromX + Math.cos(ang) * rad
    const z = fromZ + Math.sin(ang) * rad
    if (Math.abs(x) > half || Math.abs(z) > half) continue
    if (hitsSolid(x, z, rClear, MAP_SOLIDS)) continue
    return { x, z }
  }

  // Fallback: any free spot in the arena.
  for (let attempt = 0; attempt < 50; attempt++) {
    const x = (Math.random() * 2 - 1) * half
    const z = (Math.random() * 2 - 1) * half
    if (hitsSolid(x, z, rClear, MAP_SOLIDS)) continue
    return { x, z }
  }

  return { x: fromX + 4, z: fromZ - 3 }
}
