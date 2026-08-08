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

/** Room clear height — leaves space for aerial walkways. */
export const ROOM_CEILING_Y = 18

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
 * Stable stair run: each tread is a solid block from y=0 up to the tread top,
 * so lips never float short of the landing. Tops land exactly on `surfaceY`.
 *
 * @param landEdgeZ  World Z of the landing edge the stairs climb onto
 * @param overlap    How far the final tread extends past the edge onto the landing
 */
function addStairToSurface(
  solids: SolidAABB[],
  id: string,
  x: number,
  surfaceY: number,
  landEdgeZ: number,
  dir: 'n' | 's',
  width: number,
  color: string = MAT.wood,
  overlap = 0.65,
) {
  const maxRise = 0.48 // under PLAYER.stepHeight (0.55)
  const steps = Math.max(3, Math.ceil(surfaceY / maxRise))
  const stepH = surfaceY / steps
  const stepD = 1.25
  const sign = dir === 'n' ? -1 : 1
  // Final tread center sits on the landing side of the edge (overlap inward).
  const lastZ = landEdgeZ + sign * overlap * 0.5
  const firstZ = lastZ - sign * (steps - 1) * stepD

  for (let i = 0; i < steps; i++) {
    const top = (i + 1) * stepH
    const z = firstZ + sign * i * stepD
    pushBox(solids, `${id}-${i}`, x, 0, z, width, top, stepD + 0.12, color, {
      walkable: true,
      kind: 'step',
    })
  }

  return { steps, stepH, stepD, firstZ, lastZ, surfaceY }
}

/** Stair between two elevated decks (not from ground). */
function addElevatedStairs(
  solids: SolidAABB[],
  id: string,
  x: number,
  z0: number,
  fromY: number,
  toY: number,
  dir: 'n' | 's' | 'e' | 'w',
  width: number,
  color: string = MAT.steel,
) {
  const rise = toY - fromY
  if (rise <= 0.01) return
  const maxRise = 0.48
  const steps = Math.max(2, Math.ceil(rise / maxRise))
  const stepH = rise / steps
  const stepD = 1.15

  for (let i = 0; i < steps; i++) {
    const y = fromY
    const h = (i + 1) * stepH
    let sx = x
    let sz = z0
    let w = width
    let d = stepD + 0.1
    if (dir === 'n') sz = z0 - i * stepD
    if (dir === 's') sz = z0 + i * stepD
    if (dir === 'e') {
      sx = x + i * stepD
      w = stepD + 0.1
      d = width
    }
    if (dir === 'w') {
      sx = x - i * stepD
      w = stepD + 0.1
      d = width
    }
    pushBox(solids, `${id}-${i}`, sx, y, sz, w, h, d, color, {
      walkable: true,
      kind: 'step',
    })
  }
}

/** Closed conduit / tunnel with walkable floor and open ends. */
function addTunnelEW(
  solids: SolidAABB[],
  id: string,
  x: number,
  z: number,
  length: number,
  innerW: number,
  innerH: number,
  wallT: number,
  floorY: number,
) {
  const floorT = 0.35
  const ceilT = 0.3
  // Floor
  pushBox(solids, `${id}-floor`, x, floorY, z, length, floorT, innerW + wallT * 2, MAT.steelDark, {
    walkable: true,
    kind: 'floor',
  })
  // Side walls
  pushBox(
    solids,
    `${id}-wall-n`,
    x,
    floorY + floorT,
    z - innerW * 0.5 - wallT * 0.5,
    length,
    innerH,
    wallT,
    MAT.steel,
    { kind: 'wall' },
  )
  pushBox(
    solids,
    `${id}-wall-s`,
    x,
    floorY + floorT,
    z + innerW * 0.5 + wallT * 0.5,
    length,
    innerH,
    wallT,
    MAT.steel,
    { kind: 'wall' },
  )
  // Ceiling
  pushBox(
    solids,
    `${id}-ceil`,
    x,
    floorY + floorT + innerH,
    z,
    length,
    ceilT,
    innerW + wallT * 2,
    MAT.steelDark,
    { kind: 'roof' },
  )
}

