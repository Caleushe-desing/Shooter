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
import { takeNextPortal, ensurePortalsForRun } from '../../map/portals'
import {
  clearGhosts,
  getGhosts,
  spawnGhost,
  pruneDeadGhosts,
  aliveGhostCount,
  type Ghost,
} from '../../combat/ghosts'
import { useGameStore } from '../../store/gameStore'
import { createGhostBodyGeometry } from './ghostGeometry'

const MAP_SOLIDS = buildHavenInspiredMap().solids

/**
 * Ghost pursuers: emerge from galaxy portals, walk to replace sites,
 * then patrol / chase. Deaths respawn at the next portal (round-robin).
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
        roughness: 0.28,
        metalness: 0.02,
        transparent: true,
        opacity: 0.88,
        emissive: new THREE.Color('#A8C4F0'),
        emissiveIntensity: 0.55,
        flatShading: false,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  )
  const eyeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: '#FFFFFF',
        emissiveIntensity: 0.4,
        roughness: 0.4,
      }),
    [],
  )
  const pupilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GHOST.eyeColor,
        emissive: GHOST.eyeColor,
        emissiveIntensity: 0.55,
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

    const eyeY = GHOST.height * 0.7
    const eyeX = GHOST.radius * 0.34
    const eyeZ = GHOST.radius * 0.55

    for (const side of [-1, 1] as const) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat)
      eye.position.set(side * eyeX, eyeY, eyeZ)
      group.add(eye)
      const pupil = new THREE.Mesh(pupilGeo, pupilMat)
      pupil.position.set(side * eyeX, eyeY - 0.015, eyeZ + GHOST.radius * 0.1)
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

  const spawnFromPortal = (replaceX: number, replaceZ: number, waypoint: number) => {
    const portal = takeNextPortal()
    spawnGhost(portal.x, portal.z, {
      waypoint,
      replaceX,
      replaceZ,
    })
  }

  const resetAll = () => {
    clearGhosts()
    for (const id of [...meshById.current.keys()]) removeMesh(id)
    ensurePortalsForRun(useGameStore.getState().runId)
    const targets = GHOST.spawns.slice(0, GHOST.count)
    targets.forEach((s, i) => {
      spawnFromPortal(s.x, s.z, i % GHOST.waypoints.length)
    })
    useGameStore.getState().setGhostCount(aliveGhostCount())
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

    // Respawn replacements for any dead ghosts (round-robin portals).
    const before = getGhosts()
    const deaths: { x: number; z: number; waypoint: number }[] = []
    for (const g of before) {
      if (!g.alive) {
        deaths.push({ x: g.x, z: g.z, waypoint: g.waypoint })
        removeMesh(g.id)
      }
    }
    if (deaths.length > 0) {
      pruneDeadGhosts()
      for (const d of deaths) spawnFromPortal(d.x, d.z, d.waypoint)
    }

    const list = getGhosts()
    for (const g of list) ensureMesh(g)

    const count = aliveGhostCount()
    if (count !== game.ghostCount) game.setGhostCount(count)

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

      if (g.stun <= 0) {
        let tx = g.x
        let tz = g.z
        let speed: number = GHOST.patrolSpeed

        if (g.replaceX !== null && g.replaceZ !== null) {
          const rdx = g.replaceX - g.x
          const rdz = g.replaceZ - g.z
          const rd = Math.hypot(rdx, rdz)
          if (rd < 1.1) {
            g.replaceX = null
            g.replaceZ = null
          } else {
            tx = g.x + (rdx / rd) * speed * dt
            tz = g.z + (rdz / rd) * speed * dt
            g.yaw = Math.atan2(-rdx, -rdz)
          }
        } else {
          if (dist < GHOST.visionRange) g.chasing = true
          if (dist > GHOST.loseRange) g.chasing = false

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

      // Only catch once the replacement walk is done.
      if (
        g.replaceX === null &&
        g.stun <= 0 &&
        dist <= GHOST.catchRange
      ) {
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
          mat.emissiveIntensity = g.stun > 0 ? 0.95 : 1.25
          mat.opacity = g.stun > 0 ? 0.5 : 0.95
        } else {
          mat.emissive.set('#A8C4F0')
          mat.emissiveIntensity = g.chasing ? 0.85 : 0.55
          mat.opacity = g.chasing ? 0.95 : 0.88
        }
      }
    }
  })

  return <group ref={root} />
}
