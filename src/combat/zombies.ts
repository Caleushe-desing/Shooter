import { ZOMBIE } from '../constants'

export type Zombie = {
  id: number
  x: number
  z: number
  yaw: number
  hp: number
  alive: boolean
  /** Seconds remaining of stun (cannot move / catch). */
  stun: number
  /** Patrol waypoint index. */
  waypoint: number
  /** Flash on hit. */
  hitFlash: number
  chasing: boolean
}

type HitBox = {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

let nextId = 1
let zombies: Zombie[] = []

export function getZombies(): Zombie[] {
  return zombies
}

export function clearZombies() {
  zombies = []
  nextId = 1
}

export function aliveZombieCount() {
  let n = 0
  for (const z of zombies) if (z.alive) n++
  return n
}

export function spawnZombie(x: number, z: number, waypoint = 0): Zombie {
  const zom: Zombie = {
    id: nextId++,
    x,
    z,
    yaw: Math.random() * Math.PI * 2,
    hp: ZOMBIE.hp,
    alive: true,
    stun: 0,
    waypoint,
    hitFlash: 0,
    chasing: false,
  }
  zombies.push(zom)
  return zom
}

/** Damage a zombie. Returns true if killed. */
export function hurtZombie(id: number, amount: number): boolean {
  const z = zombies.find((en) => en.id === id && en.alive)
  if (!z) return false
  z.hp -= amount
  z.hitFlash = 0.25
  z.stun = Math.max(z.stun, ZOMBIE.stunTime)
  if (z.hp <= 0) {
    z.alive = false
    return true
  }
  return false
}

export function zombieHitBox(z: Zombie): HitBox {
  const r = ZOMBIE.radius
  return {
    minX: z.x - r,
    minY: 0,
    minZ: z.z - r,
    maxX: z.x + r,
    maxY: ZOMBIE.height,
    maxZ: z.z + r,
  }
}

export function pruneDeadZombies() {
  for (let i = zombies.length - 1; i >= 0; i--) {
    if (!zombies[i].alive) zombies.splice(i, 1)
  }
}
