import { Suspense, useEffect, useRef, useState } from 'react'
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
import {
  clearEnemies,
  getEnemies,
  spawnEnemy,
  pruneDeadEnemies,
  aliveEnemyCount,
  alertEnemy,
  resumePatrol,
  type Enemy,
} from '../../combat/enemies'
import { randomEnemySpawns, randomPatrolPoint } from '../../combat/spawnPoints'
import { createFootstepClock, playFootstep } from '../../audio/footsteps'
import { useGameStore } from '../../store/gameStore'
import { EnemyRig } from './EnemyRig'

const MAP_SOLIDS = buildHavenInspiredMap().solids

/** Local steering angles (rad) — try forward, then side slips around walls. */
const STEER_ANGLES = [0, 0.55, -0.55, 1.05, -1.05, 1.55, -1.55]

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

function applyFeet(e: Enemy) {
  const support = findSupportY(
    e.x,
    e.z,
    e.y + 0.15,
    ENEMY.radius * COLLISION.supportRadiusScale,
    MAP_SOLIDS,
    Math.max(0.6, COLLISION.stepHeight + 0.25),
  )
  e.y = resolveSunkFeet(e.x, e.z, support, ENEMY.radius, MAP_SOLIDS)
}

/**
 * Move toward a goal with local wall avoidance (probe side angles).
 * Returns true if the hunter made meaningful progress.
 */
function steerToward(e: Enemy, goalX: number, goalZ: number, speed: number, dt: number): boolean {
  const dx = goalX - e.x
  const dz = goalZ - e.z
  const dist = Math.hypot(dx, dz)
  if (dist < 0.08) return false

  const wantX = dx / dist
  const wantZ = dz / dist
  const step = speed * dt
  let bestX = e.x
  let bestZ = e.z
  let bestFx = wantX
  let bestFz = wantZ
  let bestScore = -Infinity
  let found = false

  for (const ang of STEER_ANGLES) {
    const c = Math.cos(ang)
    const s = Math.sin(ang)
    const fx = wantX * c - wantZ * s
    const fz = wantX * s + wantZ * c
    const trial = clampToArena(e.x + fx * step, e.z + fz * step, ENEMY.radius)
    const hit = resolveCircleSolids(
      trial.x,
      trial.z,
      ENEMY.radius,
      MAP_SOLIDS,
      e.y,
      ENEMY.height,
      COLLISION.stepHeight,
    )
    const movedX = hit.x - e.x
    const movedZ = hit.z - e.z
    const moved = Math.hypot(movedX, movedZ)
    if (moved < step * 0.18) continue
    const progress = movedX * wantX + movedZ * wantZ
    const score = progress * 2.2 + moved - Math.abs(ang) * 0.35
    if (score > bestScore) {
      bestScore = score
      bestX = hit.x
      bestZ = hit.z
      bestFx = fx
      bestFz = fz
      found = true
    }
  }

  if (!found) {
    e.stuckTimer += dt
    return false
  }

  e.x = bestX
  e.z = bestZ
  e.yaw = Math.atan2(-bestFx, -bestFz)
  e.moving = true
  e.stuckTimer = Math.max(0, e.stuckTimer - dt * 2.5)
  return true
}

function separateEnemies(list: Enemy[]) {
  const r = ENEMY.crowdRadius
  for (let i = 0; i < list.length; i++) {
    const a = list[i]
    if (!a.alive || a.stun > 0) continue
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j]
      if (!b.alive || b.stun > 0) continue
      const dx = b.x - a.x
      const dz = b.z - a.z
      const d = Math.hypot(dx, dz)
      if (d < 0.05 || d >= r) continue
      const push = ((r - d) / d) * 0.5
      const ox = dx * push * 0.5
      const oz = dz * push * 0.5
      const aPos = clampToArena(a.x - ox, a.z - oz, ENEMY.radius)
      const bPos = clampToArena(b.x + ox, b.z + oz, ENEMY.radius)
      const aHit = resolveCircleSolids(
        aPos.x,
        aPos.z,
        ENEMY.radius,
        MAP_SOLIDS,
        a.y,
        ENEMY.height,
        COLLISION.stepHeight,
      )
      const bHit = resolveCircleSolids(
        bPos.x,
        bPos.z,
        ENEMY.radius,
        MAP_SOLIDS,
        b.y,
        ENEMY.height,
        COLLISION.stepHeight,
      )
      a.x = aHit.x
      a.z = aHit.z
      b.x = bHit.x
      b.z = bHit.z
    }
  }
}

function assignRandomPatrol(e: Enemy) {
  const p = randomPatrolPoint(e.x, e.z)
  resumePatrol(e, p.x, p.z)
}

