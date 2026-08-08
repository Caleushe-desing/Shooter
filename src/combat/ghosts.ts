import { GHOST } from '../constants'

export type Ghost = {
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
let ghosts: Ghost[] = []

export function getGhosts(): Ghost[] {
  return ghosts
}

export function clearGhosts() {
  ghosts = []
  nextId = 1
}

export function aliveGhostCount() {
  let n = 0
  for (const g of ghosts) if (g.alive) n++
  return n
}

export function spawnGhost(x: number, z: number, waypoint = 0): Ghost {
  const ghost: Ghost = {
    id: nextId++,
    x,
    z,
    yaw: Math.random() * Math.PI * 2,
    hp: GHOST.hp,
    alive: true,
    stun: 0,
    waypoint,
    hitFlash: 0,
    chasing: false,
  }
  ghosts.push(ghost)
  return ghost
}

/** Damage a ghost. Returns true if banished. */
export function hurtGhost(id: number, amount: number): boolean {
  const g = ghosts.find((en) => en.id === id && en.alive)
  if (!g) return false
  g.hp -= amount
  g.hitFlash = 0.25
  g.stun = Math.max(g.stun, GHOST.stunTime)
  if (g.hp <= 0) {
    g.alive = false
    return true
  }
  return false
}

export function ghostHitBox(g: Ghost): HitBox {
  const r = GHOST.radius
  return {
    minX: g.x - r,
    minY: 0.15,
    minZ: g.z - r,
    maxX: g.x + r,
    maxY: GHOST.height,
    maxZ: g.z + r,
  }
}

export function pruneDeadGhosts() {
  for (let i = ghosts.length - 1; i >= 0; i--) {
    if (!ghosts[i].alive) ghosts.splice(i, 1)
  }
}
