import { ARENA, ENEMY, type SolidBox } from '../constants'
import { buildHavenInspiredMap } from '../map/havenLayout'

const CELL = 2
const CLEAR = ENEMY.radius + 0.42
const SOLIDS = buildHavenInspiredMap().solids

const half = ARENA.size / 2
const cols = Math.floor(ARENA.size / CELL)
const rows = cols

function cellCenter(cx: number, cz: number) {
  return {
    x: -half + (cx + 0.5) * CELL,
    z: -half + (cz + 0.5) * CELL,
  }
}

function worldToCell(x: number, z: number) {
  const cx = Math.floor((x + half) / CELL)
  const cz = Math.floor((z + half) / CELL)
  return {
    cx: Math.max(0, Math.min(cols - 1, cx)),
    cz: Math.max(0, Math.min(rows - 1, cz)),
  }
}

function hitsBlockingSolid(x: number, z: number, radius: number, solids: readonly SolidBox[]) {
  for (const box of solids) {
    // Only tall blockers — ignore low pads / stair lips as path blockers.
    if (box.maxY <= 1.15) continue
    if (box.maxY - box.minY < 1.2) continue
    const halfW = box.w * 0.5 + radius
    const halfD = box.d * 0.5 + radius
    if (Math.abs(x - box.x) <= halfW && Math.abs(z - box.z) <= halfD) return true
  }
  return false
}

const walkable: boolean[] = new Array(cols * rows)
for (let cz = 0; cz < rows; cz++) {
  for (let cx = 0; cx < cols; cx++) {
    const { x, z } = cellCenter(cx, cz)
    walkable[cz * cols + cx] = !hitsBlockingSolid(x, z, CLEAR, SOLIDS)
  }
}

function idx(cx: number, cz: number) {
  return cz * cols + cx
}

function nearestWalkable(x: number, z: number): { cx: number; cz: number } {
  const start = worldToCell(x, z)
  if (walkable[idx(start.cx, start.cz)]) return start
  for (let r = 1; r <= 8; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue
        const cx = start.cx + dx
        const cz = start.cz + dz
        if (cx < 0 || cz < 0 || cx >= cols || cz >= rows) continue
        if (walkable[idx(cx, cz)]) return { cx, cz }
      }
    }
  }
  return start
}

type Node = { cx: number; cz: number; g: number; f: number; px: number; pz: number }

/**
 * A* on a coarse walkability grid. Returns world waypoints (cell centers),
 * or empty if no path. Paths stay in open corridors so hunters stop ramming walls.
 */
export function findPath(fromX: number, fromZ: number, toX: number, toZ: number): { x: number; z: number }[] {
  const start = nearestWalkable(fromX, fromZ)
  const goal = nearestWalkable(toX, toZ)
  if (!walkable[idx(start.cx, start.cz)] || !walkable[idx(goal.cx, goal.cz)]) return []

  const open: Node[] = []
  const came = new Int32Array(cols * rows).fill(-1)
  const gScore = new Float32Array(cols * rows).fill(Infinity)
  const closed = new Uint8Array(cols * rows)

  const sIdx = idx(start.cx, start.cz)
  gScore[sIdx] = 0
  open.push({
    cx: start.cx,
    cz: start.cz,
    g: 0,
    f: Math.hypot(goal.cx - start.cx, goal.cz - start.cz),
    px: -1,
    pz: -1,
  })

  const nbrs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, 1.42],
    [1, -1, 1.42],
    [-1, 1, 1.42],
    [-1, -1, 1.42],
  ] as const

  let found = false
  let guard = 0
  while (open.length > 0 && guard++ < 4000) {
    let bestI = 0
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestI].f) bestI = i
    }
    const cur = open[bestI]
    open[bestI] = open[open.length - 1]
    open.pop()
    const cIdx = idx(cur.cx, cur.cz)
    if (closed[cIdx]) continue
    closed[cIdx] = 1
    if (cur.cx === goal.cx && cur.cz === goal.cz) {
      found = true
      break
    }

    for (const [dx, dz, cost] of nbrs) {
      const nx = cur.cx + dx
      const nz = cur.cz + dz
      if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue
      const nIdx = idx(nx, nz)
      if (!walkable[nIdx] || closed[nIdx]) continue
      // Block diagonal corner-cutting through walls.
      if (dx !== 0 && dz !== 0) {
        if (!walkable[idx(cur.cx + dx, cur.cz)] || !walkable[idx(cur.cx, cur.cz + dz)]) continue
      }
      const tg = cur.g + cost
      if (tg >= gScore[nIdx]) continue
      gScore[nIdx] = tg
      came[nIdx] = cIdx
      const h = Math.hypot(goal.cx - nx, goal.cz - nz)
      open.push({ cx: nx, cz: nz, g: tg, f: tg + h, px: cur.cx, pz: cur.cz })
    }
  }

  if (!found) return []

  // Reconstruct
  const cells: { cx: number; cz: number }[] = []
  let c = idx(goal.cx, goal.cz)
  const startI = idx(start.cx, start.cz)
  while (c !== startI && c >= 0) {
    cells.push({ cx: c % cols, cz: Math.floor(c / cols) })
    c = came[c]
  }
  cells.reverse()

  // Skip the first cell if we're already near it; keep goal.
  const points: { x: number; z: number }[] = []
  for (const cell of cells) {
    const p = cellCenter(cell.cx, cell.cz)
    if (points.length === 0 && Math.hypot(p.x - fromX, p.z - fromZ) < CELL * 0.35) continue
    points.push(p)
  }
  // Exact goal as final point when walkable-ish.
  if (points.length === 0 || Math.hypot(points[points.length - 1].x - toX, points[points.length - 1].z - toZ) > 0.8) {
    points.push({ x: toX, z: toZ })
  }
  return points
}

/** True when a straight segment stays in walkable cells (quick LOS for path reuse). */
export function hasNavLine(ax: number, az: number, bx: number, bz: number): boolean {
  const dist = Math.hypot(bx - ax, bz - az)
  if (dist < 0.2) return true
  const steps = Math.max(2, Math.ceil(dist / (CELL * 0.5)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = ax + (bx - ax) * t
    const z = az + (bz - az) * t
    const { cx, cz } = worldToCell(x, z)
    if (!walkable[idx(cx, cz)]) return false
  }
  return true
}
