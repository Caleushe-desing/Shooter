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
  setEnemyPath,
  type Enemy,
} from '../../combat/enemies'
import { randomEnemySpawns, randomPatrolPoint } from '../../combat/spawnPoints'
import { findPath, hasNavLine } from '../../combat/navGrid'
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

function applyFeet(e: Enemy) {
  // Reach matches player grounded stick + climb so stairs/decks snap under feet.
  const support = findSupportY(
    e.x,
    e.z,
    e.y + 0.2,
    ENEMY.radius * COLLISION.supportRadiusScale,
    MAP_SOLIDS,
    Math.max(ENEMY.climbHeight, COLLISION.stepHeight + 0.35),
  )
  // Don't fall through floors, but allow dropping off edges.
  if (support < e.y - ENEMY.climbHeight - 0.05) {
    e.y = Math.max(support, e.y - 0.35)
  } else {
    e.y = support
  }
  e.y = resolveSunkFeet(e.x, e.z, e.y, ENEMY.radius, MAP_SOLIDS)
}

/**
 * Hop onto a walkable ledge ahead (stairs / crates / decks) — same clearance
 * the player can clear with a jump.
 */
function tryClimbLedge(e: Enemy, dirX: number, dirZ: number): boolean {
  const len = Math.hypot(dirX, dirZ)
  if (len < 1e-4) return false
  const fx = dirX / len
  const fz = dirZ / len
  const probes = [0.45, 0.7, 1.0]
  for (const dist of probes) {
    const px = e.x + fx * dist
    const pz = e.z + fz * dist
    const bounded = clampToArena(px, pz, ENEMY.radius)
    const ahead = findSupportY(
      bounded.x,
      bounded.z,
      e.y + ENEMY.climbHeight,
      ENEMY.radius * 0.7,
      MAP_SOLIDS,
      ENEMY.climbHeight + 0.15,
    )
    const rise = ahead - e.y
    if (rise <= COLLISION.stepHeight * 0.5 || rise > ENEMY.climbHeight) continue
    // Landing must not be inside a tall wall volume.
    const land = resolveCircleSolids(
      bounded.x,
      bounded.z,
      ENEMY.radius,
      MAP_SOLIDS,
      ahead,
      ENEMY.height,
      COLLISION.stepHeight,
    )
    if (Math.hypot(land.x - bounded.x, land.z - bounded.z) > 0.12) continue
    e.x = land.x
    e.z = land.z
    e.y = ahead
    e.yaw = Math.atan2(-fx, -fz)
    e.moving = true
    e.stuckTimer = 0
    return true
  }
  return false
}

function ensurePath(e: Enemy, goalX: number, goalZ: number, force = false) {
  const need =
    force ||
    e.path.length === 0 ||
    e.pathIndex >= e.path.length ||
    e.repathTimer <= 0 ||
    e.stuckTimer >= ENEMY.stuckTime
  if (!need) return
  const path = findPath(e.x, e.z, goalX, goalZ)
  if (path.length === 0) {
    e.repathTimer = ENEMY.repathInterval * 0.5
    return
  }
  setEnemyPath(e, path)
  e.stuckTimer = 0
}

/** Follow nav waypoints; climb ledges the player can reach. */
function followPath(e: Enemy, speed: number, dt: number): boolean {
  if (e.pathIndex >= e.path.length) return false
  const wp = e.path[e.pathIndex]
  const dx = wp.x - e.x
  const dz = wp.z - e.z
  const dist = Math.hypot(dx, dz)
  if (dist < 0.55) {
    e.pathIndex++
    return e.pathIndex < e.path.length
  }

  // If the next hop is blocked, skip / repath next frame.
  if (!hasNavLine(e.x, e.z, wp.x, wp.z) && dist > 1.2) {
    if (tryClimbLedge(e, dx, dz)) return true
    e.stuckTimer += dt
    return false
  }

  const step = Math.min(speed * dt, dist)
  const nx = e.x + (dx / dist) * step
  const nz = e.z + (dz / dist) * step
  const bounded = clampToArena(nx, nz, ENEMY.radius)
  // Allow walking onto lips within climb height (same as player step/jump).
  const hit = resolveCircleSolids(
    bounded.x,
    bounded.z,
    ENEMY.radius,
    MAP_SOLIDS,
    e.y,
    ENEMY.height,
    Math.max(COLLISION.stepHeight, 0.55),
  )
  const moved = Math.hypot(hit.x - e.x, hit.z - e.z)
  if (moved < step * 0.2) {
    if (tryClimbLedge(e, dx, dz)) return true
    e.stuckTimer += dt
    return false
  }
  e.x = hit.x
  e.z = hit.z
  e.yaw = Math.atan2(-dx, -dz)
  e.moving = true
  e.stuckTimer = Math.max(0, e.stuckTimer - dt * 2)
  // Snap up onto shallow stairs under the new footprint.
  const support = findSupportY(
    e.x,
    e.z,
    e.y + 0.35,
    ENEMY.radius * COLLISION.supportRadiusScale,
    MAP_SOLIDS,
    Math.max(0.7, COLLISION.stepHeight + 0.4),
  )
  if (support > e.y && support - e.y <= ENEMY.climbHeight) e.y = support
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
  setEnemyPath(e, findPath(e.x, e.z, p.x, p.z))
}

