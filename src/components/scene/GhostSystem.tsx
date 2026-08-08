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
import { createSoldierParts, SOLDIER_COLORS } from './soldierGeometry'
import { randomGhostSpawns } from '../../combat/spawnPoints'

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
 * Enemy soldiers patrol with Commandos-style vision cones.
 * Sight / hearing → alert chase; lose sight → 10s search; kills spawn 2 reinforcements.
 */
export function GhostSystem() {
  const root = useRef<THREE.Group>(null)
  const meshById = useRef(new Map<number, THREE.Group>())
  const lastRunId = useRef(useGameStore.getState().runId)
  const portalTimer = useRef(PORTAL.spawnInterval)

  const parts = useMemo(
    () => createSoldierParts(GHOST.radius * 0.95, GHOST.height),
    [],
  )
  const sectorGeo = useMemo(
    () => createVisionSectorGeo(GHOST.visionBeamLength, GHOST.visionHalfAngle),
    [],
  )
  const tunicMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SOLDIER_COLORS.tunic,
        roughness: 0.78,
        metalness: 0.08,
      }),
    [],
  )
  const helmetMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SOLDIER_COLORS.helmet,
        roughness: 0.55,
        metalness: 0.25,
      }),
    [],
  )
  const skinMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SOLDIER_COLORS.skin,
        roughness: 0.7,
      }),
    [],
  )
  const bootMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SOLDIER_COLORS.boots,
        roughness: 0.85,
      }),
    [],
  )
  const rifleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SOLDIER_COLORS.rifle,
        roughness: 0.7,
      }),
    [],
  )
  const beamMatPatrol = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#F2E8A0',
        transparent: true,
        opacity: 0.28,
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
    const r = GHOST.radius
    const h = GHOST.height

    const body = new THREE.Mesh(parts.body, tunicMat.clone())
    body.name = 'body'
    body.position.y = h * 0.55
    body.castShadow = true
    group.add(body)

    const head = new THREE.Mesh(parts.head, skinMat)
    head.position.y = h * 0.82
    head.castShadow = true
    group.add(head)

    const helmet = new THREE.Mesh(parts.helmet, helmetMat)
    helmet.position.y = h * 0.88
    helmet.castShadow = true
    group.add(helmet)

    const brim = new THREE.Mesh(parts.brim, helmetMat)
    brim.rotation.x = Math.PI / 2
    brim.position.set(0, h * 0.84, -0.02)
    group.add(brim)

    const armL = new THREE.Mesh(parts.armL, tunicMat)
    armL.position.set(-r * 0.85, h * 0.55, 0)
    armL.rotation.z = 0.15
    group.add(armL)
    const armR = new THREE.Mesh(parts.armR, tunicMat)
    armR.position.set(r * 0.85, h * 0.55, 0)
    armR.rotation.z = -0.15
    group.add(armR)

    const legL = new THREE.Mesh(parts.legL, tunicMat)
    legL.position.set(-r * 0.28, h * 0.22, 0)
    group.add(legL)
    const legR = new THREE.Mesh(parts.legR, tunicMat)
    legR.position.set(r * 0.28, h * 0.22, 0)
    group.add(legR)

    const bootL = new THREE.Mesh(parts.bootL, bootMat)
    bootL.position.set(-r * 0.28, 0.08, -0.05)
    group.add(bootL)
    const bootR = new THREE.Mesh(parts.bootR, bootMat)
    bootR.position.set(r * 0.28, 0.08, -0.05)
    group.add(bootR)

    const rifle = new THREE.Mesh(parts.rifle, rifleMat)
    rifle.position.set(r * 0.55, h * 0.48, -h * 0.12)
    rifle.rotation.x = 0.15
    group.add(rifle)

    const beam = new THREE.Mesh(sectorGeo, beamMatPatrol.clone())
    beam.name = 'beam'
    beam.position.y = 0.06
    group.add(beam)

    const shaftLen = GHOST.visionBeamLength * 0.45
    const shaft = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, shaftLen, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color: '#FFE8A0',
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    shaft.name = 'shaft'
    shaft.rotation.x = -Math.PI / 2
    shaft.position.set(0, h * 0.82, -shaftLen * 0.5)
    group.add(shaft)

    group.position.set(g.x, 0, g.z)
    parent.add(group)
    meshById.current.set(g.id, group)
  }

  const removeMesh = (id: number) => {
    const group = meshById.current.get(id)
    if (!group || !root.current) return
    root.current.remove(group)
    const sharedGeos = new Set<THREE.BufferGeometry>(Object.values(parts))
    sharedGeos.add(sectorGeo)
    group.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      if (m.geometry && !sharedGeos.has(m.geometry)) m.geometry.dispose()
      const mat = m.material as THREE.Material
      if (
        mat &&
        mat !== tunicMat &&
        mat !== helmetMat &&
        mat !== skinMat &&
        mat !== bootMat &&
        mat !== rifleMat &&
        mat !== beamMatPatrol
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

  const spawnFromPortalPatrol = () => {
    const ang = Math.random() * Math.PI * 2
    const wp = Math.floor(Math.random() * GHOST.waypoints.length)
    spawnGhost(
      PORTAL.x + Math.cos(ang) * 1.2,
      PORTAL.z + Math.sin(ang) * 1.2,
      {
        mode: 'patrol',
        alert: false,
        waypoint: wp,
      },
    )
  }

  const resetAll = () => {
    clearGhosts()
    for (const id of [...meshById.current.keys()]) removeMesh(id)
    portalTimer.current = PORTAL.spawnInterval
    // 8 ghosts already on the map at random free spots.
    const spots = randomGhostSpawns(GHOST.count)
    spots.forEach((s, i) => {
      spawnGhost(s.x, s.z, {
        mode: 'patrol',
        alert: false,
        waypoint: i % GHOST.waypoints.length,
      })
    })
    useGameStore.getState().setGhostCount(aliveGhostCount())
  }

  useEffect(() => {
    resetAll()
    return () => {
      clearGhosts()
      meshById.current.clear()
      // Do not dispose shared geos here — React Strict Mode remounts
      // would leave the next mount with dead BufferGeometry.
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const game = useGameStore.getState()

    if (game.runId !== lastRunId.current) {
      lastRunId.current = game.runId
      resetAll()
    }

    if (game.status === 'playing') {
      // Timed portal spawns — one new patrolling ghost every 30s.
      portalTimer.current -= dt
      if (portalTimer.current <= 0) {
        portalTimer.current = PORTAL.spawnInterval
        spawnFromPortalPatrol()
      }
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
      mesh.position.set(g.x, g.stun > 0 ? 0.04 : 0, g.z)
      mesh.rotation.y = g.yaw
      mesh.scale.setScalar(g.stun > 0 ? 0.94 : 1)

      const body = mesh.getObjectByName('body') as THREE.Mesh | undefined
      const mat = body?.material as THREE.MeshStandardMaterial | undefined
      const beam = mesh.getObjectByName('beam') as THREE.Mesh | undefined
      const shaft = mesh.getObjectByName('shaft') as THREE.Mesh | undefined
      const alert = g.alert || g.mode !== 'patrol'

      if (mat?.isMeshStandardMaterial) {
        if (g.hitFlash > 0) {
          mat.color.set('#FFAA66')
          mat.emissive.set('#FF6622')
          mat.emissiveIntensity = 0.9
        } else if (alert) {
          mat.color.set(SOLDIER_COLORS.tunicAlert)
          mat.emissive.set('#401010')
          mat.emissiveIntensity = 0.35
        } else {
          mat.color.set(SOLDIER_COLORS.tunic)
          mat.emissive.set('#000000')
          mat.emissiveIntensity = 0
        }
      }

      if (beam) {
        const bmat = beam.material as THREE.MeshBasicMaterial
        bmat.color.set(alert ? '#FF4040' : '#F2E8A0')
        bmat.opacity = alert ? 0.36 : 0.28
      }
      if (shaft) {
        const sm = shaft.material as THREE.MeshBasicMaterial
        sm.color.set(alert ? '#FF5050' : '#FFE8A0')
        sm.opacity = alert ? 0.22 : 0.14
      }
    }
  })

  return <group ref={root} />
}
