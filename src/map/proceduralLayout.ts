import { ARENA } from '../constants'
import { MAT } from './materials'

export type SolidAABB = {
  id: string
  x: number
  y: number
  z: number
  width: number
  depth: number
  height: number
  color: string
  walkable: boolean
  kind: 'wall' | 'floor' | 'crate' | 'concrete' | 'step' | 'roof' | 'prop'
}

export type Trench = {
  id: string
  x: number
  z: number
  width: number
  depth: number
  floorY: number
  color: string
}

export type FlagMarker = { x: number; y: number; z: number }

export type ProceduralMap = {
  seed: number
  solids: SolidAABB[]
  trenches: Trench[]
  flag: FlagMarker
  spawn: { x: number; y: number; z: number }
  arena: { x: number; z: number; radius: number; floorY: number }
  hq: { x: number; z: number; width: number; depth: number; roofY: number }
  minimap: {
    size: number
    buildings: { x: number; z: number; w: number; d: number }[]
    arena: { x: number; z: number; r: number }
  }
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type BoxOpts = {
  walkable?: boolean
  kind?: SolidAABB['kind']
}

function pushBox(
  solids: SolidAABB[],
  id: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color: string,
  opts: BoxOpts = {},
) {
  solids.push({
    id,
    x,
    y,
    z,
    width,
    depth,
    height,
    color,
    walkable: opts.walkable ?? false,
    kind: opts.kind ?? 'prop',
  })
}

/** Stack of oversized books used as climbable steps. */
function addBookStack(
  solids: SolidAABB[],
  id: string,
  x: number,
  z: number,
  baseY: number,
  steps: number,
  dir: 'n' | 's' | 'e' | 'w',
  colors: string[],
) {
  const stepH = 0.42
  const stepD = 0.95
  const stepW = 1.35
  for (let i = 0; i < steps; i++) {
    const y = baseY + i * stepH
    let bx = x
    let bz = z
    let w = stepW
    let d = stepD
    if (dir === 'n') bz = z - i * stepD
    if (dir === 's') bz = z + i * stepD
    if (dir === 'e') {
      bx = x + i * stepD
      w = stepD
      d = stepW
    }
    if (dir === 'w') {
      bx = x - i * stepD
      w = stepD
      d = stepW
    }
    pushBox(
      solids,
      `${id}-${i}`,
      bx,
      y,
      bz,
      w,
      stepH,
      d,
      colors[i % colors.length],
      { walkable: true, kind: 'step' },
    )
  }
  return baseY + steps * stepH
}

/**
 * Giant living-room battlefield: furniture as cover, flag on a tall table.
 * Player scale feels small — sofa backs tower overhead, books are stairs.
 */
export function generateProceduralMap(seed: number): ProceduralMap {
  const rng = mulberry32(seed)
  const solids: SolidAABB[] = []
  const trenches: Trench[] = []
  const half = ARENA.size * 0.5
  const wallT = 0.7
  const ceilingY = 16

  // —— Room shell ——
  pushBox(solids, 'wall-n', 0, 0, -half + wallT * 0.5, ARENA.size, ceilingY, wallT, MAT.wall, {
    kind: 'wall',
  })
  pushBox(solids, 'wall-s', 0, 0, half - wallT * 0.5, ARENA.size, ceilingY, wallT, MAT.wall, {
    kind: 'wall',
  })
  pushBox(solids, 'wall-e', half - wallT * 0.5, 0, 0, wallT, ceilingY, ARENA.size - wallT * 2, MAT.wall, {
    kind: 'wall',
  })
  pushBox(solids, 'wall-w', -half + wallT * 0.5, 0, 0, wallT, ceilingY, ARENA.size - wallT * 2, MAT.wall, {
    kind: 'wall',
  })
  // Door gap on south wall — carve by not blocking the doorway with an extra solid;
  // instead leave a thinner opening via side jambs (south wall still spans; spawn inside).
  pushBox(solids, 'baseboard-n', 0, 0, -half + wallT + 0.15, ARENA.size - 2, 0.35, 0.3, MAT.baseboard, {
    kind: 'prop',
  })

  // Ceiling (walkable roof collision for boom rays / stand checks)
  pushBox(solids, 'ceiling', 0, ceilingY, 0, ARENA.size - 0.4, 0.4, ARENA.size - 0.4, MAT.ceiling, {
    kind: 'roof',
  })

  // —— Rug “trench” cover pits (low carpet dips between furniture) ——
  trenches.push({
    id: 'rug-pit-living',
    x: -6,
    z: 4,
    width: 10,
    depth: 7,
    floorY: -0.35,
    color: MAT.rug,
  })
  trenches.push({
    id: 'rug-pit-hall',
    x: 10,
    z: -2,
    width: 6,
    depth: 5,
    floorY: -0.28,
    color: MAT.floorDark,
  })

  // —— Giant sofa (north-west) — seat cover + tall back ——
  const sofaX = -14
  const sofaZ = -8
  pushBox(solids, 'sofa-seat', sofaX, 0, sofaZ, 14, 1.9, 4.2, MAT.sofa, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'sofa-back', sofaX, 1.9, sofaZ - 1.7, 14, 2.8, 1.0, MAT.sofaCushion, {
    kind: 'prop',
  })
  pushBox(solids, 'sofa-arm-l', sofaX - 6.3, 1.9, sofaZ, 1.2, 1.4, 4.2, MAT.sofa, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'sofa-arm-r', sofaX + 6.3, 1.9, sofaZ, 1.2, 1.4, 4.2, MAT.sofa, {
    walkable: true,
    kind: 'prop',
  })
  // Cushions (visual height bump / cover lips)
  pushBox(solids, 'sofa-cush-1', sofaX - 3.5, 1.9, sofaZ + 0.3, 4.2, 0.45, 3.0, MAT.sofaCushion, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'sofa-cush-2', sofaX + 3.5, 1.9, sofaZ + 0.3, 4.2, 0.45, 3.0, MAT.sofaCushion, {
    walkable: true,
    kind: 'prop',
  })

  // —— Coffee table (center living) — crawl/cover under is trench; top is mid platform ——
  pushBox(solids, 'coffee-top', -6, 1.55, 5, 6.5, 0.28, 3.6, MAT.woodPale, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'coffee-leg-1', -8.4, 0, 3.6, 0.45, 1.55, 0.45, MAT.woodDark, { kind: 'prop' })
  pushBox(solids, 'coffee-leg-2', -3.6, 0, 3.6, 0.45, 1.55, 0.45, MAT.woodDark, { kind: 'prop' })
  pushBox(solids, 'coffee-leg-3', -8.4, 0, 6.4, 0.45, 1.55, 0.45, MAT.woodDark, { kind: 'prop' })
  pushBox(solids, 'coffee-leg-4', -3.6, 0, 6.4, 0.45, 1.55, 0.45, MAT.woodDark, { kind: 'prop' })

  // —— Armchair ——
  pushBox(solids, 'chair-seat', 4, 0, 8, 3.2, 1.7, 3.2, MAT.fabric, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'chair-back', 4, 1.7, 6.7, 3.2, 2.4, 0.7, MAT.fabric, { kind: 'prop' })

  // —— Bed (east) ——
  pushBox(solids, 'bed-frame', 18, 0, 6, 7.5, 0.9, 11, MAT.wood, { walkable: true, kind: 'prop' })
  pushBox(solids, 'bed-mattress', 18, 0.9, 6, 7.0, 0.7, 10.2, MAT.mattress, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'bed-pillow', 18, 1.6, 1.4, 5.5, 0.45, 1.6, MAT.sheet, {
    walkable: true,
    kind: 'prop',
  })

  // —— Kitchen island / counter (west) — mid-high cover ——
  pushBox(solids, 'counter-base', -20, 0, 14, 10, 2.6, 3.4, MAT.counter, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'counter-top', -20, 2.6, 14, 10.4, 0.25, 3.8, MAT.ceramic, {
    walkable: true,
    kind: 'prop',
  })

  // —— Dining table (center-north) — FLAG lives on top ——
  const tableX = 2
  const tableZ = -18
  const tableH = 3.4
  pushBox(solids, 'dining-top', tableX, tableH, tableZ, 8.5, 0.32, 5.2, MAT.wood, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'dining-leg-1', tableX - 3.6, 0, tableZ - 2.0, 0.55, tableH, 0.55, MAT.woodDark, {
    kind: 'prop',
  })
  pushBox(solids, 'dining-leg-2', tableX + 3.6, 0, tableZ - 2.0, 0.55, tableH, 0.55, MAT.woodDark, {
    kind: 'prop',
  })
  pushBox(solids, 'dining-leg-3', tableX - 3.6, 0, tableZ + 2.0, 0.55, tableH, 0.55, MAT.woodDark, {
    kind: 'prop',
  })
  pushBox(solids, 'dining-leg-4', tableX + 3.6, 0, tableZ + 2.0, 0.55, tableH, 0.55, MAT.woodDark, {
    kind: 'prop',
  })

  // Capture volume on the tabletop
  const flag = {
    x: tableX,
    y: tableH + 0.32,
    z: tableZ,
  }
  const arena = {
    x: tableX,
    z: tableZ,
    radius: 3.6,
    floorY: tableH + 0.32,
  }

  // —— Climb route A: books from south up onto the table ——
  const bookColors = [MAT.bookRed, MAT.bookBlue, MAT.bookGreen, MAT.bookTan]
  addBookStack(solids, 'books-s', tableX, tableZ + 5.8, 0, 5, 'n', bookColors)
  // Final lip onto table from the top book
  pushBox(solids, 'books-lip', tableX, 2.1, tableZ + 2.9, 1.5, 1.3, 1.1, MAT.bookTan, {
    walkable: true,
    kind: 'step',
  })

  // —— Climb route B: chairs as intermediate platforms from the east ——
  pushBox(solids, 'dine-chair-1', tableX + 6.2, 0, tableZ + 1.5, 2.2, 1.55, 2.2, MAT.woodPale, {
    walkable: true,
    kind: 'step',
  })
  pushBox(solids, 'dine-chair-1b', tableX + 6.2, 1.55, tableZ + 2.3, 2.2, 1.1, 0.55, MAT.wood, {
    kind: 'prop',
  })
  pushBox(solids, 'dine-chair-2', tableX + 5.4, 0, tableZ - 0.2, 2.4, 2.35, 2.4, MAT.woodPale, {
    walkable: true,
    kind: 'step',
  })
  pushBox(solids, 'dine-chair-bridge', tableX + 4.0, 2.35, tableZ - 0.2, 2.0, 0.35, 1.8, MAT.bookBlue, {
    walkable: true,
    kind: 'step',
  })
  pushBox(solids, 'dine-chair-lip', tableX + 3.2, 2.7, tableZ - 0.2, 1.4, 0.7, 1.6, MAT.bookGreen, {
    walkable: true,
    kind: 'step',
  })

  // —— Climb route C: books from west near kitchen ——
  addBookStack(solids, 'books-w', tableX - 6.5, tableZ, 0, 4, 'e', bookColors)
  pushBox(solids, 'books-w-lip', tableX - 3.5, 1.68, tableZ, 1.2, 1.72, 1.5, MAT.bookRed, {
    walkable: true,
    kind: 'step',
  })

  // —— Scattered crates / toy boxes as low cover ——
  const crates = [
    { x: 12, z: 18, w: 2.2, h: 1.4, d: 2.2 },
    { x: 15, z: 16, w: 1.8, h: 1.1, d: 1.8 },
    { x: -8, z: 18, w: 2.5, h: 1.6, d: 2.0 },
    { x: 8, z: -6, w: 2.0, h: 1.2, d: 2.0 },
  ]
  crates.forEach((c, i) => {
    pushBox(solids, `crate-${i}`, c.x, 0, c.z, c.w, c.h, c.d, MAT.woodPale, {
      walkable: true,
      kind: 'crate',
    })
  })

  // Mild seed jitter so regenerate feels alive without breaking climbs
  void rng

  const spawn = { x: 0, y: 0, z: 22 }

  const minimapBuildings = solids
    .filter((s) => s.kind === 'prop' || s.kind === 'crate')
    .filter((s) => s.height >= 1.2)
    .map((s) => ({ x: s.x, z: s.z, w: s.width, d: s.depth }))

  return {
    seed,
    solids,
    trenches,
    flag,
    spawn,
    arena,
    hq: {
      x: tableX,
      z: tableZ,
      width: 8.5,
      depth: 5.2,
      roofY: tableH + 0.32,
    },
    minimap: {
      size: ARENA.size,
      buildings: minimapBuildings,
      arena: { x: arena.x, z: arena.z, r: arena.radius },
    },
  }
}
