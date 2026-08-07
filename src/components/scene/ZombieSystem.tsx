import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  ZOMBIE,
  COLLISION,
  clampToArena,
  resolveCircleSolids,
} from '../../constants'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import {
  clearZombies,
  getZombies,
  spawnZombie,
  type Zombie,
} from '../../combat/zombies'
import { useGameStore } from '../../store/gameStore'

const MAP_SOLIDS = buildHavenInspiredMap().solids

/**
 * Zombie pursuers: patrol until the player enters vision, then chase.
 * Catching the player triggers Game Over. Hits stun / kill via WeaponSystem.
 */
export function ZombieSystem() {
  const root = useRef<THREE.Group>(null)
  const meshById = useRef(new Map<number, THREE.Group>())
  const lastRunId = useRef(useGameStore.getState().runId)

  const bodyGeo = useMemo(
    () => new THREE.CapsuleGeometry(ZOMBIE.radius * 0.75, ZOMBIE.height - ZOMBIE.radius * 1.6, 3, 6),
    [],
  )
  const headGeo = useMemo(() => new THREE.SphereGeometry(ZOMBIE.radius * 0.5, 6, 6), [])
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ZOMBIE.color,
        roughness: 0.9,
        metalness: 0.05,
        wireframe: false,
        flatShading: true,
      }),
    [],
  )
  const eyeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ZOMBIE.eyeColor,
        emissive: ZOMBIE.eyeColor,
        emissiveIntensity: 0.9,
        roughness: 0.4,
      }),
    [],
  )

  const ensureMesh = (z: Zombie) => {
    const parent = root.current
    if (!parent) return
    if (meshById.current.has(z.id)) return
    const g = new THREE.Group()
    const body = new THREE.Mesh(bodyGeo, bodyMat.clone())
    body.name = 'body'
    body.position.y = ZOMBIE.height * 0.48
    body.castShadow = true
    const head = new THREE.Mesh(headGeo, eyeMat.clone())
    head.name = 'head'
    head.position.y = ZOMBIE.height * 0.9
    g.add(body)
    g.add(head)
    g.position.set(z.x, 0, z.z)
    parent.add(g)
    meshById.current.set(z.id, g)
  }

  const removeMesh = (id: number) => {
    const g = meshById.current.get(id)
    if (!g || !root.current) return
    root.current.remove(g)
    g.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.material && m.material !== bodyMat && m.material !== eyeMat) {
        ;(m.material as THREE.Material).dispose()
      }
    })
    meshById.current.delete(id)
  }

  const resetAll = () => {
    clearZombies()
    for (const id of [...meshById.current.keys()]) removeMesh(id)
    ZOMBIE.spawns.forEach((s, i) => {
      spawnZombie(s.x, s.z, i % ZOMBIE.waypoints.length)
    })
  }

  useEffect(() => {
    resetAll()
    return () => {
      clearZombies()
      meshById.current.clear()
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const game = useGameStore.getState()

    if (game.runId !== lastRunId.current) {
      lastRunId.current = game.runId
      resetAll()
    }

    const list = getZombies()
    for (const z of list) ensureMesh(z)

    // Remove meshes for dead zombies
    for (const [id] of meshById.current) {
      const z = list.find((e) => e.id === id)
      if (!z || !z.alive) removeMesh(id)
    }

    if (game.status !== 'playing') return

    const px = game.playerX
    const pz = game.playerZ

    for (const z of list) {
      if (!z.alive) continue
      z.stun = Math.max(0, z.stun - dt)
      z.hitFlash = Math.max(0, z.hitFlash - dt)

      const dx = px - z.x
      const dz = pz - z.z
      const dist = Math.hypot(dx, dz)

      if (dist < ZOMBIE.visionRange) z.chasing = true
      if (dist > ZOMBIE.loseRange) z.chasing = false

      if (z.stun <= 0) {
        let tx = z.x
        let tz = z.z
        let speed: number = ZOMBIE.patrolSpeed

        if (z.chasing && dist > 0.05) {
          speed = ZOMBIE.chaseSpeed
          tx = z.x + (dx / dist) * speed * dt
          tz = z.z + (dz / dist) * speed * dt
          z.yaw = Math.atan2(-dx, -dz)
        } else {
          const wp = ZOMBIE.waypoints[z.waypoint % ZOMBIE.waypoints.length]
          const wdx = wp.x - z.x
          const wdz = wp.z - z.z
          const wd = Math.hypot(wdx, wdz)
          if (wd < 1.2) {
            z.waypoint = (z.waypoint + 1) % ZOMBIE.waypoints.length
          } else {
            tx = z.x + (wdx / wd) * speed * dt
            tz = z.z + (wdz / wd) * speed * dt
            z.yaw = Math.atan2(-wdx, -wdz)
          }
        }

        const bounded = clampToArena(tx, tz, ZOMBIE.radius)
        const hit = resolveCircleSolids(
          bounded.x,
          bounded.z,
          ZOMBIE.radius,
          MAP_SOLIDS,
          0,
          ZOMBIE.height,
          COLLISION.stepHeight,
        )
        z.x = hit.x
        z.z = hit.z
      }

      if (z.stun <= 0 && dist <= ZOMBIE.catchRange) {
        useGameStore.getState().setLost()
      }

      const mesh = meshById.current.get(z.id)
      if (!mesh) continue
      const bob =
        z.stun > 0 ? 0 : Math.sin(performance.now() * 0.01 + z.id) * 0.04
      mesh.position.set(z.x, bob, z.z)
      mesh.rotation.y = z.yaw
      const body = mesh.getObjectByName('body') as THREE.Mesh | undefined
      const mat = body?.material as THREE.MeshStandardMaterial | undefined
      if (mat?.isMeshStandardMaterial) {
        if (z.hitFlash > 0 || z.stun > 0) {
          mat.emissive.set(z.stun > 0 ? '#88AACC' : '#FF6622')
          mat.emissiveIntensity = z.stun > 0 ? 0.55 : 0.85
        } else {
          mat.emissive.set('#000000')
          mat.emissiveIntensity = 0
        }
      }
    }
  })

  return <group ref={root} />
}
