import * as THREE from 'three'
import { ARENA, CAMERA, OBSTACLES } from '../constants'

type Aabb = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

function buildCameraColliders(): Aabb[] {
  const half = ARENA.size / 2
  const t = ARENA.wallThickness
  const h = ARENA.wallHeight
  // Slightly inflate solids so the lens never sits inside a face.
  const pad = CAMERA.collisionSkin * 0.35

  const walls: Aabb[] = [
    {
      minX: -half - t - pad,
      maxX: half + t + pad,
      minY: -0.2,
      maxY: h + pad,
      minZ: -half - t - pad,
      maxZ: -half + pad,
    },
    {
      minX: -half - t - pad,
      maxX: half + t + pad,
      minY: -0.2,
      maxY: h + pad,
      minZ: half - pad,
      maxZ: half + t + pad,
    },
    {
      minX: -half - t - pad,
      maxX: -half + pad,
      minY: -0.2,
      maxY: h + pad,
      minZ: -half - pad,
      maxZ: half + pad,
    },
    {
      minX: half - pad,
      maxX: half + t + pad,
      minY: -0.2,
      maxY: h + pad,
      minZ: -half - pad,
      maxZ: half + pad,
    },
  ]

  const crates = OBSTACLES.map((o) => ({
    minX: o.x - o.w / 2 - pad,
    maxX: o.x + o.w / 2 + pad,
    minY: -0.05,
    maxY: o.h + pad,
    minZ: o.z - o.d / 2 - pad,
    maxZ: o.z + o.d / 2 + pad,
  }))

  return [...walls, ...crates]
}

const BOXES = buildCameraColliders()

/** Ray vs AABB (slab). Returns enter distance or null. */
function rayAabbEnter(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  box: Aabb,
  tMin: number,
  tMax: number,
): number | null {
  let t0 = tMin
  let t1 = tMax

  const slabs: [number, number, number, number][] = [
    [origin.x, dir.x, box.minX, box.maxX],
    [origin.y, dir.y, box.minY, box.maxY],
    [origin.z, dir.z, box.minZ, box.maxZ],
  ]

  for (const [o, d, min, max] of slabs) {
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return null
      continue
    }
    const inv = 1 / d
    let near = (min - o) * inv
    let far = (max - o) * inv
    if (near > far) {
      const tmp = near
      near = far
      far = tmp
    }
    if (near > t0) t0 = near
    if (far < t1) t1 = far
    if (t0 > t1) return null
  }

  if (t1 < tMin || t0 > tMax) return null
  return Math.max(t0, tMin)
}

/**
 * How far the chase cam may travel from the shoulder pivot before hitting a
 * solid (arena wall or crate). Keeps the pup on screen near walls.
 */
export function maxCameraBoomDistance(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  desiredDistance: number,
): number {
  const dirLen = direction.length()
  if (dirLen < 1e-8) return CAMERA.minDistance
  const dir = direction.clone().multiplyScalar(1 / dirLen)
  const maxDist = Math.max(desiredDistance, CAMERA.minDistance)
  let hit = maxDist

  for (const box of BOXES) {
    const t = rayAabbEnter(origin, dir, box, 0.05, maxDist)
    if (t != null && t < hit) hit = t
  }

  return THREE.MathUtils.clamp(hit - CAMERA.collisionSkin, CAMERA.minDistance, maxDist)
}
