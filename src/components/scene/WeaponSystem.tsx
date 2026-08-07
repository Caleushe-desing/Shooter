import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { WEAPON } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { buildHavenInspiredMap } from '../../map/havenLayout'

type Bullet = {
  id: number
  pos: THREE.Vector3
  dir: THREE.Vector3
  traveled: number
  mesh: THREE.Mesh
}

type HitBox = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }

const _ndc = new THREE.Vector3()
const _world = new THREE.Vector3()
const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()

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

/**
 * Tracers aimed through the off-center TPS crosshair (WEAPON.ndc*).
 */
export function WeaponSystem() {
  const { camera } = useThree()
  const group = useRef<THREE.Group>(null)
  const bullets = useRef<Bullet[]>([])
  const cooldown = useRef(0)
  const nextId = useRef(1)
  const geo = useMemo(() => new THREE.SphereGeometry(WEAPON.tracerRadius, 6, 6), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#F2E08A' }), [])

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

      _ndc.set(WEAPON.ndcX, WEAPON.ndcY, 0.5)
      _world.copy(_ndc).unproject(camera)
      _dir.copy(_world).sub(camera.position).normalize()
      _origin.copy(camera.position).addScaledVector(_dir, WEAPON.muzzleForward)

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(_origin)
      group.current.add(mesh)
      bullets.current.push({
        id: nextId.current++,
        pos: _origin.clone(),
        dir: _dir.clone(),
        traveled: 0,
        mesh,
      })
    }

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

      const dead = hitT !== null || b.pos.y <= 0.05 || b.traveled >= WEAPON.range
      if (dead) {
        group.current.remove(b.mesh)
      } else {
        remain.push(b)
      }
    }
    bullets.current = remain
  })

  return <group ref={group} />
}
