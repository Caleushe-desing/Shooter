import { useMemo, useRef } from 'react'
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
const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _quat = new THREE.Quaternion()

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

function orientTracer(mesh: THREE.Mesh, dir: THREE.Vector3) {
  _quat.setFromUnitVectors(_up, dir)
  mesh.quaternion.copy(_quat)
}

/**
 * Visible tracers + muzzle flash + gunshot/impact audio.
 * Aimed through the off-center TPS crosshair (WEAPON.ndc*).
 */
export function WeaponSystem() {
  const { camera } = useThree()
  const group = useRef<THREE.Group>(null)
  const bullets = useRef<Bullet[]>([])
  const flashes = useRef<Flash[]>([])
  const sparks = useRef<HitSpark[]>([])
  const cooldown = useRef(0)
  const nextId = useRef(1)

  const tracerGeo = useMemo(() => new THREE.CylinderGeometry(0.04, 0.018, 1.35, 6), [])
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
  const flashGeo = useMemo(() => new THREE.SphereGeometry(0.16, 8, 8), [])
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
  const sparkGeo = useMemo(() => new THREE.SphereGeometry(0.12, 6, 6), [])
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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    cooldown.current = Math.max(0, cooldown.current - dt)
    if (!group.current) return

    const game = useGameStore.getState()
    while (game.consumeFire()) {
      if (cooldown.current > 0) continue
      cooldown.current = WEAPON.cooldown
      unlockAudio()
      playGunshot()

      _ndc.set(WEAPON.ndcX, WEAPON.ndcY, 0.5)
      _world.copy(_ndc).unproject(camera)
      _dir.copy(_world).sub(camera.position).normalize()
      _origin.copy(camera.position).addScaledVector(_dir, WEAPON.muzzleForward)

      // Bright elongated tracer
      const mesh = new THREE.Mesh(tracerGeo, tracerMat.clone())
      mesh.position.copy(_origin)
      orientTracer(mesh, _dir)
      group.current.add(mesh)
      bullets.current.push({
        id: nextId.current++,
        pos: _origin.clone(),
        dir: _dir.clone(),
        traveled: 0,
        mesh,
      })

      // Muzzle flash at shot origin
      const flashMesh = new THREE.Mesh(flashGeo, flashMat.clone())
      flashMesh.position.copy(_origin)
      const light = new THREE.PointLight('#FFE8A0', 4.5, 8, 2)
      light.position.copy(_origin)
      group.current.add(flashMesh)
      group.current.add(light)
      flashes.current.push({ mesh: flashMesh, light, age: 0 })
    }

    // Update flashes
    const liveFlashes: Flash[] = []
    for (const f of flashes.current) {
      f.age += dt
      const t = f.age / 0.07
      const mat = f.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1 - t)
      f.mesh.scale.setScalar(1 + t * 2.2)
      f.light.intensity = Math.max(0, 4.5 * (1 - t))
      if (t >= 1) {
        group.current.remove(f.mesh)
        group.current.remove(f.light)
        mat.dispose()
      } else {
        liveFlashes.push(f)
      }
    }
    flashes.current = liveFlashes

    // Update sparks
    const liveSparks: HitSpark[] = []
    for (const s of sparks.current) {
      s.age += dt
      const t = s.age / 0.18
      const mat = s.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1 - t)
      s.mesh.scale.setScalar(1 + t * 1.8)
      if (t >= 1) {
        group.current.remove(s.mesh)
        mat.dispose()
      } else {
        liveSparks.push(s)
      }
    }
    sparks.current = liveSparks

    // Update bullets
    const remain: Bullet[] = []
    for (const b of bullets.current) {
      const step = WEAPON.speed * dt
      let hitT: number | null = null
      for (const box of hitBoxes) {
        const t = rayHitsAabb(b.pos.x, b.pos.y, b.pos.z, b.dir.x, b.dir.y, b.dir.z, step, box)
        if (t !== null && (hitT === null || t < hitT)) hitT = t
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
          group.current.add(spark)
          sparks.current.push({ mesh: spark, age: 0 })
        }
        group.current.remove(b.mesh)
        ;(b.mesh.material as THREE.Material).dispose()
      } else {
        remain.push(b)
      }
    }
    bullets.current = remain
  })

  return <group ref={group} />
}
