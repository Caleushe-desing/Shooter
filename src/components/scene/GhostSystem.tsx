import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  GHOST,
  COLLISION,
  clampToArena,
  resolveCircleSolids,
} from '../../constants'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import {
  clearGhosts,
  getGhosts,
  spawnGhost,
  type Ghost,
} from '../../combat/ghosts'
import { useGameStore } from '../../store/gameStore'
import { createGhostBodyGeometry } from './ghostGeometry'

const MAP_SOLIDS = buildHavenInspiredMap().solids

/**
 * Ghost pursuers: patrol until the player enters vision, then chase.
 * Catching the player triggers Game Over. Hits stun / banish via WeaponSystem.
 */
export function GhostSystem() {
  const root = useRef<THREE.Group>(null)
  const meshById = useRef(new Map<number, THREE.Group>())
  const lastRunId = useRef(useGameStore.getState().runId)

  const bodyGeo = useMemo(
    () => createGhostBodyGeometry(GHOST.radius * 0.95, GHOST.height),
    [],
  )
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(GHOST.radius * 0.16, 8, 8), [])
  const pupilGeo = useMemo(() => new THREE.SphereGeometry(GHOST.radius * 0.07, 6, 6), [])
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GHOST.color,
        roughness: 0.35,
        metalness: 0.05,
        transparent: true,
        opacity: 0.82,
        emissive: GHOST.color,
        emissiveIntensity: 0.22,
        flatShading: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const eyeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#F7FBFF',
        emissive: '#DCEBFF',
        emissiveIntensity: 0.35,
        roughness: 0.45,
      }),
    [],
  )
  const pupilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GHOST.eyeColor,
        emissive: GHOST.eyeColor,
        emissiveIntensity: 0.85,
        roughness: 0.35,
      }),
    [],
  )

  const ensureMesh = (g: Ghost) => {
    const parent = root.current
    if (!parent) return
    if (meshById.current.has(g.id)) return

    const group = new THREE.Group()
    const body = new THREE.Mesh(bodyGeo, bodyMat.clone())
    body.name = 'body'
    body.castShadow = true
    body.receiveShadow = false
    group.add(body)

    const eyeY = GHOST.height * 0.72
    const eyeX = GHOST.radius * 0.32
    const eyeZ = GHOST.radius * 0.72

    for (const side of [-1, 1] as const) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat)
      eye.position.set(side * eyeX, eyeY, eyeZ)
      group.add(eye)
      const pupil = new THREE.Mesh(pupilGeo, pupilMat)
      pupil.position.set(side * eyeX, eyeY - 0.02, eyeZ + GHOST.radius * 0.12)
      group.add(pupil)
    }

    group.position.set(g.x, 0, g.z)
    parent.add(group)
    meshById.current.set(g.id, group)
  }

  const removeMesh = (id: number) => {
    const group = meshById.current.get(id)
    if (!group || !root.current) return
    root.current.remove(group)
    group.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.material && m.material !== bodyMat && m.material !== eyeMat && m.material !== pupilMat) {
        ;(m.material as THREE.Material).dispose()
      }
    })
    meshById.current.delete(id)
  }

  const resetAll = () => {
    clearGhosts()
    for (const id of [...meshById.current.keys()]) removeMesh(id)
    GHOST.spawns.forEach((s, i) => {
      spawnGhost(s.x, s.z, i % GHOST.waypoints.length)
    })
  }

  useEffect(() => {
    resetAll()
    return () => {
      clearGhosts()
      meshById.current.clear()
      bodyGeo.dispose()
      eyeGeo.dispose()
      pupilGeo.dispose()
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const game = useGameStore.getState()

    if (game.runId !== lastRunId.current) {
      lastRunId.current = game.runId
      resetAll()
    }

    const list = getGhosts()
    for (const g of list) ensureMesh(g)

    for (const [id] of meshById.current) {
      const g = list.find((e) => e.id === id)
      if (!g || !g.alive) removeMesh(id)
    }

    if (game.status !== 'playing') return

    const px = game.playerX
    const pz = game.playerZ
    const t = performance.now() * 0.001

    for (const g of list) {
      if (!g.alive) continue
      g.stun = Math.max(0, g.stun - dt)
      g.hitFlash = Math.max(0, g.hitFlash - dt)

      const dx = px - g.x
      const dz = pz - g.z
      const dist = Math.hypot(dx, dz)

      if (dist < GHOST.visionRange) g.chasing = true
      if (dist > GHOST.loseRange) g.chasing = false

      if (g.stun <= 0) {
        let tx = g.x
        let tz = g.z
        let speed: number = GHOST.patrolSpeed

        if (g.chasing && dist > 0.05) {
          speed = GHOST.chaseSpeed
          tx = g.x + (dx / dist) * speed * dt
          tz = g.z + (dz / dist) * speed * dt
          g.yaw = Math.atan2(-dx, -dz)
        } else {
          const wp = GHOST.waypoints[g.waypoint % GHOST.waypoints.length]
          const wdx = wp.x - g.x
          const wdz = wp.z - g.z
          const wd = Math.hypot(wdx, wdz)
          if (wd < 1.2) {
            g.waypoint = (g.waypoint + 1) % GHOST.waypoints.length
          } else {
            tx = g.x + (wdx / wd) * speed * dt
            tz = g.z + (wdz / wd) * speed * dt
            g.yaw = Math.atan2(-wdx, -wdz)
          }
        }

        const bounded = clampToArena(tx, tz, GHOST.radius)
        const hit = resolveCircleSolids(
          bounded.x,
          bounded.z,
          GHOST.radius,
          MAP_SOLIDS,
          0,
          GHOST.height,
          COLLISION.stepHeight,
        )
        g.x = hit.x
        g.z = hit.z
      }

      if (g.stun <= 0 && dist <= GHOST.catchRange) {
        useGameStore.getState().setLost()
      }

      const mesh = meshById.current.get(g.id)
      if (!mesh) continue
      const hover =
        g.stun > 0
          ? 0.08
          : 0.18 + Math.sin(t * 2.4 + g.id) * 0.1
      const sway = g.stun > 0 ? 0 : Math.sin(t * 1.7 + g.id * 0.7) * 0.06
      mesh.position.set(g.x, hover, g.z)
      mesh.rotation.y = g.yaw
      mesh.rotation.z = sway
      mesh.scale.setScalar(g.stun > 0 ? 0.92 : 1)

      const body = mesh.getObjectByName('body') as THREE.Mesh | undefined
      const mat = body?.material as THREE.MeshStandardMaterial | undefined
      if (mat?.isMeshStandardMaterial) {
        if (g.hitFlash > 0 || g.stun > 0) {
          mat.emissive.set(g.stun > 0 ? '#88CCFF' : '#FFAA66')
          mat.emissiveIntensity = g.stun > 0 ? 0.7 : 1.1
          mat.opacity = g.stun > 0 ? 0.55 : 0.9
        } else {
          mat.emissive.set(GHOST.color)
          mat.emissiveIntensity = g.chasing ? 0.45 : 0.22
          mat.opacity = g.chasing ? 0.9 : 0.82
        }
      }
    }
  })

  return <group ref={root} />
}
