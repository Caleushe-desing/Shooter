import { GHOST } from '../constants'

export type GhostMode = 'patrol' | 'chase' | 'search'

export type Ghost = {
  id: number
  x: number
  z: number
  yaw: number
  hp: number
  alive: boolean
  stun: number
  waypoint: number
  hitFlash: number
  mode: GhostMode
  /** Last place the player was seen / heard / reported. */
  lastKnownX: number
  lastKnownZ: number
  /**
   * Search countdown (seconds).
   * For chase→search: starts when LOS lost.
   * For kill-spawns: starts after arriving at last-known.
   */
  searchTimer: number
  /** Kill-spawn: waiting to arrive before starting the 10s search clock. */
  awaitArrival: boolean
  alert: boolean
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

export type SpawnGhostOpts = {
  waypoint?: number
  mode?: GhostMode
  lastKnownX?: number
  lastKnownZ?: number
  awaitArrival?: boolean
  searchTimer?: number
  alert?: boolean
}

export function spawnGhost(x: number, z: number, opts: SpawnGhostOpts = {}): Ghost {
  const ghost: Ghost = {
    id: nextId++,
    x,
    z,
    yaw: Math.random() * Math.PI * 2,
    hp: GHOST.hp,
    alive: true,
    stun: 0,
    waypoint: opts.waypoint ?? 0,
    hitFlash: 0,
    mode: opts.mode ?? 'patrol',
    lastKnownX: opts.lastKnownX ?? x,
    lastKnownZ: opts.lastKnownZ ?? z,
    searchTimer: opts.searchTimer ?? 0,
    awaitArrival: opts.awaitArrival ?? false,
    alert: opts.alert ?? (opts.mode === 'chase' || opts.mode === 'search'),
  }
  ghosts.push(ghost)
  return ghost
}

/** Damage a ghost. Returns death position if banished, else null. */
export function hurtGhost(
  id: number,
  amount: number,
): { x: number; z: number } | null {
  const g = ghosts.find((en) => en.id === id && en.alive)
  if (!g) return null
  g.hp -= amount
  g.hitFlash = 0.25
  g.stun = Math.max(g.stun, GHOST.stunTime)
  if (g.hp <= 0) {
    g.alive = false
    return { x: g.x, z: g.z }
  }
  return null
}

export function ghostHitBox(g: Ghost) {
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

export function alertGhost(
  g: Ghost,
  lx: number,
  lz: number,
  mode: GhostMode = 'chase',
) {
  g.mode = mode
  g.alert = true
  g.lastKnownX = lx
  g.lastKnownZ = lz
  if (mode === 'search') {
    g.searchTimer = GHOST.searchTime
    g.awaitArrival = false
  }
}
