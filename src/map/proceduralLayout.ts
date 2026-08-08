import { ARENA } from '../constants'
import { MAT } from './materials'
import { createRubikCollisionSolids } from './rubiksWall'

/** Axis-aligned solid with explicit vertical extent (y = minY, height → maxY). */
export type SolidAABB = {
  id: string
  x: number
  y: number
  z: number
  width: number
  depth: number
  height: number
  color: string
  /** If true, the top face is a walkable support surface. */
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

export type FlagMarker = {
  x: number
  y: number
  z: number
}

export type MinimapBuilding = {
  x: number
  z: number
  w: number
  d: number
}

export type SettlementZone = 'lower' | 'inner' | 'upper'

export type ProceduralMap = {
  seed: number
  solids: SolidAABB[]
  trenches: Trench[]
  flag: FlagMarker
  spawn: { x: number; y: number; z: number }
  /** Circular control arena in the Upper Quarter. */
  arena: {
    x: number
    z: number
    radius: number
    floorY: number
  }
  hq: {
    x: number
    z: number
    width: number
    depth: number
    roofY: number
  }
  minimap: {
    size: number
    buildings: MinimapBuilding[]
    arena: { x: number; z: number; r: number }
  }
}

/** Zone layout (Z increases south → north inverted: we use +Z as south for spawn). */
export const ZONES = {
  /** Outer / Lower Quarter — south approach */
  lower: { zMin: 8, zMax: 34, y: 0 },
  /** Mid / Inner Quarter — defense corridors */
  inner: { zMin: -10, zMax: 8, y: 0.15 },
  /** Upper Quarter — elevated keep + circular arena */
  upper: { zMin: -32, zMax: -10, y: 2.4 },
} as const

const ARENA_RADIUS = 7.5

/** Mulberry32 — deterministic PRNG from a 32-bit seed. */
function createRng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

let _id = 0
function nid(prefix: string) {
  _id += 1
  return `${prefix}-${_id}`
}

function box(
  id: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color: string,
  walkable: boolean,
  kind: SolidAABB['kind'],
): SolidAABB {
  return { id, x, y, z, width, height, depth, color, walkable, kind }
}

function add(solids: SolidAABB[], s: SolidAABB) {
  solids.push(s)
}

type DoorSide = 'n' | 's' | 'e' | 'w'

/** Wall face with optional door (ground) and window opening. */
function addWallFace(
  solids: SolidAABB[],
  opts: {
    x: number
    y: number
    z: number
    length: number
    height: number
    thickness: number
    axis: 'x' | 'z'
    color: string
    door?: boolean
    doorW?: number
    window?: boolean
  },
) {
  const { x, y, z, length, height, thickness, axis, color } = opts
  const doorW = opts.doorW ?? Math.min(2.6, length * 0.4)
  const winW = Math.min(1.35, length * 0.32)
  const winH = 1.05
  const sill = 1.05
  const t = thickness

  const place = (cx: number, cy: number, cz: number, along: number, h: number) => {
    if (along < 0.08 || h < 0.08) return
    if (axis === 'x') {
      add(solids, box(nid('hw'), cx, cy, cz, along, h, t, color, false, 'wall'))
    } else {
      add(solids, box(nid('hw'), cx, cy, cz, t, h, along, color, false, 'wall'))
    }
  }

  if (opts.door) {
    const side = (length - doorW) * 0.5
    if (axis === 'x') {
      place(x - length * 0.5 + side * 0.5, y, z, side, height)
      place(x + length * 0.5 - side * 0.5, y, z, side, height)
      // Lintel over door
      place(x, y + 2.15, z, doorW + 0.1, Math.max(0.2, height - 2.15))
    } else {
      place(x, y, z - length * 0.5 + side * 0.5, side, height)
      place(x, y, z + length * 0.5 - side * 0.5, side, height)
      place(x, y + 2.15, z, doorW + 0.1, Math.max(0.2, height - 2.15))
    }
    return
  }

  if (opts.window && height > sill + winH + 0.35) {
    const side = (length - winW) * 0.5
    // Below window
    place(x, y, z, length, sill)
    // Sides of window
    if (axis === 'x') {
      place(x - length * 0.5 + side * 0.5, y + sill, z, side, winH)
      place(x + length * 0.5 - side * 0.5, y + sill, z, side, winH)
    } else {
      place(x, y + sill, z - length * 0.5 + side * 0.5, side, winH)
      place(x, y + sill, z + length * 0.5 - side * 0.5, side, winH)
    }
    // Above window
    const topH = height - sill - winH
    place(x, y + sill + winH, z, length, topH)
    return
  }

  place(x, y, z, length, height)
}

/**
 * House with door, window openings, open interior, and interior stairs to the roof.
 */
function addHouse(
  solids: SolidAABB[],
  footprints: MinimapBuilding[],
  opts: {
    x: number
    z: number
    w: number
    d: number
    stories: number
    baseY: number
    door: DoorSide
    stone?: boolean
  },
) {
  const { x, z, w, d, stories, baseY, door } = opts
  const wallT = 0.4
  const storyH = 2.9
  const floorH = 0.22
  const wallColor = opts.stone ? MAT.stone : MAT.adobe
  const wallDark = opts.stone ? MAT.stoneDark : MAT.adobeDark
  const roofColor = opts.stone ? MAT.roofTile : MAT.roofThatch
  const doorW = Math.min(2.7, Math.min(w, d) * 0.45)
  const hw = w * 0.5
  const hd = d * 0.5

  footprints.push({ x, z, w, d })

  // Ground floor
  add(
    solids,
    box(nid('fl'), x, baseY, z, w - 0.2, floorH, d - 0.2, MAT.stoneLight, true, 'floor'),
  )

  for (let story = 0; story < stories; story++) {
    const y0 = baseY + floorH + story * storyH
    const wallH = storyH * 0.98
    const hasDoor = story === 0

    addWallFace(solids, {
      x,
      y: y0,
      z: z - hd + wallT * 0.5,
      length: w,
      height: wallH,
      thickness: wallT,
      axis: 'x',
      color: wallColor,
      door: hasDoor && door === 'n',
      doorW,
      window: !(hasDoor && door === 'n'),
    })
    addWallFace(solids, {
      x,
      y: y0,
      z: z + hd - wallT * 0.5,
      length: w,
      height: wallH,
      thickness: wallT,
      axis: 'x',
      color: wallDark,
      door: hasDoor && door === 's',
      doorW,
      window: !(hasDoor && door === 's'),
    })
    addWallFace(solids, {
      x: x + hw - wallT * 0.5,
      y: y0,
      z,
      length: d - wallT * 2,
      height: wallH,
      thickness: wallT,
      axis: 'z',
      color: wallDark,
      door: hasDoor && door === 'e',
      doorW,
      window: !(hasDoor && door === 'e'),
    })
    addWallFace(solids, {
      x: x - hw + wallT * 0.5,
      y: y0,
      z,
      length: d - wallT * 2,
      height: wallH,
      thickness: wallT,
      axis: 'z',
      color: wallColor,
      door: hasDoor && door === 'w',
      doorW,
      window: !(hasDoor && door === 'w'),
    })
  }

  const roofY = baseY + floorH + stories * storyH

  // Interior staircase along the wall opposite the door (open well through floors).
  const stepH = 0.4
  const stepD = 0.55
  const stepW = 1.25
  const steps = Math.ceil((roofY - baseY - floorH) / stepH) + 1
  const inset = wallT + 0.85
  for (let i = 0; i < steps; i++) {
    const yy = baseY + floorH + i * stepH
    let sx = x
    let sz = z
    if (door === 's') {
      // stairs on north interior wall, run +X
      sx = x - hw + inset + 0.7 + (i % 6) * stepD * 0.15
      sz = z - hd + inset + (i % 2) * 0.05
    } else if (door === 'n') {
      sx = x - hw + inset + 0.7 + (i % 6) * stepD * 0.15
      sz = z + hd - inset
    } else if (door === 'e') {
      sx = x - hw + inset
      sz = z - hd + inset + 0.7 + (i % 6) * stepD * 0.15
    } else {
      sx = x + hw - inset
      sz = z - hd + inset + 0.7 + (i % 6) * stepD * 0.15
    }
    add(
      solids,
      box(nid('stair'), sx, yy, sz, stepW, stepH, stepD, i % 2 ? MAT.wood : MAT.woodOld, true, 'step'),
    )
  }

  // Upper floors with stairwell cutout (two slabs leaving a gap by the stairs)
  for (let story = 1; story <= stories; story++) {
    const fy = baseY + floorH + story * storyH
    const isRoof = story === stories
    const color = isRoof ? roofColor : MAT.woodPale
    const kind = isRoof ? 'roof' : 'floor'
    const thick = isRoof ? 0.28 : floorH

    if (door === 'n' || door === 's') {
      // Gap on the stair side (north if door south)
      const gapZ = door === 's' ? z - hd * 0.35 : z + hd * 0.35
      const mainZ = door === 's' ? z + hd * 0.18 : z - hd * 0.18
      add(
        solids,
        box(nid('fl'), x, fy, mainZ, w - 0.25, thick, d * 0.55, color, true, kind),
      )
      add(
        solids,
        box(nid('fl'), x + w * 0.22, fy, gapZ, w * 0.45, thick, d * 0.28, color, true, kind),
      )
    } else {
      const gapX = door === 'e' ? x - hw * 0.35 : x + hw * 0.35
      const mainX = door === 'e' ? x + hw * 0.18 : x - hw * 0.18
      add(
        solids,
        box(nid('fl'), mainX, fy, z, w * 0.55, thick, d - 0.25, color, true, kind),
      )
      add(
        solids,
        box(nid('fl'), gapX, fy, z + d * 0.22, w * 0.28, thick, d * 0.45, color, true, kind),
      )
    }
  }

  if (opts.stone) {
    const py = roofY + 0.28
    add(solids, box(nid('pp'), x, py, z - hd, w * 0.9, 0.5, 0.28, MAT.stoneDark, false, 'wall'))
    add(solids, box(nid('pp'), x, py, z + hd, w * 0.9, 0.5, 0.28, MAT.stoneDark, false, 'wall'))
  }

  return roofY + 0.28
}

/** Watchtower with door, windows, and interior stairs to the roof deck. */
function addWatchtower(
  solids: SolidAABB[],
  footprints: MinimapBuilding[],
  x: number,
  z: number,
  baseY: number,
  h: number,
) {
  const w = 3.8
  const t = 0.4
  const hw = w * 0.5
  footprints.push({ x, z, w, d: w })

  add(solids, box(nid('tf'), x, baseY, z, w - 0.2, 0.2, w - 0.2, MAT.stoneLight, true, 'floor'))

  // Walls per band with windows; south door on ground
  const bands = Math.max(1, Math.floor(h / 2.8))
  for (let b = 0; b < bands; b++) {
    const y0 = baseY + 0.2 + b * 2.8
    const bandH = Math.min(2.8, baseY + h - y0)
    addWallFace(solids, {
      x,
      y: y0,
      z: z - hw + t * 0.5,
      length: w,
      height: bandH,
      thickness: t,
      axis: 'x',
      color: MAT.stoneDark,
      window: true,
    })
    addWallFace(solids, {
      x: x + hw - t * 0.5,
      y: y0,
      z,
      length: w - t * 2,
      height: bandH,
      thickness: t,
      axis: 'z',
      color: MAT.stone,
      window: true,
    })
    addWallFace(solids, {
      x: x - hw + t * 0.5,
      y: y0,
      z,
      length: w - t * 2,
      height: bandH,
      thickness: t,
      axis: 'z',
      color: MAT.stone,
      window: true,
    })
    addWallFace(solids, {
      x,
      y: y0,
      z: z + hw - t * 0.5,
      length: w,
      height: bandH,
      thickness: t,
      axis: 'x',
      color: MAT.stoneDark,
      door: b === 0,
      doorW: 1.9,
      window: b > 0,
    })
  }

  // Interior stairs
  const stepH = 0.42
  const steps = Math.ceil(h / stepH)
  for (let i = 0; i < steps; i++) {
    add(
      solids,
      box(
        nid('ts'),
        x + ((i % 4) - 1.5) * 0.35,
        baseY + 0.2 + i * stepH,
        z - 0.2 + (i % 2) * 0.4,
        1.15,
        stepH,
        0.55,
        MAT.wood,
        true,
        'step',
      ),
    )
  }

  // Partial decks + roof
  for (let y = baseY + 2.9; y < baseY + h - 0.5; y += 2.9) {
    add(solids, box(nid('td'), x + 0.35, y, z, w - 1.1, 0.22, w - 0.5, MAT.woodPale, true, 'floor'))
  }
  add(solids, box(nid('tr'), x, baseY + h, z, w + 0.35, 0.3, w + 0.35, MAT.stoneLight, true, 'roof'))
}

/** Double-wall defense line with a narrow corridor between (ref. points 8 / 10). */
function addDefenseCorridor(
  solids: SolidAABB[],
  opts: {
    x: number
    z: number
    length: number
    axis: 'x' | 'z'
    baseY: number
    gap?: number
    height?: number
  },
) {
  const gap = opts.gap ?? 2.3
  const h = opts.height ?? 3.4
  const t = 0.7
  const halfGap = gap * 0.5 + t * 0.5

  if (opts.axis === 'x') {
    add(
      solids,
      box(nid('dw'), opts.x, opts.baseY, opts.z - halfGap, opts.length, h, t, MAT.stoneDark, true, 'wall'),
    )
    add(
      solids,
      box(nid('dw'), opts.x, opts.baseY, opts.z + halfGap, opts.length, h, t, MAT.stone, true, 'wall'),
    )
    // Occasional buttress blocks creating hide spots
    for (let i = -1; i <= 1; i++) {
      add(
        solids,
        box(
          nid('db'),
          opts.x + i * (opts.length * 0.28),
          opts.baseY,
          opts.z,
          1.1,
          h * 0.55,
          gap - 0.3,
          MAT.adobeDark,
          true,
          'prop',
        ),
      )
    }
  } else {
    add(
      solids,
      box(nid('dw'), opts.x - halfGap, opts.baseY, opts.z, t, h, opts.length, MAT.stoneDark, true, 'wall'),
    )
    add(
      solids,
      box(nid('dw'), opts.x + halfGap, opts.baseY, opts.z, t, h, opts.length, MAT.stone, true, 'wall'),
    )
  }
}

/** Elevated Upper Quarter terrace + circular control arena (ref. point 18). */
function addUpperQuarter(solids: SolidAABB[], footprints: MinimapBuilding[], rng: () => number) {
  const terraceY = ZONES.upper.y
  const arenaX = 0
  const arenaZ = -20
  const radius = ARENA_RADIUS

  // Raised packed-earth / stone terrace for the whole Upper Quarter
  add(
    solids,
    box(
      nid('terrace'),
      0,
      0,
      (ZONES.upper.zMin + ZONES.upper.zMax) * 0.5,
      36,
      terraceY,
      ZONES.upper.zMax - ZONES.upper.zMin + 2,
      MAT.packedEarth,
      true,
      'floor',
    ),
  )
  // Stone rim on terrace edge (south lip toward Inner Quarter)
  add(
    solids,
    box(nid('lip'), 0, terraceY, ZONES.upper.zMax - 0.35, 34, 0.55, 0.7, MAT.stoneDark, false, 'wall'),
  )

  // Access ramps from Inner → Upper (east & west)
  const rampSteps = 8
  const stepH = terraceY / rampSteps
  for (let side of [-1, 1] as const) {
    for (let i = 0; i < rampSteps; i++) {
      add(
        solids,
        box(
          nid('ramp'),
          side * 10,
          i * stepH,
          ZONES.upper.zMax + 1.2 + i * 0.55,
          3.2,
          stepH,
          1.1,
          MAT.stone,
          true,
          'step',
        ),
      )
    }
  }

  // Circular arena floor (approximated with walkable cross + octagon boxes for collision)
  const floorY = terraceY
  add(
    solids,
    box(nid('arena-floor'), arenaX, floorY, arenaZ, radius * 1.7, 0.25, radius * 1.7, MAT.arenaSand, true, 'floor'),
  )
  // Inner raised dais
  add(
    solids,
    box(nid('arena-dais'), arenaX, floorY + 0.25, arenaZ, 4.2, 0.35, 4.2, MAT.arenaStone, true, 'floor'),
  )

  // Arena ring walls — octagon segments (solid corridors around the control point)
  const ringR = radius + 0.6
  const segs = 8
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2
    const a1 = ((i + 1) / segs) * Math.PI * 2
    const mid = (a0 + a1) * 0.5
    // Leave south gap as entrance into the arena
    if (i === 2) continue
    const wx = arenaX + Math.sin(mid) * ringR
    const wz = arenaZ + Math.cos(mid) * ringR
    const len = 2 * ringR * Math.sin(Math.PI / segs) + 0.35
    add(
      solids,
      box(
        nid('arena-ring'),
        wx,
        floorY + 0.25,
        wz,
        Math.abs(Math.cos(mid)) > 0.5 ? 0.65 : len,
        2.1,
        Math.abs(Math.cos(mid)) > 0.5 ? len : 0.65,
        i % 2 === 0 ? MAT.stone : MAT.stoneDark,
        true,
        'wall',
      ),
    )
  }

  // Flanking watchtowers
  addWatchtower(solids, footprints, -12 + rng() * 0.4, -14, terraceY, 6.5)
  addWatchtower(solids, footprints, 12 - rng() * 0.4, -14, terraceY, 6.2)

  // Side keep buildings
  addHouse(solids, footprints, {
    x: -14,
    z: -26,
    w: 6.5,
    d: 5.5,
    stories: 2,
    baseY: terraceY,
    door: 's',
    stone: true,
  })
  addHouse(solids, footprints, {
    x: 14,
    z: -26,
    w: 6.5,
    d: 5.5,
    stories: 2,
    baseY: terraceY,
    door: 's',
    stone: true,
  })

  const flagY = floorY + 0.25 + 0.35
  return {
    arena: { x: arenaX, z: arenaZ, radius, floorY },
    flag: { x: arenaX, y: flagY, z: arenaZ },
    hq: {
      x: arenaX,
      z: arenaZ,
      width: radius * 2,
      depth: radius * 2,
      roofY: flagY,
    },
  }
}

