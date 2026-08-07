/** Axis-aligned box for ray tests. */
export type Aabb3 = {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

/** Ray vs AABB. Returns distance along the ray, or null. */
export function rayHitsAabb(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  box: Aabb3,
): number | null {
  const invX = dx !== 0 ? 1 / dx : 1e12
  const invY = dy !== 0 ? 1 / dy : 1e12
  const invZ = dz !== 0 ? 1 / dz : 1e12

  let tmin = ((invX >= 0 ? box.minX : box.maxX) - ox) * invX
  let tmax = ((invX >= 0 ? box.maxX : box.minX) - ox) * invX
  const tymin = ((invY >= 0 ? box.minY : box.maxY) - oy) * invY
  const tymax = ((invY >= 0 ? box.maxY : box.minY) - oy) * invY
  if (tmin > tymax || tymin > tmax) return null
  if (tymin > tmin) tmin = tymin
  if (tymax < tmax) tmax = tymax
  const tzmin = ((invZ >= 0 ? box.minZ : box.maxZ) - oz) * invZ
  const tzmax = ((invZ >= 0 ? box.maxZ : box.minZ) - oz) * invZ
  if (tmin > tzmax || tzmin > tmax) return null
  if (tzmin > tmin) tmin = tzmin
  if (tzmax < tmax) tmax = tzmax
  if (tmax < 0) return null
  const t = tmin >= 0 ? tmin : tmax
  if (t < 0 || t > maxDist) return null
  return t
}

export function nearestAabbHit(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  boxes: Aabb3[],
): number {
  let best = maxDist
  for (const box of boxes) {
    const t = rayHitsAabb(ox, oy, oz, dx, dy, dz, best, box)
    if (t !== null && t < best) best = t
  }
  return best
}