/**
 * Mixamo hunters: random roam, chase on sight/hear,
 * give up after 3s without LOS, avoid wall-sticking.
 */
export function EnemySystem() {
  const lastRunId = useRef(useGameStore.getState().runId)
  const footClocks = useRef(new Map<number, ReturnType<typeof createFootstepClock>>())
  const [, bump] = useState(0)

  const resetAll = () => {
    clearEnemies()
    footClocks.current.clear()
    const spots = randomEnemySpawns(ENEMY.count)
    spots.forEach((s) => {
      const e = spawnEnemy(s.x, s.z)
      applyFeet(e)
      const p = randomPatrolPoint(e.x, e.z, 4, 14)
      e.targetX = p.x
      e.targetZ = p.z
      e.waitTimer = 0.15 + Math.random() * 1.1
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

    for (const e of list) {
      if (!e.alive) continue
      e.stun = Math.max(0, e.stun - dt)
      e.hitFlash = Math.max(0, e.hitFlash - dt)
      e.moving = false

      const dx = px - e.x
      const dz = pz - e.z
      const dist = Math.hypot(dx, dz)
      const vision = canSeePlayer(e, px, pz)

      // Perception: see → chase; hear sprint → chase to noise.
      if (vision.seen) {
        alertEnemy(e, px, pz, 'chase')
      } else if (playerSprinting && dist <= ENEMY.hearRadius) {
        alertEnemy(e, px, pz, 'chase')
      } else if (e.mode === 'chase' || e.mode === 'search') {
        // Lost the player — count down, then resume random patrol.
        e.mode = 'search'
        e.searchTimer -= dt
        if (e.searchTimer <= 0) {
          assignRandomPatrol(e)
        }
      }

      if (e.stun <= 0) {
        if (e.mode === 'chase') {
          if (dist > ENEMY.catchRange * 0.55) {
            const ok = steerToward(e, px, pz, ENEMY.chaseSpeed, dt)
            if (!ok && e.stuckTimer >= ENEMY.stuckTime) {
              // Sidestep around the obstacle instead of vibrating into it.
              const side = Math.random() < 0.5 ? 1 : -1
              const sx = e.x + (-dz / Math.max(dist, 0.01)) * side * 3.5
              const sz = e.z + (dx / Math.max(dist, 0.01)) * side * 3.5
              steerToward(e, sx, sz, ENEMY.chaseSpeed * 0.9, dt)
              e.stuckTimer = 0
            }
          }
        } else if (e.mode === 'search') {
          const ldx = e.lastKnownX - e.x
          const ldz = e.lastKnownZ - e.z
          const ld = Math.hypot(ldx, ldz)
          if (ld > 1.35) {
            const ok = steerToward(e, e.lastKnownX, e.lastKnownZ, ENEMY.chaseSpeed * 0.82, dt)
            if (!ok && e.stuckTimer >= ENEMY.stuckTime) {
              // Can't reach last known — abort search early, roam again.
              assignRandomPatrol(e)
            }
          } else {
            // Peek around the last known spot.
            e.yaw += dt * 1.35
          }
        } else {
          // Random patrol: pause, walk to a free point, repeat.
          if (e.waitTimer > 0) {
            e.waitTimer -= dt
            e.yaw += Math.sin(e.id * 12.7 + performance.now() * 0.001) * dt * 0.35
          } else {
            const tdx = e.targetX - e.x
            const tdz = e.targetZ - e.z
            const td = Math.hypot(tdx, tdz)
            if (td < ENEMY.patrolArrive) {
              const p = randomPatrolPoint(e.x, e.z)
              e.targetX = p.x
              e.targetZ = p.z
              e.waitTimer =
                ENEMY.patrolWaitMin + Math.random() * (ENEMY.patrolWaitMax - ENEMY.patrolWaitMin)
              e.stuckTimer = 0
            } else {
              const ok = steerToward(e, e.targetX, e.targetZ, ENEMY.patrolSpeed, dt)
              if (!ok && e.stuckTimer >= ENEMY.stuckTime) {
                const p = randomPatrolPoint(e.x, e.z, 5, 18)
                e.targetX = p.x
                e.targetZ = p.z
                e.stuckTimer = 0
                e.waitTimer = 0.15 + Math.random() * 0.4
              }
            }
          }
        }
      }

      applyFeet(e)

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

      if (e.mode === 'chase' && e.stun <= 0 && dist <= ENEMY.catchRange && vision.seen) {
        useGameStore.getState().setLost()
      }
    }

    separateEnemies(list)
    for (const e of list) {
      if (e.alive) applyFeet(e)
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
