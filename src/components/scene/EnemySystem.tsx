import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  ENEMY,
  COLLISION,
  clampToArena,
  resolveCircleSolids,
  findSupportY,
  resolveSunkFeet,
  hasLineOfSight,
} from '../../constants'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import { ORB_SPAWNS } from '../../map/pickupsLayout'
import {
  clearEnemies,
  getEnemies,
  spawnEnemy,
  pruneDeadEnemies,
  aliveEnemyCount,
  alertEnemy,
  type Enemy,
} from '../../combat/enemies'
import { buildEnemyWaypoints, randomEnemySpawns } from '../../combat/spawnPoints'
import { createFootstepClock, playFootstep } from '../../audio/footsteps'
import { useGameStore } from '../../store/gameStore'
import { EnemyRig } from './EnemyRig'

const MAP_SOLIDS = buildHavenInspiredMap().solids

function enemyForward(yaw: number) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) }
}

function canSeePlayer(e: Enemy, px: number, pz: number) {
  const dx = px - e.x
  const dz = pz - e.z
  const dist = Math.hypot(dx, dz)
  if (dist > ENEMY.visionRange || dist < 0.05) return { seen: false, dist }
  const f = enemyForward(e.yaw)
  const ndx = dx / dist
  const ndz = dz / dist
  const dot = f.x * ndx + f.z * ndz
  if (dot < Math.cos(ENEMY.visionHalfAngle)) return { seen: false, dist }
  if (!hasLineOfSight(e.x, e.z, px, pz, MAP_SOLIDS)) return { seen: false, dist }
  return { seen: true, dist }
}

/**
 * Mixamo hunters: patrol orb routes, chase on sight/hear,
 * catch = game over (block orb capture).
 */
