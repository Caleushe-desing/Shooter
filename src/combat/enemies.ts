import { ENEMY } from '../constants'

export type Enemy = {
  id: number
  x: number
  y: number
  z: number
  hp: number
  yaw: number
  attackCd: number
  /** Brief flash when hit. */
  hitFlash: number
  alive: boolean
}

type HitBox = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }

/** Shared mutable enemy list (WeaponSystem + EnemySystem). */
const enemies: Enemy[] = []
let nextId = 1

export function getEnemies(): Enemy[] {
  return enemies
}

export function clearEnemies() {
  enemies.length = 0
}

export function aliveCount() {
  let n = 0
  for (const e of enemies) if (e.alive) n++
  return n
}

export function spawnEnemy(x: number, z: number): Enemy {
  const e: Enemy = {
    id: nextId++,
    x,
    y: 0,
    z,
    hp: ENEMY.hp,
    yaw: 0,
    attackCd: 0,
    hitFlash: 0,
    alive: true,
  }
  enemies.push(e)
  return e
}

/** Damage enemy; returns true if killed. */
export function hurtEnemy(id: number, amount: number): boolean {
  const e = enemies.find((en) => en.id === id && en.alive)
  if (!e) return false
  e.hp -= amount
  e.hitFlash = 0.12
  if (e.hp <= 0) {
    e.alive = false
    e.hp = 0
    return true
  }
  return false
}

export function enemyHitBox(e: Enemy): HitBox {
  const r = ENEMY.radius
  return {
    minX: e.x - r,
    maxX: e.x + r,
    minY: 0,
    maxY: ENEMY.height,
    minZ: e.z - r,
    maxZ: e.z + r,
  }
}

/** Compact dead entries occasionally so the list stays small. */
export function pruneDeadEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].alive) enemies.splice(i, 1)
  }
}
