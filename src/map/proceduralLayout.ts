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

/**
 * Single integrated wood ramp: same material as the table, even rise/run.
 * Returns the top surface Y of the last step (should meet the tabletop).
 */
function addWoodRamp(
  solids: SolidAABB[],
  id: string,
  /** Center X of the ramp. */
  x: number,
  /** Z of the first (lowest) tread center. */
  zStart: number,
  tableTopY: number,
  /** Direction the ramp climbs toward (into the table). */
  dir: 'n' | 's',
  width: number,
) {
  const steps = 5
  const stepH = tableTopY / steps
  const stepD = 1.05
  const sign = dir === 'n' ? -1 : 1

  for (let i = 0; i < steps; i++) {
    const y = i * stepH
    const h = stepH
    const z = zStart + sign * i * stepD
    // Slightly deeper treads so lips are forgiving under stepHeight.
    pushBox(solids, `${id}-${i}`, x, y, z, width, h, stepD + 0.08, MAT.wood, {
      walkable: true,
      kind: 'step',
    })
  }

  return steps * stepH
}

/**
 * Clean giant living room — three solid scale anchors only:
 * wood table (+ ramp), charcoal sofa, industrial bookshelf.
 */
export function generateProceduralMap(seed: number): ProceduralMap {
  const solids: SolidAABB[] = []
  const trenches: Trench[] = []
  const half = ARENA.size * 0.5
  const wallT = 0.65
  const ceilingY = 14

  // —— Room shell ——
  pushBox(solids, 'wall-n', 0, 0, -half + wallT * 0.5, ARENA.size, ceilingY, wallT, MAT.wall, {
    kind: 'wall',
  })
  pushBox(solids, 'wall-s', 0, 0, half - wallT * 0.5, ARENA.size, ceilingY, wallT, MAT.wall, {
    kind: 'wall',
  })
  pushBox(
    solids,
    'wall-e',
    half - wallT * 0.5,
    0,
    0,
    wallT,
    ceilingY,
    ARENA.size - wallT * 2,
    MAT.wallDirty,
    { kind: 'wall' },
  )
  pushBox(
    solids,
    'wall-w',
    -half + wallT * 0.5,
    0,
    0,
    wallT,
    ceilingY,
    ARENA.size - wallT * 2,
    MAT.wallDirty,
    { kind: 'wall' },
  )
  pushBox(
    solids,
    'baseboard',
    0,
    0,
    0,
    ARENA.size - wallT * 2 - 0.4,
    0.28,
    ARENA.size - wallT * 2 - 0.4,
    MAT.baseboard,
    { kind: 'prop' },
  )
  // Hollow the baseboard footprint: actually a thin perimeter only would be nicer,
  // but a flush floor trim slab at y=0 with tiny height is fine as visual skirt —
  // make it non-blocking thin strips instead.
  solids.pop()
  const trim = 0.28
  const trimH = 0.32
  pushBox(solids, 'trim-n', 0, 0, -half + wallT + trim * 0.5, ARENA.size - 2, trimH, trim, MAT.baseboard, {
    kind: 'prop',
  })
  pushBox(solids, 'trim-s', 0, 0, half - wallT - trim * 0.5, ARENA.size - 2, trimH, trim, MAT.baseboard, {
    kind: 'prop',
  })
  pushBox(
    solids,
    'trim-e',
    half - wallT - trim * 0.5,
    0,
    0,
    trim,
    trimH,
    ARENA.size - wallT * 2 - 1,
    MAT.baseboard,
    { kind: 'prop' },
  )
  pushBox(
    solids,
    'trim-w',
    -half + wallT + trim * 0.5,
    0,
    0,
    trim,
    trimH,
    ARENA.size - wallT * 2 - 1,
    MAT.baseboard,
    { kind: 'prop' },
  )

  pushBox(solids, 'ceiling', 0, ceilingY, 0, ARENA.size - 0.5, 0.35, ARENA.size - 0.5, MAT.ceiling, {
    kind: 'roof',
  })

  // —— 1) Main wood table (uniform) — flag sits flush on the top ——
  const tableX = 0
  const tableZ = -10
  const tableW = 9.0
  const tableD = 5.0
  const topThick = 0.28
  const tableTopY = 2.35
  const apronH = 0.35

  // Top slab
  pushBox(solids, 'table-top', tableX, tableTopY, tableZ, tableW, topThick, tableD, MAT.wood, {
    walkable: true,
    kind: 'prop',
  })
  // Apron under top (visual mass, not walkable)
  pushBox(
    solids,
    'table-apron',
    tableX,
    tableTopY - apronH,
    tableZ,
    tableW - 0.5,
    apronH,
    tableD - 0.5,
    MAT.woodDark,
    { kind: 'prop' },
  )
  // Four square legs
  const leg = 0.42
  const legH = tableTopY - apronH
  const insetX = tableW * 0.5 - 0.7
  const insetZ = tableD * 0.5 - 0.7
  for (const [sx, sz, i] of [
    [-1, -1, 0],
    [1, -1, 1],
    [-1, 1, 2],
    [1, 1, 3],
  ] as const) {
    pushBox(
      solids,
      `table-leg-${i}`,
      tableX + sx * insetX,
      0,
      tableZ + sz * insetZ,
      leg,
      legH,
      leg,
      MAT.woodDark,
      { kind: 'prop' },
    )
  }

  // Single south ramp — same wood, clean climb onto the tabletop
  const rampWidth = 3.4
  const rampZ0 = tableZ + tableD * 0.5 + 0.55
  addWoodRamp(solids, 'table-ramp', tableX, rampZ0, tableTopY, 'n', rampWidth)
  // Landing lip flush with table edge (same height as top)
  pushBox(
    solids,
    'table-ramp-lip',
    tableX,
    tableTopY,
    tableZ + tableD * 0.5 - 0.15,
    rampWidth,
    topThick,
    0.55,
    MAT.wood,
    { walkable: true, kind: 'step' },
  )

  const flagY = tableTopY + topThick
  const flag = { x: tableX, y: flagY, z: tableZ }
  const arena = {
    x: tableX,
    z: tableZ,
    radius: 2.8,
    floorY: flagY,
  }

  // —— 2) Charcoal sofa (west) — sober fabric mass for scale / cover ——
  const sofaX = -16
  const sofaZ = 4
  const sofaW = 12
  const sofaD = 4.4
  const seatH = 1.75
  pushBox(solids, 'sofa-seat', sofaX, 0, sofaZ, sofaW, seatH, sofaD, MAT.fabric, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'sofa-back', sofaX, seatH, sofaZ - sofaD * 0.5 + 0.45, sofaW, 2.4, 0.9, MAT.fabricDark, {
    kind: 'prop',
  })
  pushBox(solids, 'sofa-arm-l', sofaX - sofaW * 0.5 + 0.55, seatH, sofaZ, 1.1, 1.15, sofaD, MAT.fabric, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'sofa-arm-r', sofaX + sofaW * 0.5 - 0.55, seatH, sofaZ, 1.1, 1.15, sofaD, MAT.fabric, {
    walkable: true,
    kind: 'prop',
  })

  // —— 3) Industrial bookshelf (east wall) — open frame, tall scale reference ——
  const shelfX = 20
  const shelfZ = -4
  const shelfW = 5.5
  const shelfD = 1.6
  const shelfH = 9.5
  const upright = 0.38
  // Back panel
  pushBox(
    solids,
    'shelf-back',
    shelfX,
    0,
    shelfZ - shelfD * 0.5 + 0.12,
    shelfW,
    shelfH,
    0.24,
    MAT.steelDark,
    { kind: 'prop' },
  )
  // Side uprights
  pushBox(
    solids,
    'shelf-upright-l',
    shelfX - shelfW * 0.5 + upright * 0.5,
    0,
    shelfZ,
    upright,
    shelfH,
    shelfD,
    MAT.steel,
    { kind: 'prop' },
  )
  pushBox(
    solids,
    'shelf-upright-r',
    shelfX + shelfW * 0.5 - upright * 0.5,
    0,
    shelfZ,
    upright,
    shelfH,
    shelfD,
    MAT.steel,
    { kind: 'prop' },
  )
  // Top lintel
  pushBox(solids, 'shelf-top', shelfX, shelfH - 0.28, shelfZ, shelfW, 0.28, shelfD, MAT.steel, {
    kind: 'prop',
  })
  // Horizontal planks
  const plankT = 0.2
  const levels = [0.15, 2.2, 4.2, 6.2, 8.2]
  levels.forEach((y, i) => {
    pushBox(
      solids,
      `shelf-plank-${i}`,
      shelfX,
      y,
      shelfZ,
      shelfW - upright * 2,
      plankT,
      shelfD - 0.1,
      MAT.shelf,
      { walkable: true, kind: 'prop' },
    )
  })

  const spawn = { x: 0, y: 0, z: 20 }

  void seed

  const minimapBuildings = [
    { x: tableX, z: tableZ, w: tableW, d: tableD },
    { x: sofaX, z: sofaZ, w: sofaW, d: sofaD },
    { x: shelfX, z: shelfZ, w: shelfW, d: shelfD },
  ]

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
      width: tableW,
      depth: tableD,
      roofY: flagY,
    },
    minimap: {
      size: ARENA.size,
      buildings: minimapBuildings,
      arena: { x: arena.x, z: arena.z, r: arena.radius },
    },
  }
}