function addInnerQuarter(
  solids: SolidAABB[],
  footprints: MinimapBuilding[],
  rng: () => number,
) {
  const y = ZONES.inner.y

  // East–west defense corridors (points 8 / 10 style)
  addDefenseCorridor(solids, {
    x: -8,
    z: -2,
    length: 16,
    axis: 'x',
    baseY: y,
    gap: 2.4,
    height: 3.6,
  })
  addDefenseCorridor(solids, {
    x: 10,
    z: 3,
    length: 14,
    axis: 'x',
    baseY: y,
    gap: 2.2,
    height: 3.5,
  })
  // North–south corridor linking Lower → Upper
  addDefenseCorridor(solids, {
    x: 0,
    z: 0,
    length: 14,
    axis: 'z',
    baseY: y,
    gap: 3.2,
    height: 3.3,
  })

  // Inner houses flanking the main street
  const houses: Array<{ x: number; z: number; door: DoorSide; stories: number }> = [
    { x: -12 + rng() * 0.6, z: 4, door: 'e', stories: 2 },
    { x: 12 - rng() * 0.6, z: 4, door: 'w', stories: 2 },
    { x: -14, z: -6 + rng() * 0.5, door: 's', stories: 1 },
    { x: 14, z: -5, door: 's', stories: 2 },
    { x: -6, z: 6.5, door: 'n', stories: 1 },
    { x: 7, z: 6.2, door: 'n', stories: 1 },
  ]
  for (const h of houses) {
    addHouse(solids, footprints, {
      x: h.x,
      z: h.z,
      w: 5.2 + rng() * 1.4,
      d: 4.6 + rng() * 1.2,
      stories: h.stories,
      baseY: y,
      door: h.door,
      stone: rng() > 0.45,
    })
  }

  addWatchtower(solids, footprints, -18, 2, y, 7.2)
  addWatchtower(solids, footprints, 18, -1, y, 6.8)
}

