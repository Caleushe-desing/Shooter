import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  ENEMY,
  COLLISION,
  clampToArena,
  resolveCircleSolids,
} from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import {
  aliveCount,
  clearEnemies,
  getEnemies,
  pruneDeadEnemies,
  spawnEnemy,
} from '../../combat/enemies'

const MAP_SOLIDS = buildHavenInspiredMap().solids

/**
 * Spawns hostile runners that chase and melee the player.
 * Shared enemy list lives in combat/enemies (WeaponSystem reads it for hits).
 */
export function EnemySystem() {
  const group = useRef<THREE.Group>(null)
  const spawnTimer = useRef(ENEMY.spawnDelay as number)
  const pruneTimer = useRef(0)
  const meshById = useRef(new Map<number, THREE.Group>())
  const lastRunId = useRef(useGameStore.getState().runId)

  const bodyGeo = useMemo(() => new THREE.CapsuleGeometry(ENEMY.radius * 0.85, ENEMY.height - ENEMY.radius * 1.7, 4, 8), [])
  const headGeo = useMemo(() => new THREE.SphereGeometry(ENEMY.radius * 0.55, 8, 8), [])
  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ENEMY.color, roughness: 0.75, metalness: 0.05 }),
    [],
  )
  const headMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ENEMY.eyeColor, roughness: 0.6 }),
    [],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const root = group.current
    if (!root) return

    const game = useGameStore.getState()
    if (game.runId !== lastRunId.current) {
      lastRunId.current = game.runId
      spawnTimer.current = ENEMY.spawnDelay
      for (const mesh of meshById.current.values()) root.remove(mesh)
      meshById.current.clear()
      clearEnemies()
    }

    // Sync meshes for new / dead enemies.
    const list = getEnemies()
    for (const e of list) {
      if (!e.alive) {
        const mesh = meshById.current.get(e.id)
        if (mesh) {
          root.remove(mesh)
          meshById.current.delete(e.id)
        }
        continue
      }
      if (!meshById.current.has(e.id)) {
        const g = new THREE.Group()
        const body = new THREE.Mesh(bodyGeo, bodyMat.clone())
        body.name = 'body'
        body.position.y = ENEMY.height * 0.5
        body.castShadow = true
        const head = new THREE.Mesh(headGeo, headMat.clone())
        head.position.y = ENEMY.height * 0.88
        g.add(body)
        g.add(head)
        root.add(g)
        meshById.current.set(e.id, g)
      }
    }

    if (!game.alive) {
      // Keep meshes posed but freeze AI while dead.
      for (const e of list) {
        if (!e.alive) continue
        const mesh = meshById.current.get(e.id)
        if (!mesh) continue
        mesh.position.set(e.x, e.y, e.z)
        mesh.rotation.y = e.yaw
      }
      return
    }

    // Spawn wave pressure.
    spawnTimer.current -= dt
    if (spawnTimer.current <= 0 && aliveCount() < ENEMY.maxAlive) {
      spawnTimer.current = ENEMY.spawnInterval
      const px = game.playerX
      const pz = game.playerZ
      // Prefer farthest clear spawn from player.
      let best: { x: number; z: number } | null = null
      let bestScore = -1
      for (const s of ENEMY.spawns) {
        const dist = Math.hypot(s.x - px, s.z - pz)
        if (dist < ENEMY.spawnClearance) continue
        // Soft random so waves don't always use the same corner.
        const score = dist + Math.random() * 8
        if (score > bestScore) {
          bestScore = score
          best = s
        }
      }
      if (best) spawnEnemy(best.x, best.z)
    }

    pruneTimer.current += dt
    if (pruneTimer.current > 2.5) {
      pruneTimer.current = 0
      pruneDeadEnemies()
    }

    const px = game.playerX
    const pz = game.playerZ

    for (const e of list) {
      if (!e.alive) continue
      e.attackCd = Math.max(0, e.attackCd - dt)
      e.hitFlash = Math.max(0, e.hitFlash - dt)

      const dx = px - e.x
      const dz = pz - e.z
      const dist = Math.hypot(dx, dz)

      if (dist > 0.08) {
        e.yaw = Math.atan2(-dx, -dz)
      }

      if (dist > ENEMY.attackRange * 0.85) {
        const step = ENEMY.speed * dt
        const inv = dist > 1e-6 ? step / dist : 0
        let nx = e.x + dx * inv
        let nz = e.z + dz * inv
        const bounded = clampToArena(nx, nz, ENEMY.radius)
        nx = bounded.x
        nz = bounded.z
        const hit = resolveCircleSolids(
          nx,
          nz,
          ENEMY.radius,
          MAP_SOLIDS,
          e.y,
          ENEMY.height,
          COLLISION.stepHeight,
        )
        e.x = hit.x
        e.z = hit.z
      } else if (e.attackCd <= 0) {
        e.attackCd = ENEMY.attackCooldown
        useGameStore.getState().damagePlayer(ENEMY.damage)
      }

      const mesh = meshById.current.get(e.id)
      if (!mesh) continue
      mesh.position.set(e.x, e.y, e.z)
      mesh.rotation.y = e.yaw
      const body = mesh.getObjectByName('body') as THREE.Mesh | undefined
      const mat = body?.material as THREE.MeshStandardMaterial | undefined
      if (mat?.isMeshStandardMaterial) {
        if (e.hitFlash > 0) {
          mat.emissive.set('#FF6622')
          mat.emissiveIntensity = 0.85
        } else {
          mat.emissive.set('#000000')
          mat.emissiveIntensity = 0
        }
      }
      // Simple run bob.
      const bob = dist > ENEMY.attackRange ? Math.sin(performance.now() * 0.012 + e.id) * 0.04 : 0
      mesh.position.y = bob
    }
  })

  return <group ref={group} />
}
