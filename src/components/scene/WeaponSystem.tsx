import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { WEAPON } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import { playGunshot, playImpact, unlockAudio } from '../../audio/gunshot'

type Bullet = {
  id: number
  pos: THREE.Vector3
  dir: THREE.Vector3
  traveled: number
  mesh: THREE.Mesh
}

type Flash = {
  mesh: THREE.Mesh
  light: THREE.PointLight
  age: number
}

type HitSpark = {
  mesh: THREE.Mesh
  age: number
}

type HitBox = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }

const _ndc = new THREE.Vector3()
const _world = new THREE.Vector3()
const _aimPoint = new THREE.Vector3()
const _muzzle = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _camPos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _quat = new THREE.Quaternion()
const _char = new THREE.Vector3()

function rayHitsAabb(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  box: HitBox,
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

function rayHitsFloor(
  _ox: number,
  oy: number,
  _oz: number,
  _dx: number,
  dy: number,
  _dz: number,
  maxDist: number,
): number | null {
  if (dy >= -1e-8) return null
  const t = -oy / dy
  if (t < 0.05 || t > maxDist) return null
  return t
}

function nearestRayHit(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  boxes: HitBox[],
): number {
  let best = maxDist
  for (const box of boxes) {
    const t = rayHitsAabb(ox, oy, oz, dx, dy, dz, best, box)
    if (t !== null && t < best) best = t
  }
  const floorT = rayHitsFloor(ox, oy, oz, dx, dy, dz, best)
  if (floorT !== null && floorT < best) best = floorT
  return best
}

function orientTracer(mesh: THREE.Mesh, dir: THREE.Vector3) {
  _quat.setFromUnitVectors(_up, dir)
  mesh.quaternion.copy(_quat)
}

/** World look direction matching the chase-cam yaw/pitch hierarchy. */
function lookDirection(yaw: number, pitch: number, out: THREE.Vector3) {
  const cp = Math.cos(pitch)
  out.set(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp)
  return out.normalize()
}

type Props = {
  rigRef: React.RefObject<THREE.Group | null>
  lookYaw: MutableRefObject<number>
  lookPitch: MutableRefObject<number>
}

/**
 * TPS gun: camera ray through the mirilla finds the true aim point
 * (what you see under the reticle), then the tracer flies muzzle → that point
 * so impacts land on the crosshair at any range.
 */
export function WeaponSystem({ rigRef, lookYaw, lookPitch }: Props) {
  const { camera, scene, size } = useThree()
  const group = useRef<THREE.Group>(null)
  const bullets = useRef<Bullet[]>([])
  const flashes = useRef<Flash[]>([])
  const sparks = useRef<HitSpark[]>([])
  const cooldown = useRef(0)
  const nextId = useRef(1)

  const tracerGeo = useMemo(() => new THREE.CylinderGeometry(0.028, 0.012, WEAPON.tracerLength, 6), [])
  const tracerMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#FFE566',
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    [],
  )
  const flashGeo = useMemo(() => new THREE.SphereGeometry(0.14, 8, 8), [])
  const flashMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#FFF2A8',
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    [],
  )
  const sparkGeo = useMemo(() => new THREE.SphereGeometry(0.11, 6, 6), [])
  const sparkMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#FF9A3C',
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    [],
  )

  const hitBoxes = useMemo<HitBox[]>(() => {
    const { props } = buildHavenInspiredMap()
    return props
      .filter((p) => p.solid)
      .map((p) => ({
        minX: p.x - p.w / 2,
        minY: p.y - p.h / 2,
        minZ: p.z - p.d / 2,
        maxX: p.x + p.w / 2,
        maxY: p.y + p.h / 2,
        maxZ: p.z + p.d / 2,
      }))
  }, [])

  // Runs after PlayerController (priority -1). Do NOT use priority > 0 —
  // in R3F that opts into manual rendering and skips gl.render.
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    cooldown.current = Math.max(0, cooldown.current - dt)
    const root = group.current
    const parent = scene
    if (!root) return

    const yaw = lookYaw.current
    const pitch = lookPitch.current
    lookDirection(yaw, pitch, _look)
    _forward.set(-Math.sin(yaw), 0, -Math.cos(yaw))
    _right.set(Math.cos(yaw), 0, -Math.sin(yaw))

    const game = useGameStore.getState()
    while (game.consumeFire()) {
      if (cooldown.current > 0) continue
      cooldown.current = WEAPON.cooldown
      unlockAudio()
      playGunshot()

      if (rigRef.current) {
        rigRef.current.updateWorldMatrix(true, true)
        rigRef.current.getWorldPosition(_char)
      } else {
        _char.set(0, 0, 0)
      }

      // Muzzle rides with the character facing (turns when you look left/right).
      _muzzle
        .copy(_char)
        .addScaledVector(_up, WEAPON.muzzleHeight)
        .addScaledVector(_right, WEAPON.muzzleShoulder)
        .addScaledVector(_forward, WEAPON.muzzleForward)

      // 1) Camera ray through the mirilla — this is what the player sees.
      camera.updateWorldMatrix(true, false)
      const firstPerson = useGameStore.getState().cameraMode === 'first'
      const ox = firstPerson ? 0 : WEAPON.crosshairOffsetX
      const oy = firstPerson ? 0 : WEAPON.crosshairOffsetY
      const ndcX = (2 * ox) / Math.max(1, size.width)
      const ndcY = (-2 * oy) / Math.max(1, size.height)
      _ndc.set(ndcX, ndcY, 0.5)
      _world.copy(_ndc).unproject(camera)
      camera.getWorldPosition(_camPos)
      _dir.copy(_world).sub(_camPos)
      if (_dir.lengthSq() < 1e-8) _dir.copy(_look)
      else _dir.normalize()

      // 2) Aim point = first surface under the reticle (or far point).
      //    Using a fixed far point made near-wall hits drift left/down of the mirilla
      //    because muzzle→farPoint ≠ camera→wall under the crosshair.
      const aimT = nearestRayHit(
        _camPos.x,
        _camPos.y,
        _camPos.z,
        _dir.x,
        _dir.y,
        _dir.z,
        WEAPON.aimDistance,
        hitBoxes,
      )
      _aimPoint.copy(_camPos).addScaledVector(_dir, aimT)

      // 3) Tracer leaves the character toward that exact world point.
      _dir.copy(_aimPoint).sub(_muzzle)
      if (_dir.lengthSq() < 1e-8) _dir.copy(_look)
      else _dir.normalize()

      const mesh = new THREE.Mesh(tracerGeo, tracerMat.clone())
      mesh.position.copy(_muzzle)
      orientTracer(mesh, _dir)
      parent.add(mesh)
      bullets.current.push({
        id: nextId.current++,
        pos: _muzzle.clone(),
        dir: _dir.clone(),
        traveled: 0,
        mesh,
      })

      const flashMesh = new THREE.Mesh(flashGeo, flashMat.clone())
      flashMesh.position.copy(_muzzle)
      const light = new THREE.PointLight('#FFE8A0', 5, 7, 2)
      light.position.copy(_muzzle)
      parent.add(flashMesh)
      parent.add(light)
      flashes.current.push({ mesh: flashMesh, light, age: 0 })
    }

    const liveFlashes: Flash[] = []
    for (const f of flashes.current) {
      f.age += dt
      const t = f.age / 0.07
      const mat = f.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1 - t)
      f.mesh.scale.setScalar(1 + t * 2.2)
      f.light.intensity = Math.max(0, 5 * (1 - t))
      if (t >= 1) {
        parent.remove(f.mesh)
        parent.remove(f.light)
        mat.dispose()
      } else {
        liveFlashes.push(f)
      }
    }
    flashes.current = liveFlashes

    const liveSparks: HitSpark[] = []
    for (const s of sparks.current) {
      s.age += dt
      const t = s.age / 0.18
      const mat = s.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1 - t)
      s.mesh.scale.setScalar(1 + t * 1.8)
      if (t >= 1) {
        parent.remove(s.mesh)
        mat.dispose()
      } else {
        liveSparks.push(s)
      }
    }
    sparks.current = liveSparks

    const remain: Bullet[] = []
    for (const b of bullets.current) {
      const step = WEAPON.speed * dt
      let hitT: number | null = null

      for (const box of hitBoxes) {
        const t = rayHitsAabb(b.pos.x, b.pos.y, b.pos.z, b.dir.x, b.dir.y, b.dir.z, step, box)
        if (t !== null && (hitT === null || t < hitT)) {
          hitT = t
        }
      }

      const travel = hitT ?? step
      b.pos.addScaledVector(b.dir, travel)
      b.traveled += travel
      b.mesh.position.copy(b.pos)
      orientTracer(b.mesh, b.dir)

      const hitFloor = b.pos.y <= 0.05
      const dead = hitT !== null || hitFloor || b.traveled >= WEAPON.range
      if (dead) {
        if (hitT !== null || hitFloor) {
          playImpact()
          const spark = new THREE.Mesh(sparkGeo, sparkMat.clone())
          spark.position.copy(b.pos)
          if (hitFloor) spark.position.y = 0.08
          parent.add(spark)
          sparks.current.push({ mesh: spark, age: 0 })
        }
        parent.remove(b.mesh)
        ;(b.mesh.material as THREE.Material).dispose()
      } else {
        remain.push(b)
      }
    }
    bullets.current = remain
  })

  return <group ref={group} />
}
