import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  GHOST,
  COLLISION,
  PORTAL,
  clampToArena,
  resolveCircleSolids,
  hasLineOfSight,
} from '../../constants'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import {
  clearGhosts,
  getGhosts,
  spawnGhost,
  pruneDeadGhosts,
  aliveGhostCount,
  alertGhost,
  type Ghost,
} from '../../combat/ghosts'
import { useGameStore } from '../../store/gameStore'
import { createGhostBodyGeometry } from './ghostGeometry'

const MAP_SOLIDS = buildHavenInspiredMap().solids

function createVisionSectorGeo(range: number, halfAngle: number) {
  const segments = 16
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  for (let i = 0; i <= segments; i++) {
    const a = -halfAngle + (2 * halfAngle * i) / segments
    shape.lineTo(Math.sin(a) * range, -Math.cos(a) * range)
  }
  shape.closePath()
  const geo = new THREE.ShapeGeometry(shape)
  geo.rotateX(-Math.PI / 2)
  return geo
}

function ghostForward(yaw: number) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) }
}

function canSeePlayer(g: Ghost, px: number, pz: number) {
  const dx = px - g.x
  const dz = pz - g.z
  const dist = Math.hypot(dx, dz)
  if (dist > GHOST.visionRange || dist < 0.05) return { seen: false, dist }
  const f = ghostForward(g.yaw)
  const ndx = dx / dist
  const ndz = dz / dist
  const dot = f.x * ndx + f.z * ndz
  if (dot < Math.cos(GHOST.visionHalfAngle)) return { seen: false, dist }
  if (!hasLineOfSight(g.x, g.z, px, pz, MAP_SOLIDS)) return { seen: false, dist }
  return { seen: true, dist }
}

