import * as THREE from 'three'
import { COMBAT } from '../constants'
import { getLivePlatePosition } from './platePositions'
import { getPlateIdFromObject, getPlateTargets } from './plateTargets'

type PlateLike = {
  id: string
  visible: boolean
  position: [number, number, number]
}

const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _center = new THREE.Vector3()
const _oc = new THREE.Vector3()
const _raycaster = new THREE.Raycaster()

export type PlateHit = {
  plateId: string
  distance: number
  point: THREE.Vector3
}

/** Ray vs sphere. */
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

/** Primary: mesh Raycaster. Fallback: generous sphere math. */
export function findClosestPlateHit(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  plates: PlateLike[],
  maxDistance = COMBAT.tracerMaxDistance,
): PlateHit | null {
  _origin.copy(origin)
  _dir.copy(direction).normalize()

  // 1) Precise mesh raycast against registered plate groups
  const targets = getPlateTargets()
  if (targets.length > 0) {
    _raycaster.set(_origin, _dir)
    _raycaster.far = maxDistance
    _raycaster.near = 0.05
    const hits = _raycaster.intersectObjects(targets, true)
    for (const h of hits) {
      const plateId = getPlateIdFromObject(h.object)
      if (!plateId) continue
      const plate = plates.find((p) => p.id === plateId && p.visible)
      if (!plate) continue
      return {
        plateId,
        distance: h.distance,
        point: h.point.clone(),
      }
    }
  }

  // 2) Sphere fallback using live positions
  let best: PlateHit | null = null
  const radius = COMBAT.plateRadius + COMBAT.plateHitPadding

  for (const plate of plates) {
    if (!plate.visible) continue
    const live = getLivePlatePosition(plate.id) ?? plate.position
    _center.set(live[0], live[1], live[2])
    const t = raySphereDistance(_origin, _dir, _center, radius, 0.05, maxDistance)
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

export function tracerSegmentHit(
  origin: [number, number, number],
  direction: [number, number, number],
  prevDist: number,
  nextDist: number,
  plates: PlateLike[],
): PlateHit | null {
  _origin.set(origin[0], origin[1], origin[2])
  _dir.set(direction[0], direction[1], direction[2]).normalize()

  // Advance origin to segment start for mesh raycast window
  const segOrigin = _origin.clone().addScaledVector(_dir, prevDist)
  const segLen = Math.max(nextDist - prevDist, 0.01)

  const targets = getPlateTargets()
  if (targets.length > 0) {
    _raycaster.set(segOrigin, _dir)
    _raycaster.near = 0
    _raycaster.far = segLen + 0.05
    const hits = _raycaster.intersectObjects(targets, true)
    for (const h of hits) {
      const plateId = getPlateIdFromObject(h.object)
      if (!plateId) continue
      const plate = plates.find((p) => p.id === plateId && p.visible)
      if (!plate) continue
      return {
        plateId,
        distance: prevDist + h.distance,
        point: h.point.clone(),
      }
    }
  }

  let best: PlateHit | null = null
  const radius = COMBAT.plateRadius + COMBAT.plateHitPadding
  for (const plate of plates) {
    if (!plate.visible) continue
    const live = getLivePlatePosition(plate.id) ?? plate.position
    _center.set(live[0], live[1], live[2])
    const t = raySphereDistance(
      _origin,
      _dir,
      _center,
      radius,
      Math.max(0, prevDist - 0.05),
      nextDist + 0.05,
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
