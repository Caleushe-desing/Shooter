import * as THREE from 'three'
import { BIRD, COMBAT, ENEMY, OBSTACLES } from '../constants'
import { getEnemyRuntime, getEnemyTargets, resolveEnemyHitPart } from './enemyRuntime'
import { getBirdRuntime, getBirdTargets, resolveBirdId } from './birdRuntime'

type EnemyLike = {
  id: string
  alive: boolean
}

const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _center = new THREE.Vector3()
const _oc = new THREE.Vector3()
const _raycaster = new THREE.Raycaster()

export type EnemyHit = {
  enemyId: string
  distance: number
  point: THREE.Vector3
  head: boolean
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

/**
 * Closest hostile along the aim ray.
 * Primary: mesh raycast against the rendered bodies (exact, detects headshots).
 * Fallback: torso/head spheres from the simulation, for frames where the
 * meshes haven't been registered yet.
 */
export function findClosestEnemyHit(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  enemies: EnemyLike[],
  maxDistance: number = COMBAT.tracerMaxDistance,
): EnemyHit | null {
  _origin.copy(origin)
  _dir.copy(direction).normalize()

  const targets = getEnemyTargets()
  if (targets.length > 0) {
    _raycaster.set(_origin, _dir)
    _raycaster.near = 0.05
    _raycaster.far = maxDistance
    const hits = _raycaster.intersectObjects(targets, true)
    for (const h of hits) {
      const { enemyId, head } = resolveEnemyHitPart(h.object)
      if (!enemyId) continue
      const enemy = enemies.find((e) => e.id === enemyId && e.alive)
      if (!enemy) continue
      return {
        enemyId,
        distance: h.distance,
        point: h.point.clone(),
        head,
      }
    }
  }

  let best: EnemyHit | null = null
  for (const enemy of enemies) {
    if (!enemy.alive) continue
    const rt = getEnemyRuntime(enemy.id)
    if (!rt || rt.deadAt > 0) continue

    _center.set(rt.x, ENEMY.headY, rt.z)
    const tHead = raySphereDistance(_origin, _dir, _center, ENEMY.headRadius, 0.05, maxDistance)
    _center.set(rt.x, ENEMY.torsoY, rt.z)
    const tBody = raySphereDistance(_origin, _dir, _center, ENEMY.torsoRadius, 0.05, maxDistance)

    let t: number | null = null
    let head = false
    if (tHead != null && (tBody == null || tHead <= tBody)) {
      t = tHead
      head = true
    } else if (tBody != null) {
      t = tBody
    }
    if (t == null) continue
    if (best && t >= best.distance) continue

    best = {
      enemyId: enemy.id,
      distance: t,
      head,
      point: new THREE.Vector3(
        _origin.x + _dir.x * t,
        _origin.y + _dir.y * t,
        _origin.z + _dir.z * t,
      ),
    }
  }

  return best
}

export type BirdHit = {
  birdId: string
  distance: number
  point: THREE.Vector3
}

/** Closest bird along the aim ray (mesh raycast, sphere fallback). */
export function findClosestBirdHit(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  birds: EnemyLike[],
  maxDistance: number = COMBAT.tracerMaxDistance,
): BirdHit | null {
  if (birds.length === 0) return null
  _origin.copy(origin)
  _dir.copy(direction).normalize()

  const targets = getBirdTargets()
  if (targets.length > 0) {
    _raycaster.set(_origin, _dir)
    _raycaster.near = 0.05
    _raycaster.far = maxDistance
    const hits = _raycaster.intersectObjects(targets, true)
    for (const h of hits) {
      const birdId = resolveBirdId(h.object)
      if (!birdId) continue
      const bird = birds.find((b) => b.id === birdId && b.alive)
      if (!bird) continue
      return { birdId, distance: h.distance, point: h.point.clone() }
    }
  }

  let best: BirdHit | null = null
  for (const bird of birds) {
    if (!bird.alive) continue
    const rt = getBirdRuntime(bird.id)
    if (!rt || rt.deadAt > 0) continue

    _center.set(rt.x, rt.y, rt.z)
    const t = raySphereDistance(_origin, _dir, _center, BIRD.hitRadius, 0.05, maxDistance)
    if (t == null) continue
    if (best && t >= best.distance) continue

    best = {
      birdId: bird.id,
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

export type CratePierce = {
  enter: THREE.Vector3
  exit: THREE.Vector3
  enterNormal: THREE.Vector3
  exitNormal: THREE.Vector3
  tEnter: number
  tExit: number
}

type Aabb = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

const CRATE_BOXES: Aabb[] = OBSTACLES.map((o) => ({
  minX: o.x - o.w / 2,
  maxX: o.x + o.w / 2,
  minY: 0,
  maxY: o.h,
  minZ: o.z - o.d / 2,
  maxZ: o.z + o.d / 2,
}))

const _nEnter = new THREE.Vector3()
const _nExit = new THREE.Vector3()

/** Ray vs axis-aligned box (slab method). Returns enter/exit distances. */
function rayAabb(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  box: Aabb,
  tMin: number,
  tMax: number,
): { tEnter: number; tExit: number; nEnter: THREE.Vector3; nExit: THREE.Vector3 } | null {
  let t0 = tMin
  let t1 = tMax
  _nEnter.set(0, 0, 0)
  _nExit.set(0, 0, 0)

  const slabs: [number, number, number, number, number][] = [
    [origin.x, dir.x, box.minX, box.maxX, 0],
    [origin.y, dir.y, box.minY, box.maxY, 1],
    [origin.z, dir.z, box.minZ, box.maxZ, 2],
  ]

  for (const [o, d, min, max, axis] of slabs) {
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return null
      continue
    }
    const inv = 1 / d
    let near = (min - o) * inv
    let far = (max - o) * inv
    let nearSign = -1
    let farSign = 1
    if (near > far) {
      const tmp = near
      near = far
      far = tmp
      nearSign = 1
      farSign = -1
    }
    if (near > t0) {
      t0 = near
      _nEnter.set(0, 0, 0)
      if (axis === 0) _nEnter.x = nearSign
      else if (axis === 1) _nEnter.y = nearSign
      else _nEnter.z = nearSign
    }
    if (far < t1) {
      t1 = far
      _nExit.set(0, 0, 0)
      if (axis === 0) _nExit.x = farSign
      else if (axis === 1) _nExit.y = farSign
      else _nExit.z = farSign
    }
    if (t0 > t1) return null
  }

  if (t1 < tMin || t0 > tMax) return null
  return {
    tEnter: Math.max(t0, tMin),
    tExit: Math.min(t1, tMax),
    nEnter: _nEnter.clone(),
    nExit: _nExit.clone(),
  }
}

/**
 * Styrofoam crates never stop bullets — collect all pierce entry/exit points
 * along the aim ray so VFX can punch holes through them.
 */
export function findCratePierces(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  maxDistance: number = COMBAT.tracerMaxDistance,
): CratePierce[] {
  _origin.copy(origin)
  _dir.copy(direction).normalize()
  const pierces: CratePierce[] = []

  for (const box of CRATE_BOXES) {
    const hit = rayAabb(_origin, _dir, box, 0.05, maxDistance)
    if (!hit) continue
    // Need a real traversal through the volume (not a grazing miss).
    if (hit.tExit - hit.tEnter < 0.02) continue
    pierces.push({
      enter: _origin.clone().addScaledVector(_dir, hit.tEnter),
      exit: _origin.clone().addScaledVector(_dir, hit.tExit),
      enterNormal: hit.nEnter,
      exitNormal: hit.nExit,
      tEnter: hit.tEnter,
      tExit: hit.tExit,
    })
  }

  pierces.sort((a, b) => a.tEnter - b.tEnter)
  return pierces
}