/**
 * Ghosts patrol with Commandos-style vision cones.
 * Sight / hearing → red chase; lose sight → 10s search; kills spawn 2 angry ghosts.
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
  const sectorGeo = useMemo(
    () => createVisionSectorGeo(GHOST.visionBeamLength, GHOST.visionHalfAngle),
    [],
  )
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GHOST.color,
        roughness: 0.28,
        metalness: 0.02,
        transparent: true,
        opacity: 0.9,
        emissive: new THREE.Color(GHOST.color),
        emissiveIntensity: 0.2,
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
        emissiveIntensity: 0.35,
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
  const beamMatPatrol = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#F2E8A0',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const beamMatAlert = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#FF4040',
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide,
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
    group.add(body)

    const eyeY = GHOST.height * 0.7
    const eyeX = GHOST.radius * 0.34
    const eyeZ = GHOST.radius * 0.55
    for (const side of [-1, 1] as const) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat)
      eye.position.set(side * eyeX, eyeY, eyeZ)
      group.add(eye)
      const pupil = new THREE.Mesh(pupilGeo, pupilMat.clone())
      pupil.name = side < 0 ? 'pupilL' : 'pupilR'
      pupil.position.set(side * eyeX, eyeY - 0.015, eyeZ + GHOST.radius * 0.1)
      group.add(pupil)
    }

    const beam = new THREE.Mesh(sectorGeo, beamMatPatrol.clone())
    beam.name = 'beam'
    beam.position.y = 0.06
    group.add(beam)

    // Eye spotlight shafts
    for (const side of [-1, 1] as const) {
      const shaftLen = GHOST.visionBeamLength * 0.55
      const shaft = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, shaftLen, 10, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#FFE8A0',
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      )
      shaft.name = side < 0 ? 'shaftL' : 'shaftR'
      shaft.rotation.x = -Math.PI / 2
      shaft.position.set(side * eyeX * 0.5, eyeY, -shaftLen * 0.5)
      group.add(shaft)
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
      if (!m.isMesh) return
      if (m.geometry && m.geometry !== bodyGeo && m.geometry !== eyeGeo && m.geometry !== pupilGeo && m.geometry !== sectorGeo) {
        m.geometry.dispose()
      }
      const mat = m.material as THREE.Material
      if (
        mat &&
        mat !== bodyMat &&
        mat !== eyeMat &&
        mat !== pupilMat &&
        mat !== beamMatPatrol &&
        mat !== beamMatAlert
      ) {
        mat.dispose()
      }
    })
    meshById.current.delete(id)
  }

  const spawnAngryPair = (lx: number, lz: number) => {
    for (let i = 0; i < GHOST.killSpawn; i++) {
      const ang = (i / GHOST.killSpawn) * Math.PI * 2 + Math.random()
      const ox = Math.cos(ang) * 0.7
      const oz = Math.sin(ang) * 0.7
      spawnGhost(PORTAL.x + ox, PORTAL.z + oz, {
        mode: 'search',
        alert: true,
        lastKnownX: lx,
        lastKnownZ: lz,
        awaitArrival: true,
        searchTimer: 0,
        waypoint: Math.floor(Math.random() * GHOST.waypoints.length),
      })
    }
  }

  const resetAll = () => {
    clearGhosts()
    for (const id of [...meshById.current.keys()]) removeMesh(id)
    for (let i = 0; i < GHOST.count; i++) {
      const wp = GHOST.waypoints[i % GHOST.waypoints.length]
      spawnGhost(wp.x, wp.z, {
        mode: 'patrol',
        alert: false,
        waypoint: i % GHOST.waypoints.length,
        lastKnownX: wp.x,
        lastKnownZ: wp.z,
      })
    }
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
      sectorGeo.dispose()
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const game = useGameStore.getState()

    if (game.runId !== lastRunId.current) {
      lastRunId.current = game.runId
      resetAll()
    }

    const before = getGhosts()
    let killed = 0
    for (const g of before) {
      if (!g.alive) {
        killed++
        removeMesh(g.id)
      }
    }
    if (killed > 0) {
      pruneDeadGhosts()
      // Each kill → 2 angry ghosts toward last player position
      for (let k = 0; k < killed; k++) {
        spawnAngryPair(game.playerX, game.playerZ)
      }
    }

    const list = getGhosts()
    for (const g of list) ensureMesh(g)
    const count = aliveGhostCount()
    if (count !== game.ghostCount) game.setGhostCount(count)

    if (game.status !== 'playing') return

    const px = game.playerX
    const pz = game.playerZ
    const playerSprinting = game.isSprinting
    const t = performance.now() * 0.001

    for (const g of list) {
      if (!g.alive) continue
      g.stun = Math.max(0, g.stun - dt)
      g.hitFlash = Math.max(0, g.hitFlash - dt)

      const dx = px - g.x
      const dz = pz - g.z
      const dist = Math.hypot(dx, dz)
      const vision = canSeePlayer(g, px, pz)

      // Hearing: sprint within 15m
      if (playerSprinting && dist <= GHOST.hearRadius) {
        alertGhost(g, px, pz, 'chase')
      }

      // Vision: only if facing player
      if (vision.seen) {
        alertGhost(g, px, pz, 'chase')
      } else if (g.mode === 'chase') {
        // Lost sight → search for 10s at last known
        g.mode = 'search'
        g.searchTimer = GHOST.searchTime
        g.awaitArrival = false
      }

      if (g.stun <= 0) {
        let tx = g.x
        let tz = g.z
        let speed: number = GHOST.patrolSpeed

        if (g.mode === 'chase') {
          speed = GHOST.chaseSpeed
          if (dist > 0.08) {
            tx = g.x + (dx / dist) * speed * dt
            tz = g.z + (dz / dist) * speed * dt
            g.yaw = Math.atan2(-dx, -dz)
          }
        } else if (g.mode === 'search') {
          speed = GHOST.chaseSpeed
          const ldx = g.lastKnownX - g.x
          const ldz = g.lastKnownZ - g.z
          const ld = Math.hypot(ldx, ldz)
          if (g.awaitArrival) {
            if (ld < 1.2) {
              g.awaitArrival = false
              g.searchTimer = GHOST.searchTime
            } else {
              tx = g.x + (ldx / ld) * speed * dt
              tz = g.z + (ldz / ld) * speed * dt
              g.yaw = Math.atan2(-ldx, -ldz)
            }
          } else {
            // Orbit / hold near last known while timer runs
            if (ld > 2.2) {
              tx = g.x + (ldx / ld) * speed * dt
              tz = g.z + (ldz / ld) * speed * dt
              g.yaw = Math.atan2(-ldx, -ldz)
            } else {
              g.yaw += dt * 1.1
            }
            g.searchTimer -= dt
            if (g.searchTimer <= 0) {
              g.mode = 'patrol'
              g.alert = false
              g.searchTimer = 0
            }
          }
        } else {
          // Patrol waypoints
          const wp = GHOST.waypoints[g.waypoint % GHOST.waypoints.length]
          const wdx = wp.x - g.x
          const wdz = wp.z - g.z
          const wd = Math.hypot(wdx, wdz)
          if (wd < 1.3) {
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

      if (g.mode === 'chase' && g.stun <= 0 && dist <= GHOST.catchRange) {
        useGameStore.getState().setLost()
      }

      const mesh = meshById.current.get(g.id)
      if (!mesh) continue
      const hover = g.stun > 0 ? 0.08 : 0.18 + Math.sin(t * 2.4 + g.id) * 0.1
      mesh.position.set(g.x, hover, g.z)
      mesh.rotation.y = g.yaw
      mesh.scale.setScalar(g.stun > 0 ? 0.92 : 1)

      const body = mesh.getObjectByName('body') as THREE.Mesh | undefined
      const mat = body?.material as THREE.MeshStandardMaterial | undefined
      const beam = mesh.getObjectByName('beam') as THREE.Mesh | undefined
      const alert = g.alert || g.mode !== 'patrol'

      if (mat?.isMeshStandardMaterial) {
        if (g.hitFlash > 0) {
          mat.color.set('#FFAA66')
          mat.emissive.set('#FF6622')
          mat.emissiveIntensity = 1.1
        } else if (alert) {
          mat.color.set(GHOST.alertColor)
          mat.emissive.set(GHOST.alertColor)
          mat.emissiveIntensity = 0.65
          mat.opacity = 0.95
        } else {
          mat.color.set(GHOST.color)
          mat.emissive.set(GHOST.color)
          mat.emissiveIntensity = 0.22
          mat.opacity = 0.9
        }
      }

      if (beam) {
        const bmat = beam.material as THREE.MeshBasicMaterial
        bmat.color.set(alert ? '#FF4040' : '#F2E8A0')
        bmat.opacity = alert ? 0.24 : 0.14
      }
      for (const name of ['shaftL', 'shaftR'] as const) {
        const shaft = mesh.getObjectByName(name) as THREE.Mesh | undefined
        if (!shaft) continue
        const sm = shaft.material as THREE.MeshBasicMaterial
        sm.color.set(alert ? '#FF5050' : '#FFE8A0')
        sm.opacity = alert ? 0.14 : 0.09
      }
      for (const name of ['pupilL', 'pupilR'] as const) {
        const pupil = mesh.getObjectByName(name) as THREE.Mesh | undefined
        const pm = pupil?.material as THREE.MeshStandardMaterial | undefined
        if (pm?.isMeshStandardMaterial) {
          pm.color.set(alert ? GHOST.alertEyeColor : GHOST.eyeColor)
          pm.emissive.set(alert ? '#FFAA44' : GHOST.eyeColor)
          pm.emissiveIntensity = alert ? 0.9 : 0.55
        }
      }
    }
  })

  return <group ref={root} />
}