function addTunnelNS(
  solids: SolidAABB[],
  id: string,
  x: number,
  z: number,
  length: number,
  innerW: number,
  innerH: number,
  wallT: number,
  floorY: number,
) {
  const floorT = 0.35
  const ceilT = 0.3
  pushBox(solids, `${id}-floor`, x, floorY, z, innerW + wallT * 2, floorT, length, MAT.steelDark, {
    walkable: true,
    kind: 'floor',
  })
  pushBox(
    solids,
    `${id}-wall-w`,
    x - innerW * 0.5 - wallT * 0.5,
    floorY + floorT,
    z,
    wallT,
    innerH,
    length,
    MAT.steel,
    { kind: 'wall' },
  )
  pushBox(
    solids,
    `${id}-wall-e`,
    x + innerW * 0.5 + wallT * 0.5,
    floorY + floorT,
    z,
    wallT,
    innerH,
    length,
    MAT.steel,
    { kind: 'wall' },
  )
  pushBox(
    solids,
    `${id}-ceil`,
    x,
    floorY + floorT + innerH,
    z,
    innerW + wallT * 2,
    ceilT,
    length,
    MAT.steelDark,
    { kind: 'roof' },
  )
}

/**
 * Giant living-room arena with vertical circuit:
 * furniture cover, flush table stairs to the flag, aerial catwalks, tunnels.
 */
