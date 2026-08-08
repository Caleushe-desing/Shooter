import { PLAYER } from '../constants'
import type { SolidAABB, Trench } from './proceduralLayout'

export type CapsuleState = {
  x: number
  y: number
  z: number
  velY: number
  grounded: boolean
}

function solidMinY(s: SolidAABB) {
  return s.y
}

function solidMaxY(s: SolidAABB) {
  return s.y + s.height
}

function circleHitsSolid(
  x: number,
  z: number,
  radius: number,
  s: SolidAABB,
) {
  const hw = s.width * 0.5 + radius
  const hd = s.depth * 0.5 + radius
  return Math.abs(x - s.x) < hw && Math.abs(z - s.z) < hd
}

/** Push a circle out of an xz footprint (no height check). */
function pushOutSolid(x: number, z: number, radius: number, s: SolidAABB) {
  const hw = s.width * 0.5 + radius
  const hd = s.depth * 0.5 + radius
  const dx = x - s.x
  const dz = z - s.z
  if (Math.abs(dx) >= hw || Math.abs(dz) >= hd) return { x, z }

  const ox = hw - Math.abs(dx)
  const oz = hd - Math.abs(dz)
  if (ox < oz) {
    return { x: s.x + Math.sign(dx || 1) * hw, z }
  }
  return { x, z: s.z + Math.sign(dz || 1) * hd }
}

/**
 * Horizontal resolve against solids that vertically overlap the capsule body.
 * Surfaces near foot height within stepHeight are treated as walkable lips (not walls).
 */
export function resolveHorizontal(
  x: number,
  z: number,
  feetY: number,
  radius: number,
  bodyHeight: number,
  solids: readonly SolidAABB[],
  stepHeight = PLAYER.stepHeight,
) {
  let px = x
  let pz = z
  const bodyMin = feetY + stepHeight
  const bodyMax = feetY + bodyHeight

  for (const s of solids) {
    const minY = solidMinY(s)
    const maxY = solidMaxY(s)
    // Walkable top: if standing / stepping onto this surface, skip wall push.
    if (maxY <= feetY + stepHeight + 0.02 && maxY >= feetY - 0.35) continue
    // No vertical overlap with body → ignore.
    if (maxY <= bodyMin || minY >= bodyMax) continue
    if (!circleHitsSolid(px, pz, radius, s)) continue
    const out = pushOutSolid(px, pz, radius, s)
    px = out.x
    pz = out.z
  }
  return { x: px, z: pz }
}

function trenchFloorAt(x: number, z: number, radius: number, trenches: readonly Trench[]) {
  let best: number | null = null
  for (const t of trenches) {
    const hw = t.width * 0.5 - radius * 0.15
    const hd = t.depth * 0.5 - radius * 0.15
    if (Math.abs(x - t.x) <= hw && Math.abs(z - t.z) <= hd) {
      if (best === null || t.floorY > best) best = t.floorY
    }
  }
  return best
}

/**
 * Highest walkable support under the player capsule (roofs, crates, floors, trench, ground).
 */
export function findSupportY(
  x: number,
  z: number,
  radius: number,
  feetY: number,
  solids: readonly SolidAABB[],
  trenches: readonly Trench[],
  groundY = 0,
) {
  let support = groundY
  const trenchY = trenchFloorAt(x, z, radius, trenches)
  if (trenchY !== null) support = trenchY

  const probeTop = feetY + 0.55
  const probeBot = feetY - 1.25

  for (const s of solids) {
    if (!s.walkable) continue
    if (!circleHitsSolid(x, z, radius * 0.85, s)) continue
    const top = solidMaxY(s)
    if (top > probeTop) continue
    if (top < probeBot) continue
    if (top > support) support = top
  }

  return support
}

/**
 * Integrate vertical motion: gravity, landing on AABB tops / trench floors / ground.
 * Also prevents standing inside a solid by snapping up onto its top when embedded shallowly.
 */
export function integrateVertical(
  state: CapsuleState,
  dt: number,
  solids: readonly SolidAABB[],
  trenches: readonly Trench[],
  gravity: number,
  radius: number,
) {
  let { x, y, z, velY, grounded } = state
  const support = findSupportY(x, z, radius, y, solids, trenches)

  if (grounded && velY <= 0) {
    // Walk off edges → start falling.
    if (y - support > 0.08) {
      grounded = false
    } else {
      y = support
      velY = 0
      grounded = true
      return { x, y, z, velY, grounded }
    }
  }

  velY -= gravity * dt
  y += velY * dt

  const supportNow = findSupportY(x, z, radius, y, solids, trenches)
  if (velY <= 0 && y <= supportNow + 0.02) {
    y = supportNow
    velY = 0
    grounded = true
  } else {
    grounded = false
  }

  // Ceiling: hit underside of a solid above the head.
  const headY = y + PLAYER.height
  for (const s of solids) {
    const minY = solidMinY(s)
    const maxY = solidMaxY(s)
    if (!circleHitsSolid(x, z, radius * 0.9, s)) continue
    if (velY > 0 && headY > minY && y < minY) {
      y = minY - PLAYER.height
      velY = 0
    }
    // Embedded inside a solid volume → push to nearest exit (prefer top if close).
    if (y + 0.05 < maxY && headY > minY + 0.05 && y > minY - 0.01) {
      const toTop = maxY - y
      const toBottom = headY - minY
      if (toTop < toBottom && toTop < 1.1) {
        y = maxY
        velY = 0
        grounded = true
      }
    }
  }

  return { x, y, z, velY, grounded }
}

/**
 * Ray vs AABB solids. Returns the nearest hit distance along a unit direction,
 * or null if nothing is hit within maxDist.
 */
export function raycastSolids(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  solids: readonly SolidAABB[],
): number | null {
  let nearest: number | null = null

  for (const s of solids) {
    const minX = s.x - s.width * 0.5
    const maxX = s.x + s.width * 0.5
    const minY = solidMinY(s)
    const maxY = solidMaxY(s)
    const minZ = s.z - s.depth * 0.5
    const maxZ = s.z + s.depth * 0.5

    let tmin = 0
    let tmax = maxDist

    // X slab
    if (Math.abs(dx) < 1e-8) {
      if (ox < minX || ox > maxX) continue
    } else {
      let t1 = (minX - ox) / dx
      let t2 = (maxX - ox) / dx
      if (t1 > t2) {
        const tmp = t1
        t1 = t2
        t2 = tmp
      }
      tmin = Math.max(tmin, t1)
      tmax = Math.min(tmax, t2)
      if (tmin > tmax) continue
    }

    // Y slab
    if (Math.abs(dy) < 1e-8) {
      if (oy < minY || oy > maxY) continue
    } else {
      let t1 = (minY - oy) / dy
      let t2 = (maxY - oy) / dy
      if (t1 > t2) {
        const tmp = t1
        t1 = t2
        t2 = tmp
      }
      tmin = Math.max(tmin, t1)
      tmax = Math.min(tmax, t2)
      if (tmin > tmax) continue
    }

    // Z slab
    if (Math.abs(dz) < 1e-8) {
      if (oz < minZ || oz > maxZ) continue
    } else {
      let t1 = (minZ - oz) / dz
      let t2 = (maxZ - oz) / dz
      if (t1 > t2) {
        const tmp = t1
        t1 = t2
        t2 = tmp
      }
      tmin = Math.max(tmin, t1)
      tmax = Math.min(tmax, t2)
      if (tmin > tmax) continue
    }

    if (tmin >= 0 && tmin <= maxDist) {
      if (nearest === null || tmin < nearest) nearest = tmin
    }
  }

  return nearest
}