/**
 * Mixamo hunters: nav-grid paths, random patrol, chase on sight/hear,
 * give up after 3s without LOS. Survive growing waves to win.
 */
export function EnemySystem() {
  const lastRunId = useRef(useGameStore.getState().runId)
  const waveRef = useRef(1)
  const waveTimer = useRef(0)
  const [, bump] = useState(0)

  const spawnWave = (wave: number) => {
    const count = ENEMY.waveStart + (wave - 1) * ENEMY.waveIncrement
    const game = useGameStore.getState()
    const spots = randomEnemySpawns(count, {
      awayFrom: { x: game.playerX, z: game.playerZ },
      minAway: wave === 1 ? 10 : 16,
    })
    spots.forEach((s) => {
      const e = spawnEnemy(s.x, s.z)
      applyFeet(e)
      const p = randomPatrolPoint(e.x, e.z, 4, 14)
      e.targetX = p.x
      e.targetZ = p.z
      setEnemyPath(e, findPath(e.x, e.z, p.x, p.z))
      e.waitTimer = 0.1 + Math.random() * 0.9
    })
    game.setWave(wave)
    game.setEnemyCount(aliveEnemyCount())
    bump((n) => n + 1)
  }

  const resetAll = () => {
    clearEnemies()
    waveRef.current = 1
    waveTimer.current = 0
    spawnWave(1)
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

    // Wave reinforce: clear → score → win after wavesToWin, else larger horde.
    if (count === 0) {
      waveTimer.current += dt
      if (waveTimer.current >= ENEMY.waveGap) {
        waveTimer.current = 0
        game.registerWaveClear(waveRef.current)
        if (waveRef.current >= ENEMY.wavesToWin) {
          game.setWon()
          return
        }
        waveRef.current += 1
        spawnWave(waveRef.current)
      }
    } else {
      waveTimer.current = 0
    }

    const px = game.playerX
    const pz = game.playerZ
    const playerSprinting = game.isSprinting

    for (const e of list) {
      if (!e.alive) continue
      e.stun = Math.max(0, e.stun - dt)
      e.hitFlash = Math.max(0, e.hitFlash - dt)
      e.moving = false
      e.repathTimer = Math.max(0, e.repathTimer - dt)

      const dx = px - e.x
      const dz = pz - e.z
      const dist = Math.hypot(dx, dz)
      const vision = canSeePlayer(e, px, pz)

      if (vision.seen) {
        alertEnemy(e, px, pz, 'chase')
      } else if (playerSprinting && dist <= ENEMY.hearRadius) {
        alertEnemy(e, px, pz, 'chase')
      } else if (e.mode === 'chase' || e.mode === 'search') {
        e.mode = 'search'
        e.searchTimer -= dt
        if (e.searchTimer <= 0) assignRandomPatrol(e)
      }

      if (e.stun <= 0) {
        if (e.mode === 'chase') {
          ensurePath(e, px, pz)
          if (!followPath(e, ENEMY.chaseSpeed, dt) && e.stuckTimer >= ENEMY.stuckTime) {
            ensurePath(e, px, pz, true)
          }
        } else if (e.mode === 'search') {
          ensurePath(e, e.lastKnownX, e.lastKnownZ)
          const ldx = e.lastKnownX - e.x
          const ldz = e.lastKnownZ - e.z
          const ld = Math.hypot(ldx, ldz)
          if (ld > 1.4) {
            if (!followPath(e, ENEMY.chaseSpeed * 0.82, dt) && e.stuckTimer >= ENEMY.stuckTime) {
              assignRandomPatrol(e)
            }
          } else {
            e.yaw += dt * 1.35
            e.path = []
          }
        } else {
          if (e.waitTimer > 0) {
            e.waitTimer -= dt
            e.yaw += Math.sin(e.id * 12.7 + performance.now() * 0.001) * dt * 0.35
          } else {
            const tdx = e.targetX - e.x
            const tdz = e.targetZ - e.z
            const td = Math.hypot(tdx, tdz)
            if (td < ENEMY.patrolArrive || e.pathIndex >= e.path.length) {
              if (td < ENEMY.patrolArrive || e.path.length === 0) {
                const p = randomPatrolPoint(e.x, e.z)
                e.targetX = p.x
                e.targetZ = p.z
                e.waitTimer =
                  ENEMY.patrolWaitMin +
                  Math.random() * (ENEMY.patrolWaitMax - ENEMY.patrolWaitMin)
                setEnemyPath(e, findPath(e.x, e.z, p.x, p.z))
              } else {
                ensurePath(e, e.targetX, e.targetZ, true)
              }
            } else {
              ensurePath(e, e.targetX, e.targetZ)
              if (!followPath(e, ENEMY.patrolSpeed, dt) && e.stuckTimer >= ENEMY.stuckTime) {
                const p = randomPatrolPoint(e.x, e.z, 5, 18)
                e.targetX = p.x
                e.targetZ = p.z
                setEnemyPath(e, findPath(e.x, e.z, p.x, p.z))
                e.stuckTimer = 0
              }
            }
          }
        }
      }

      applyFeet(e)

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
