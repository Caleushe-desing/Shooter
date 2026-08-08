import { ENEMY } from '../constants'

export type EnemyMode = 'patrol' | 'chase' | 'search'

export type Enemy = {
  id: number
  x: number
  y: number
  z: number
  yaw: number
  hp: number
  alive: boolean
  stun: number
  waypoint: number
  hitFlash: number
  mode: EnemyMode
  lastKnownX: number
  lastKnownZ: number
  searchTimer: number
  alert: boolean
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
  waypoint?: number
  mode?: EnemyMode
  lastKnownX?: number
  lastKnownZ?: number
  searchTimer?: number
  alert?: boolean
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
    waypoint: opts.waypoint ?? 0,
    hitFlash: 0,
    mode: opts.mode ?? 'patrol',
    lastKnownX: opts.lastKnownX ?? x,
    lastKnownZ: opts.lastKnownZ ?? z,
    searchTimer: opts.searchTimer ?? 0,
    alert: opts.alert ?? (opts.mode === 'chase' || opts.mode === 'search'),
    moving: false,
  }
  enemies.push(enemy)
  return enemy
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

export function enemyHitBox(e: Enemy) {
  const r = ENEMY.radius
  return {
    minX: e.x - r,
    minY: e.y + 0.1,
    minZ: e.z - r,
    maxX: e.x + r,
    maxY: e.y + ENEMY.height,
    maxZ: e.z + r,
  }
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
  if (mode === 'search') {
    e.searchTimer = ENEMY.searchTime
  }
}
