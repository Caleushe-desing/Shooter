import { ENEMY } from '../constants'

export type EnemyMode = 'patrol' | 'chase' | 'search'
export type HitZone = 'head' | 'body' | 'legs'

export type Enemy = {
  id: number
  x: number
  y: number
  z: number
  yaw: number
  hp: number
  alive: boolean
  stun: number
  hitFlash: number
  mode: EnemyMode
  /** Last place the hunter saw / heard the player. */
  lastKnownX: number
  lastKnownZ: number
  /** Remaining seconds without LOS before returning to patrol. */
  searchTimer: number
  alert: boolean
  /** Random patrol destination. */
  targetX: number
  targetZ: number
  /** Idle pause at a patrol point. */
  waitTimer: number
  /** Accumulates when movement is blocked by geometry. */
  stuckTimer: number
  /** Nav waypoints (cell centers) toward current goal. */
  path: { x: number; z: number }[]
  pathIndex: number
  repathTimer: number
  /** Moving this frame — drives Mixamo walk/run. */
  moving: boolean
}

let nextId = 1
let enemies: Enemy[] = []

export function getEnemies(): Enemy[] {
  return enemies
}

export function clearEnemies() {
  enemies = []
  nextId = 1
}

export function aliveEnemyCount() {
  let n = 0
  for (const e of enemies) if (e.alive) n++
  return n
}

export type SpawnEnemyOpts = {
  mode?: EnemyMode
  lastKnownX?: number
  lastKnownZ?: number
  searchTimer?: number
  alert?: boolean
  targetX?: number
  targetZ?: number
}

export function spawnEnemy(x: number, z: number, opts: SpawnEnemyOpts = {}): Enemy {
  const enemy: Enemy = {
    id: nextId++,
    x,
    y: 0,
    z,
    yaw: Math.random() * Math.PI * 2,
    hp: ENEMY.hp,
    alive: true,
    stun: 0,
    hitFlash: 0,
    mode: opts.mode ?? 'patrol',
    lastKnownX: opts.lastKnownX ?? x,
    lastKnownZ: opts.lastKnownZ ?? z,
    searchTimer: opts.searchTimer ?? 0,
    alert: opts.alert ?? (opts.mode === 'chase' || opts.mode === 'search'),
    targetX: opts.targetX ?? x,
    targetZ: opts.targetZ ?? z,
    waitTimer: 0.2 + Math.random() * 0.8,
    stuckTimer: 0,
    path: [],
    pathIndex: 0,
    repathTimer: 0,
    moving: false,
  }
  enemies.push(enemy)
  return enemy
}

export function damageForZone(zone: HitZone): number {
  if (zone === 'head') return ENEMY.damageHead
  if (zone === 'body') return ENEMY.damageBody
  return ENEMY.damageLegs
}

/** Damage an enemy. Returns death position if downed. */
export function hurtEnemy(id: number, amount: number): { x: number; z: number } | null {
  const e = enemies.find((en) => en.id === id && en.alive)
  if (!e) return null
  e.hp -= amount
  e.hitFlash = 0.28
  e.stun = Math.max(e.stun, ENEMY.stunTime)
  if (e.hp <= 0) {
    e.alive = false
    e.moving = false
    return { x: e.x, z: e.z }
  }
  return null
}

export function hurtEnemyZone(id: number, zone: HitZone): { x: number; z: number } | null {
  return hurtEnemy(id, damageForZone(zone))
}

type HitBox = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }

/** Full capsule — kept for coarse checks. */
export function enemyHitBox(e: Enemy): HitBox {
  const r = ENEMY.radius
  return {
    minX: e.x - r,
    minY: e.y + 0.05,
    minZ: e.z - r,
    maxX: e.x + r,
    maxY: e.y + ENEMY.height,
    maxZ: e.z + r,
  }
}

/**
 * Zone AABBs for hit calc:
 * legs ~0–38%, body ~38–82%, head ~82–100% of height.
 */
export function enemyHitZones(e: Enemy): { zone: HitZone; box: HitBox }[] {
  const h = ENEMY.height
  const y0 = e.y
  const r = ENEMY.radius
  const headR = r * 0.7
  return [
    {
      zone: 'legs',
      box: {
        minX: e.x - r * 0.95,
        maxX: e.x + r * 0.95,
        minZ: e.z - r * 0.95,
        maxZ: e.z + r * 0.95,
        minY: y0,
        maxY: y0 + h * 0.38,
      },
    },
    {
      zone: 'body',
      box: {
        minX: e.x - r,
        maxX: e.x + r,
        minZ: e.z - r,
        maxZ: e.z + r,
        minY: y0 + h * 0.38,
        maxY: y0 + h * 0.82,
      },
    },
    {
      zone: 'head',
      box: {
        minX: e.x - headR,
        maxX: e.x + headR,
        minZ: e.z - headR,
        maxZ: e.z + headR,
        minY: y0 + h * 0.82,
        maxY: y0 + h + 0.1,
      },
    },
  ]
}

export function pruneDeadEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].alive) enemies.splice(i, 1)
  }
}

export function alertEnemy(e: Enemy, lx: number, lz: number, mode: EnemyMode = 'chase') {
  e.mode = mode
  e.alert = true
  e.lastKnownX = lx
  e.lastKnownZ = lz
  e.waitTimer = 0
  e.searchTimer = ENEMY.searchTime
}

export function resumePatrol(e: Enemy, tx: number, tz: number) {
  e.mode = 'patrol'
  e.alert = false
  e.searchTimer = 0
  e.stuckTimer = 0
  e.targetX = tx
  e.targetZ = tz
  e.path = []
  e.pathIndex = 0
  e.repathTimer = 0
  e.waitTimer =
    ENEMY.patrolWaitMin + Math.random() * (ENEMY.patrolWaitMax - ENEMY.patrolWaitMin) * 0.35
}

export function setEnemyPath(e: Enemy, path: { x: number; z: number }[]) {
  e.path = path
  e.pathIndex = 0
  e.repathTimer = ENEMY.repathInterval
}
