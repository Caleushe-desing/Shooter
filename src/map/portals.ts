import { ARENA, PORTAL, PLAYER, type SolidBox } from '../constants'
import { buildHavenInspiredMap } from './havenLayout'

export type PortalSpot = {
  id: number
  x: number
  z: number
  /** Facing yaw for the vertical ring (radians). */
  yaw: number
}

const MAP_SOLIDS = buildHavenInspiredMap().solids

let portals: PortalSpot[] = []
let nextPortalIndex = 0
let placedForRun = -1

export function getPortals(): PortalSpot[] {
  return portals
}

export function clearPortals() {
  portals = []
  nextPortalIndex = 0
  placedForRun = -1
}

/** Next portal in round-robin order for ghost spawns. */
export function takeNextPortal(): PortalSpot {
  if (portals.length === 0) {
    return { id: 0, x: 0, z: -20, yaw: 0 }
  }
  const p = portals[nextPortalIndex % portals.length]
  nextPortalIndex++
  return p
}

function circleHitsSolid(x: number, z: number, radius: number, solids: readonly SolidBox[]) {
  for (const box of solids) {
    const halfW = box.w * 0.5 + radius
    const halfD = box.d * 0.5 + radius
    if (Math.abs(x - box.x) <= halfW && Math.abs(z - box.z) <= halfD) return true
  }
  return false
}

function isFreeSpot(x: number, z: number, placed: PortalSpot[]) {
  const r = PORTAL.radius + 0.6
  if (circleHitsSolid(x, z, r, MAP_SOLIDS)) return false
  if (Math.hypot(x - PLAYER.spawn.x, z - PLAYER.spawn.z) < PORTAL.clearPlayer) return false
  for (const p of placed) {
    if (Math.hypot(x - p.x, z - p.z) < PORTAL.minSeparation) return false
  }
  return true
}

/**
 * Place PORTAL.count portals at random free spots.
 */
export function placePortalsRandom(): PortalSpot[] {
  portals = []
  nextPortalIndex = 0
  const half = ARENA.size / 2 - PORTAL.margin
  const placed: PortalSpot[] = []

  for (let i = 0; i < PORTAL.count; i++) {
    let x = 0
    let z = 0
    let found = false
    for (let attempt = 0; attempt < PORTAL.placeAttempts; attempt++) {
      const cx = (Math.random() * 2 - 1) * half
      const cz = (Math.random() * 2 - 1) * half
      if (!isFreeSpot(cx, cz, placed)) continue
      x = cx
      z = cz
      found = true
      break
    }
    if (!found) {
      const a = (i / PORTAL.count) * Math.PI * 2 + Math.random() * 0.4
      x = Math.cos(a) * (half * 0.72)
      z = Math.sin(a) * (half * 0.72)
    }
    placed.push({
      id: i,
      x,
      z,
      yaw: Math.atan2(-x, -z) + Math.PI / 2,
    })
  }

  portals = placed
  return portals
}

/** Idempotent per runId — safe to call from PortalSystem and GhostSystem. */
export function ensurePortalsForRun(runId: number): PortalSpot[] {
  if (placedForRun === runId && portals.length === PORTAL.count) return portals
  placePortalsRandom()
  placedForRun = runId
  nextPortalIndex = 0
  return portals
}