function addLowerQuarter(
  solids: SolidAABB[],
  footprints: MinimapBuilding[],
  trenches: Trench[],
  rng: () => number,
) {
  const y = ZONES.lower.y

  // Outer curtain wall segments with gate openings
  const wallH = 3.8
  const wallT = 1.1
  // South outer wall (gate in center)
  add(solids, box(nid('ow'), -14, y, 32, 18, wallH, wallT, MAT.stoneDark, true, 'wall'))
  add(solids, box(nid('ow'), 14, y, 32, 18, wallH, wallT, MAT.stone, true, 'wall'))
  // East / west outer walls
  add(solids, box(nid('ow'), -30, y, 20, wallT, wallH, 22, MAT.stoneDark, true, 'wall'))
  add(solids, box(nid('ow'), 30, y, 20, wallT, wallH, 22, MAT.stone, true, 'wall'))

  // Gate towers
  addWatchtower(solids, footprints, -5.5, 31, y, 5.5)
  addWatchtower(solids, footprints, 5.5, 31, y, 5.5)

  // Lower Quarter houses — denser, mostly adobe
  const plots = [
    { x: -16, z: 18, door: 'e' as const, stories: 1 },
    { x: -16, z: 12, door: 'e' as const, stories: 1 },
    { x: 16, z: 18, door: 'w' as const, stories: 1 },
    { x: 16, z: 12, door: 'w' as const, stories: 2 },
    { x: -8, z: 22, door: 's' as const, stories: 1 },
    { x: 9, z: 22, door: 's' as const, stories: 1 },
    { x: -22, z: 24, door: 's' as const, stories: 1 },
    { x: 22, z: 24, door: 's' as const, stories: 1 },
    { x: 0, z: 14, door: 's' as const, stories: 1 },
  ]
  for (const p of plots) {
    addHouse(solids, footprints, {
      x: p.x + (rng() * 2 - 1) * 0.5,
      z: p.z + (rng() * 2 - 1) * 0.4,
      w: 4.8 + rng() * 1.6,
      d: 4.2 + rng() * 1.2,
      stories: p.stories,
      baseY: y,
      door: p.door,
      stone: false,
    })
  }

  // Loose crate / concrete cover near the main street
  for (let i = 0; i < 8; i++) {
    const x = (rng() * 2 - 1) * 6
    const z = 16 + rng() * 10
    if (Math.abs(x) < 2.2) continue
    const stack = 1 + Math.floor(rng() * 3)
    let yy = y
    for (let s = 0; s < stack; s++) {
      const h = 0.7 + rng() * 0.25
      add(
        solids,
        box(
          nid('cr'),
          x + (rng() * 2 - 1) * 0.15,
          yy,
          z + (rng() * 2 - 1) * 0.15,
          0.95,
          h,
          0.9,
          rng() > 0.5 ? MAT.wood : MAT.woodOld,
          true,
          'crate',
        ),
      )
      yy += h
    }
  }

  // Shallow defensive ditches flanking the approach
  const ditchSpecs = [
    { x: -20, z: 28, w: 8, d: 2.6 },
    { x: 20, z: 28, w: 8, d: 2.6 },
  ]
  ditchSpecs.forEach((s, i) => {
    const floorY = -1.1
    trenches.push({
      id: `ditch-${i}`,
      x: s.x,
      z: s.z,
      width: s.w,
      depth: s.d,
      floorY,
      color: MAT.dirt,
    })
    const t = 0.35
    const hw = s.w * 0.5
    const hd = s.d * 0.5
    const wallH = -floorY
    add(solids, box(nid('dw'), s.x, floorY, s.z - hd + t * 0.5, s.w, wallH, t, MAT.dirt, false, 'wall'))
    add(solids, box(nid('dw'), s.x, floorY, s.z + hd - t * 0.5, s.w, wallH, t, MAT.dirt, false, 'wall'))
    add(solids, box(nid('dw'), s.x + hw - t * 0.5, floorY, s.z, t, wallH, s.d - t * 2, MAT.dirt, false, 'wall'))
    add(solids, box(nid('dw'), s.x - hw + t * 0.5, floorY, s.z, t, wallH, s.d - t * 2, MAT.dirt, false, 'wall'))
    add(
      solids,
      box(nid('df'), s.x, floorY, s.z, s.w - t * 2, 0.12, s.d - t * 2, MAT.dirt, true, 'floor'),
    )
  })
}

/**
 * Fortified settlement layout: Lower → Inner → Upper Quarters
 * with a circular control arena (KotH flag) in the Upper Quarter.
 * Seed only jitters props/houses slightly; the zone structure stays coherent.
 */
export function generateProceduralMap(seed = (Math.random() * 0xffffffff) >>> 0): ProceduralMap {
  _id = 0
  const rng = createRng(seed || 1)
  const solids: SolidAABB[] = []
  const trenches: Trench[] = []
  const footprints: MinimapBuilding[] = []

  for (const s of createRubikCollisionSolids(nid('rubik'))) {
    solids.push(s)
  }

  addLowerQuarter(solids, footprints, trenches, rng)
  addInnerQuarter(solids, footprints, rng)
  const upper = addUpperQuarter(solids, footprints, rng)

  const spawn = {
    x: (rng() * 2 - 1) * 1.2,
    y: 0,
    z: 27,
  }

  return {
    seed,
    solids,
    trenches,
    flag: upper.flag,
    spawn,
    arena: upper.arena,
    hq: upper.hq,
    minimap: {
      size: ARENA.size,
      buildings: footprints,
      arena: { x: upper.arena.x, z: upper.arena.z, r: upper.arena.radius },
    },
  }
}
