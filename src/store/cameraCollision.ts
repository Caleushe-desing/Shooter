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
  // Inflate solids so the lens keeps a clear margin outside the face.
  const pad = CAMERA.collisionSkin

  const walls: Aabb[] = [
    {
      minX: -half - t - pad,
      maxX: half + t + pad,
      minY: -0.5,
      maxY: h + pad,
      minZ: -half - t - pad,
      maxZ: -half + pad,
    },
    {
      minX: -half - t - pad,
      maxX: half + t + pad,
      minY: -0.5,
      maxY: h + pad,
      minZ: half - pad,
      maxZ: half + t + pad,
    },
    {
      minX: -half - t - pad,
      maxX: -half + pad,
      minY: -0.5,
      maxY: h + pad,
      minZ: -half - pad,
      maxZ: half + pad,
    },
    {
      minX: half - pad,
      maxX: half + t + pad,
      minY: -0.5,
      maxY: h + pad,
      minZ: -half - pad,
      maxZ: half + pad,
    },
  ]

  const crates = OBSTACLES.map((o) => ({
    minX: o.x - o.w / 2 - pad,
    maxX: o.x + o.w / 2 + pad,
    minY: -0.2,
    maxY: o.h + pad,
    minZ: o.z - o.d / 2 - pad,
    maxZ: o.z + o.d / 2 + pad,
  }))

  return [...walls, ...crates]
}

const BOXES = buildCameraColliders()

function pointInAabb(p: THREE.Vector3, box: Aabb): boolean {
  return (
    p.x >= box.minX &&
    p.x <= box.maxX &&
    p.y >= box.minY &&
    p.y <= box.maxY &&
    p.z >= box.minZ &&
    p.z <= box.maxZ
  )
}

export function isInsideCameraSolid(point: THREE.Vector3): boolean {
  for (const box of BOXES) {
    if (pointInAabb(point, box)) return true
  }
  return false
}

/** Ray vs AABB (slab). Returns enter distance, or 0 when the origin is inside. */
function rayAabbEnter(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  box: Aabb,
  tMin: number,
  tMax: number,
): number | null {
  let t0 = -Infinity
  let t1 = Infinity

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

  // Origin starts inside this solid — no boom travel allowed on this ray.
  if (t0 < 0 && t1 >= 0) return 0

  if (t1 < tMin || t0 > tMax) return null
  if (t0 < tMin) return null
  return t0
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

  // If the pivot itself is buried in a solid, hug the character.
  if (isInsideCameraSolid(origin)) return CAMERA.minDistance

  let hit = maxDist
  for (const box of BOXES) {
    const t = rayAabbEnter(origin, dir, box, 0, maxDist)
    if (t != null && t < hit) hit = t
  }

  return THREE.MathUtils.clamp(hit, CAMERA.minDistance, maxDist)
}

/**
 * Walk the boom scale down until the lens is outside every solid.
 * Safety net for grazing corners the primary ray can miss.
 */
export function fitCameraScaleOutsideSolids(
  pivot: THREE.Vector3,
  idealLocal: THREE.Vector3,
  pitchMatrixWorld: THREE.Matrix4,
  startScale: number,
): number {
  const idealLen = Math.max(idealLocal.length(), 1e-6)
  const minScale = Math.min(1, CAMERA.minDistance / idealLen)
  let scale = THREE.MathUtils.clamp(startScale, minScale, 1)
  const probe = new THREE.Vector3()

  for (let i = 0; i < 10; i++) {
    probe.copy(idealLocal).multiplyScalar(scale).applyMatrix4(pitchMatrixWorld)
    // Also keep a short segment from pivot→lens clear by testing the midpoint.
    const mid = probe.clone().add(pivot).multiplyScalar(0.5)
    if (!isInsideCameraSolid(probe) && !isInsideCameraSolid(mid)) return scale
    scale = Math.max(minScale, scale * 0.72)
  }
  return minScale
}