export function generateProceduralMap(seed: number): ProceduralMap {
  const solids: SolidAABB[] = []
  const trenches: Trench[] = []
  const half = ARENA.size * 0.5
  const wallT = 0.65
  const ceilingY = ROOM_CEILING_Y

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

  // —— Main wood table + flush stairs to surface ——
  const tableX = 0
  const tableZ = -10
  const tableW = 9.0
  const tableD = 5.2
  const topThick = 0.3
  const tableTopY = 2.2
  const surfaceY = tableTopY + topThick
  const apronH = 0.3

  pushBox(solids, 'table-top', tableX, tableTopY, tableZ, tableW, topThick, tableD, MAT.wood, {
    walkable: true,
    kind: 'prop',
  })
  // Apron pulled north so it does not collide with the south stair approach.
  pushBox(
    solids,
    'table-apron',
    tableX,
    tableTopY - apronH,
    tableZ - 0.35,
    tableW - 0.6,
    apronH,
    tableD - 1.4,
    MAT.woodDark,
    { kind: 'prop' },
  )
  const leg = 0.42
  const legH = tableTopY - apronH
  const insetX = tableW * 0.5 - 0.7
  const insetZ = tableD * 0.5 - 0.85
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

  const tableSouth = tableZ + tableD * 0.5
  addStairToSurface(
    solids,
    'table-stairs',
    tableX,
    surfaceY,
    tableSouth,
    'n',
    3.6,
    MAT.wood,
    0.85,
  )

  const flag = { x: tableX, y: surfaceY, z: tableZ }
  const arena = {
    x: tableX,
    z: tableZ,
    radius: 2.8,
    floorY: surfaceY,
  }

  // —— Ground cover furniture ——
  const sofaX = -16
  const sofaZ = 2
  const sofaW = 11
  const sofaD = 4.2
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

  const shelfX = 22
  const shelfZ = -6
  const shelfW = 5.2
  const shelfD = 1.6
  const shelfH = 10
  const upright = 0.38
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
  pushBox(solids, 'shelf-top', shelfX, shelfH - 0.28, shelfZ, shelfW, 0.28, shelfD, MAT.steel, {
    kind: 'prop',
  })
  ;[0.15, 2.2, 4.2, 6.2, 8.2].forEach((y, i) => {
    pushBox(
      solids,
      `shelf-plank-${i}`,
      shelfX,
      y,
      shelfZ,
      shelfW - upright * 2,
      0.2,
      shelfD - 0.1,
      MAT.shelf,
      { walkable: true, kind: 'prop' },
    )
  })

  pushBox(solids, 'coffee-top', -8, 1.35, 10, 7.2, 0.22, 3.8, MAT.wood, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'coffee-leg-a', -10.8, 0, 8.6, 0.4, 1.35, 0.4, MAT.woodDark, { kind: 'prop' })
  pushBox(solids, 'coffee-leg-b', -5.2, 0, 8.6, 0.4, 1.35, 0.4, MAT.woodDark, { kind: 'prop' })
  pushBox(solids, 'coffee-leg-c', -10.8, 0, 11.4, 0.4, 1.35, 0.4, MAT.woodDark, { kind: 'prop' })
  pushBox(solids, 'coffee-leg-d', -5.2, 0, 11.4, 0.4, 1.35, 0.4, MAT.woodDark, { kind: 'prop' })

  pushBox(solids, 'armchair-a-seat', -5, 0, -1, 3.4, 1.55, 3.4, MAT.fabricAlt, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'armchair-a-back', -5, 1.55, -2.3, 3.4, 2.1, 0.75, MAT.fabricDark, {
    kind: 'prop',
  })
  pushBox(solids, 'armchair-b-seat', 7, 0, 9, 3.2, 1.55, 3.2, MAT.fabric, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'armchair-b-back', 7, 1.55, 7.7, 3.2, 2.0, 0.7, MAT.fabricDark, {
    kind: 'prop',
  })
  pushBox(solids, 'armchair-c-seat', 14, 0, 18, 3.0, 1.5, 3.0, MAT.fabricAlt, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'armchair-c-back', 14, 1.5, 16.8, 3.0, 1.9, 0.65, MAT.fabricDark, {
    kind: 'prop',
  })

  function addFloorLamp(id: string, x: number, z: number) {
    pushBox(solids, `${id}-base`, x, 0, z, 0.9, 0.2, 0.9, MAT.steelDark, { kind: 'prop' })
    pushBox(solids, `${id}-pole`, x, 0.2, z, 0.22, 3.4, 0.22, MAT.lamp, { kind: 'prop' })
    pushBox(solids, `${id}-shade`, x, 3.4, z, 1.5, 1.1, 1.5, MAT.lampShade, {
      walkable: true,
      kind: 'prop',
    })
  }
  addFloorLamp('lamp-a', -20, 16)
  addFloorLamp('lamp-b', 16, -18)
  addFloorLamp('lamp-c', -6, 20)

  function addBoxStack(id: string, x: number, z: number, tiers: number) {
    let y = 0
    for (let i = 0; i < tiers; i++) {
      const w = 1.8 - i * 0.12
      const h = 1.15
      pushBox(
        solids,
        `${id}-${i}`,
        x + (i % 2) * 0.08,
        y,
        z,
        w,
        h,
        w,
        i % 2 === 0 ? MAT.cardboard : MAT.cardboardDark,
        { walkable: true, kind: 'crate' },
      )
      y += h
    }
  }
  addBoxStack('boxes-se', 18, 22, 3)
  addBoxStack('boxes-sw', -18, 20, 2)
  addBoxStack('boxes-ne', 12, -20, 2)

  function addBookPile(id: string, x: number, z: number, count: number) {
    let y = 0
    for (let i = 0; i < count; i++) {
      const h = 0.38
      pushBox(
        solids,
        `${id}-${i}`,
        x,
        y,
        z,
        1.4 - (i % 3) * 0.08,
        h,
        1.05,
        i % 2 === 0 ? MAT.book : MAT.bookDark,
        { walkable: true, kind: 'step' },
      )
      y += h
    }
  }
  addBookPile('books-sofa', -10, 5, 3)
  addBookPile('books-spawn', 5, 16, 2)

  pushBox(solids, 'console', 20, 0, 12, 4.5, 1.7, 1.4, MAT.woodDark, {
    walkable: true,
    kind: 'prop',
  })
  pushBox(solids, 'console-top', 20, 1.7, 12, 4.7, 0.18, 1.55, MAT.wood, {
    walkable: true,
    kind: 'prop',
  })

  // —— Aerial catwalks / floating decks ——
  const L1 = 4.8
  const L2 = 8.2
  const deckT = 0.32

  // Mezzanine ring segment — west deck
  pushBox(solids, 'deck-w', -18, L1, -4, 8, deckT, 18, MAT.steel, {
    walkable: true,
    kind: 'floor',
  })
  // North catwalk overlooking the flag table
  pushBox(solids, 'deck-n', 0, L1, -22, 22, deckT, 3.6, MAT.steel, {
    walkable: true,
    kind: 'floor',
  })
  // East elevated platform near bookshelf
  pushBox(solids, 'deck-e', 18, L1, 4, 7, deckT, 14, MAT.steel, {
    walkable: true,
    kind: 'floor',
  })
  // Bridge connecting west ↔ east over the room center (north of table)
  pushBox(solids, 'bridge-mid', 0, L1, -16, 14, deckT, 2.8, MAT.steelDark, {
    walkable: true,
    kind: 'floor',
  })
  // Upper observation pad
  pushBox(solids, 'deck-l2', -10, L2, -20, 10, deckT, 6, MAT.steelDark, {
    walkable: true,
    kind: 'floor',
  })
  // Floating island SE
  pushBox(solids, 'deck-float-se', 10, L1 + 0.02, 14, 6, deckT, 5, MAT.steel, {
    walkable: true,
    kind: 'floor',
  })

  // Rails (low walls) on key catwalks — cover + edge feel
  pushBox(solids, 'rail-n-a', 0, L1 + deckT, -23.5, 22, 0.7, 0.22, MAT.steelDark, { kind: 'prop' })
  pushBox(solids, 'rail-bridge-s', 0, L1 + deckT, -14.7, 14, 0.55, 0.2, MAT.steelDark, {
    kind: 'prop',
  })

  // Ground → L1 stairs (south-west approach)
  addStairToSurface(solids, 'stairs-l1-sw', -18, L1 + deckT, 5.5, 'n', 3.2, MAT.steel, 0.7)
  // Ground → L1 stairs (south-east)
  addStairToSurface(solids, 'stairs-l1-se', 18, L1 + deckT, 11.5, 'n', 3.2, MAT.steel, 0.7)
  // L1 → L2 stairs on north-west
  addElevatedStairs(solids, 'stairs-l2', -12, -18, L1 + deckT, L2 + deckT, 'n', 3.0, MAT.steelDark)
  // Stairs from ground onto SE floating deck
  addStairToSurface(solids, 'stairs-float-se', 10, L1 + deckT + 0.02, 16.6, 'n', 3.0, MAT.steel, 0.7)
  // Link floating SE deck toward east deck with a short bridge + steps
  pushBox(solids, 'bridge-se', 14, L1, 8, 3.2, deckT, 8, MAT.steelDark, {
    walkable: true,
    kind: 'floor',
  })

  // —— Tunnels / conduits ——
  // East–west ground conduit (ambush lane under the coffee-table belt)
  addTunnelEW(solids, 'tunnel-ew', 0, 16, 40, 3.4, 2.5, 0.4, 0)
  // North–south shortcut along the east side (under east deck)
  addTunnelNS(solids, 'tunnel-ns', 12, 0, 28, 3.2, 2.5, 0.4, 0)
  // Raised duct crossing mid-room (shortcut between decks, crawl / ambush)
  addTunnelEW(solids, 'duct-air', -2, -8, 16, 2.8, 2.2, 0.35, L1 - 0.35)
  // Pads linking catwalks into the aerial duct ends
  pushBox(solids, 'duct-pad-w', -10, L1, -8, 3.5, deckT, 4.2, MAT.steel, {
    walkable: true,
    kind: 'floor',
  })
  pushBox(solids, 'duct-pad-e', 6, L1, -8, 3.5, deckT, 4.2, MAT.steel, {
    walkable: true,
    kind: 'floor',
  })
  pushBox(solids, 'duct-link-n', -2, L1, -12, 8, deckT, 3.2, MAT.steelDark, {
    walkable: true,
    kind: 'floor',
  })

  // Access ramps into the EW tunnel from spawn side (slight lip)
  pushBox(solids, 'tunnel-ew-lip-e', 18, 0, 16, 2.2, 0.35, 3.8, MAT.steel, {
    walkable: true,
    kind: 'step',
  })
  pushBox(solids, 'tunnel-ew-lip-w', -18, 0, 16, 2.2, 0.35, 3.8, MAT.steel, {
    walkable: true,
    kind: 'step',
  })

  // Soft trench alcove under sofa front as extra low cover
  trenches.push({
    id: 'cove-sofa',
    x: -16,
    z: 6.5,
    width: 8,
    depth: 3.2,
    floorY: -0.4,
    color: MAT.floor,
  })

  const spawn = { x: 0, y: 0, z: 24 }
  void seed

  const minimapBuildings = [
    { x: tableX, z: tableZ, w: tableW, d: tableD },
    { x: sofaX, z: sofaZ, w: sofaW, d: sofaD },
    { x: shelfX, z: shelfZ, w: shelfW, d: shelfD },
    { x: -18, z: -4, w: 8, d: 18 },
    { x: 0, z: -22, w: 22, d: 3.6 },
    { x: 0, z: 16, w: 40, d: 4 },
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
      roofY: surfaceY,
    },
    minimap: {
      size: ARENA.size,
      buildings: minimapBuildings,
      arena: { x: arena.x, z: arena.z, r: arena.radius },
    },
  }
}
