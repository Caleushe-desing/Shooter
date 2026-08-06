import * as THREE from 'three'
import { COMBAT } from '../constants'
import { getLivePlatePosition } from './platePositions'

type PlateLike = {
  id: string
  visible: boolean
  position: [number, number, number]
}

const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _center = new THREE.Vector3()
const _oc = new THREE.Vector3()

/** Ray vs sphere. Returns distance along ray or null. */
export function raySphereDistance(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  center: THREE.Vector3,
  radius: number,
  tMin = 0,
  tMax = Infinity,
): number | null {
  _oc.copy(origin).sub(center)
  const b = _oc.dot(dir)
  const c = _oc.dot(_oc) - radius * radius
  const disc = b * b - c
  if (disc < 0) return null
  const s = Math.sqrt(disc)
  const t0 = -b - s
  if (t0 >= tMin && t0 <= tMax) return t0
  const t1 = -b + s
  if (t1 >= tMin && t1 <= tMax) return t1
  return null
}

/**
 * Ray vs floating plate: disc plane test + sphere fallback for edge-on shots.
 */
export function rayPlateDistance(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  plateCenter: THREE.Vector3,
  plateRadius: number,
  tMin = 0,
  tMax = Infinity,
): number | null {
  const radius = plateRadius + COMBAT.plateHitPadding

  // Prefer upright disc plane (plates float mostly flat)
  if (Math.abs(dir.y) > 1e-4) {
    const tPlane = (plateCenter.y - origin.y) / dir.y
    if (tPlane >= tMin && tPlane <= tMax) {
      const hx = origin.x + dir.x * tPlane
      const hz = origin.z + dir.z * tPlane
      const radial = Math.hypot(hx - plateCenter.x, hz - plateCenter.z)
      if (radial <= radius) return tPlane
    }
  }

  // Sphere catch for steep / edge-on trajectories
  return raySphereDistance(origin, dir, plateCenter, radius, tMin, tMax)
}

export type PlateHit = {
  plateId: string
  distance: number
  point: THREE.Vector3
}

export function findClosestPlateHit(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  plates: PlateLike[],
  maxDistance = COMBAT.tracerMaxDistance,
): PlateHit | null {
  _origin.copy(origin)
  _dir.copy(direction).normalize()

  let best: PlateHit | null = null

  for (const plate of plates) {
    if (!plate.visible) continue
    const live = getLivePlatePosition(plate.id) ?? plate.position
    _center.set(live[0], live[1], live[2])

    const t = rayPlateDistance(
      _origin,
      _dir,
      _center,
      COMBAT.plateRadius,
      0.05,
      maxDistance,
    )
    if (t == null) continue
    if (best && t >= best.distance) continue

    best = {
      plateId: plate.id,
      distance: t,
      point: new THREE.Vector3(
        _origin.x + _dir.x * t,
        _origin.y + _dir.y * t,
        _origin.z + _dir.z * t,
      ),
    }
  }

  return best
}

/** Segment test for a tracer travelling from prevDist → nextDist. */
export function tracerSegmentHit(
  origin: [number, number, number],
  direction: [number, number, number],
  prevDist: number,
  nextDist: number,
  plates: PlateLike[],
): PlateHit | null {
  _origin.set(origin[0], origin[1], origin[2])
  _dir.set(direction[0], direction[1], direction[2]).normalize()

  let best: PlateHit | null = null
  for (const plate of plates) {
    if (!plate.visible) continue
    const live = getLivePlatePosition(plate.id) ?? plate.position
    _center.set(live[0], live[1], live[2])
    const t = rayPlateDistance(
      _origin,
      _dir,
      _center,
      COMBAT.plateRadius,
      Math.max(0, prevDist - 0.02),
      nextDist + 0.02,
    )
    if (t == null) continue
    if (best && t >= best.distance) continue
    best = {
      plateId: plate.id,
      distance: t,
      point: new THREE.Vector3(
        _origin.x + _dir.x * t,
        _origin.y + _dir.y * t,
        _origin.z + _dir.z * t,
      ),
    }
  }
  return best
}