export function EnemySystem() {
  const lastRunId = useRef(useGameStore.getState().runId)
  const waypoints = useMemo(() => buildEnemyWaypoints(), [])
  const footClocks = useRef(new Map<number, ReturnType<typeof createFootstepClock>>())
  const [, bump] = useState(0)

  const resetAll = () => {
    clearEnemies()
    footClocks.current.clear()
    const spots = randomEnemySpawns(ENEMY.count)
    spots.forEach((s, i) => {
      const e = spawnEnemy(s.x, s.z, { waypoint: i % Math.max(1, waypoints.length) })
      const support = findSupportY(e.x, e.z, 0.5, ENEMY.radius, MAP_SOLIDS, 2)
      e.y = support
      footClocks.current.set(e.id, createFootstepClock(0.42, 0.28))
    })
    useGameStore.getState().setEnemyCount(aliveEnemyCount())
    bump((n) => n + 1)
  }

  useEffect(() => {
    resetAll()
    return () => clearEnemies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const game = useGameStore.getState()

    if (game.runId !== lastRunId.current) {
      lastRunId.current = game.runId
      resetAll()
    }

    const before = getEnemies()
    let killed = 0
    for (const e of before) {
      if (!e.alive) killed++
    }
    if (killed > 0) {
      pruneDeadEnemies()
      bump((n) => n + 1)
    }

    const list = getEnemies()
    const count = aliveEnemyCount()
    if (count !== game.enemyCount) game.setEnemyCount(count)

    if (game.status !== 'playing') {
      for (const e of list) e.moving = false
      return
    }

    const px = game.playerX
    const pz = game.playerZ
    const playerSprinting = game.isSprinting

    // Player near an orb → nearby hunters get suspicious (guard the orbs).
    let nearOrb = false
    for (const o of ORB_SPAWNS) {
      if (Math.hypot(px - o.x, pz - o.z) < ENEMY.orbGuardRadius) {
        nearOrb = true
        break
      }
    }

    for (const e of list) {
      if (!e.alive) continue
      e.stun = Math.max(0, e.stun - dt)
      e.hitFlash = Math.max(0, e.hitFlash - dt)
      e.moving = false

      const dx = px - e.x
      const dz = pz - e.z
      const dist = Math.hypot(dx, dz)
      const vision = canSeePlayer(e, px, pz)

      if (playerSprinting && dist <= ENEMY.hearRadius) {
        alertEnemy(e, px, pz, 'chase')
      }
      if (vision.seen) {
        alertEnemy(e, px, pz, 'chase')
      } else if (nearOrb && dist <= ENEMY.orbGuardRadius * 1.35 && e.mode === 'patrol') {
        // Soft alert toward player when they threaten a nearby orb.
        alertEnemy(e, px, pz, 'search')
      } else if (e.mode === 'chase' && !vision.seen) {
        e.mode = 'search'
        e.searchTimer = ENEMY.searchTime
      }

      if (e.stun <= 0) {
        let tx = e.x
        let tz = e.z
        let speed: number = ENEMY.patrolSpeed

        if (e.mode === 'chase') {
          speed = ENEMY.chaseSpeed
          if (dist > 0.08) {
            tx = e.x + (dx / dist) * speed * dt
            tz = e.z + (dz / dist) * speed * dt
            e.yaw = Math.atan2(-dx, -dz)
            e.moving = true
          }
        } else if (e.mode === 'search') {
          speed = ENEMY.chaseSpeed * 0.9
          const ldx = e.lastKnownX - e.x
          const ldz = e.lastKnownZ - e.z
          const ld = Math.hypot(ldx, ldz)
          if (ld > 1.6) {
            tx = e.x + (ldx / ld) * speed * dt
            tz = e.z + (ldz / ld) * speed * dt
            e.yaw = Math.atan2(-ldx, -ldz)
            e.moving = true
          } else {
            e.yaw += dt * 1.2
          }
          e.searchTimer -= dt
          if (e.searchTimer <= 0) {
            e.mode = 'patrol'
            e.alert = false
            e.searchTimer = 0
          }
        } else {
          // Patrol between orb waypoints — deny easy orb routes.
          const wp = waypoints[e.waypoint % waypoints.length]
          const wdx = wp.x - e.x
          const wdz = wp.z - e.z
          const wd = Math.hypot(wdx, wdz)
          if (wd < 1.4) {
            e.waypoint = (e.waypoint + 1) % waypoints.length
          } else {
            tx = e.x + (wdx / wd) * speed * dt
            tz = e.z + (wdz / wd) * speed * dt
            e.yaw = Math.atan2(-wdx, -wdz)
            e.moving = true
          }
        }

        const bounded = clampToArena(tx, tz, ENEMY.radius)
        const hit = resolveCircleSolids(
          bounded.x,
          bounded.z,
          ENEMY.radius,
          MAP_SOLIDS,
          e.y,
          ENEMY.height,
          COLLISION.stepHeight,
        )
        e.x = hit.x
        e.z = hit.z
      }

      // Keep hunters on walkable tops (stairs / ledges) — no sinking.
      const support = findSupportY(
        e.x,
        e.z,
        e.y + 0.15,
        ENEMY.radius * COLLISION.supportRadiusScale,
        MAP_SOLIDS,
        Math.max(0.6, COLLISION.stepHeight + 0.25),
      )
      e.y = support
      e.y = resolveSunkFeet(e.x, e.z, e.y, ENEMY.radius, MAP_SOLIDS)

      if (e.moving) {
        let clock = footClocks.current.get(e.id)
        if (!clock) {
          clock = createFootstepClock(0.42, 0.28)
          footClocks.current.set(e.id, clock)
        }
        const running = e.mode === 'chase' || e.mode === 'search'
        const hearDist = Math.hypot(px - e.x, pz - e.z)
        clock.tick(dt, true, running, (kind) => playFootstep(kind, hearDist))
      } else {
        footClocks.current.get(e.id)?.reset()
      }

      if (e.mode === 'chase' && e.stun <= 0 && dist <= ENEMY.catchRange) {
        useGameStore.getState().setLost()
      }
    }
  })

  const list = getEnemies()

  return (
    <Suspense fallback={null}>
      <group>
        {list.map((e) => (
          <EnemyRig key={e.id} enemy={e} />
        ))}
      </group>
    </Suspense>
  )
}
