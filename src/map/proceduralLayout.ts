import { MAT } from './materials'

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

/** Wide door gap on one cardinal side; interior is open for walking. */
function addHouse(
  solids: SolidAABB[],
  opts: {
    x: number
    z: number
    w: number
    d: number
    stories: number
    baseY: number
    door: 'n' | 's' | 'e' | 'w'
    stone?: boolean
    roofAccess?: boolean
  },
) {
  const { x, z, w, d, stories, baseY, door } = opts
  const wallT = 0.4
  const storyH = 2.85
  const floorH = 0.22
  const wallColor = opts.stone ? MAT.stone : MAT.adobe
  const wallDark = opts.stone ? MAT.stoneDark : MAT.adobeDark
  const roofColor = opts.stone ? MAT.roofTile : MAT.roofThatch
  const doorW = Math.min(2.8, w * 0.42)
  const hw = w * 0.5
  const hd = d * 0.5

  // Ground floor slab (slight raise so interior feels enclosed)
  add(
    solids,
    box(nid('fl'), x, baseY, z, w - 0.15, floorH, d - 0.15, MAT.stoneLight, true, 'floor'),
  )

  for (let story = 0; story < stories; story++) {
    const y0 = baseY + floorH + story * storyH
    const wallH = story < stories - 1 ? storyH : storyH * 0.95

    const makeWall = (
      wx: number,
      wz: number,
      ww: number,
      wd: number,
      color: string,
    ) => add(solids, box(nid('hw'), wx, y0, wz, ww, wallH, wd, color, false, 'wall'))

    // North
    if (door === 'n' && story === 0) {
      const side = (w - doorW) * 0.5
      makeWall(x - hw + side * 0.5, z - hd + wallT * 0.5, side, wallT, wallColor)
      makeWall(x + hw - side * 0.5, z - hd + wallT * 0.5, side, wallT, wallDark)
    } else {
      makeWall(x, z - hd + wallT * 0.5, w, wallT, wallColor)
    }
    // South
    if (door === 's' && story === 0) {
      const side = (w - doorW) * 0.5
      makeWall(x - hw + side * 0.5, z + hd - wallT * 0.5, side, wallT, wallColor)
      makeWall(x + hw - side * 0.5, z + hd - wallT * 0.5, side, wallT, wallDark)
    } else {
      makeWall(x, z + hd - wallT * 0.5, w, wallT, wallColor)
    }
    // East
    if (door === 'e' && story === 0) {
      const side = (d - doorW) * 0.5
      makeWall(x + hw - wallT * 0.5, z - hd + side * 0.5, wallT, side, wallColor)
      makeWall(x + hw - wallT * 0.5, z + hd - side * 0.5, wallT, side, wallDark)
    } else {
      makeWall(x + hw - wallT * 0.5, z, wallT, d - wallT * 2, wallDark)
    }
    // West
    if (door === 'w' && story === 0) {
      const side = (d - doorW) * 0.5
      makeWall(x - hw + wallT * 0.5, z - hd + side * 0.5, wallT, side, wallColor)
      makeWall(x - hw + wallT * 0.5, z + hd - side * 0.5, wallT, side, wallDark)
    } else {
      makeWall(x - hw + wallT * 0.5, z, wallT, d - wallT * 2, wallColor)
    }

    // Upper floor deck
    if (story < stories - 1) {
      const fy = y0 + storyH
      add(
        solids,
        box(nid('fl'), x, fy, z, w - 0.2, floorH, d - 0.2, MAT.woodPale, true, 'floor'),
      )
    }
  }

  const roofY = baseY + floorH + stories * storyH
  add(solids, box(nid('rf'), x, roofY, z, w + 0.35, 0.28, d + 0.35, roofColor, true, 'roof'))

  // Low parapet on stone houses
  if (opts.stone) {
    const py = roofY + 0.28
    add(solids, box(nid('pp'), x, py, z - hd, w, 0.55, 0.3, MAT.stoneDark, false, 'wall'))
    add(solids, box(nid('pp'), x, py, z + hd, w, 0.55, 0.3, MAT.stoneDark, false, 'wall'))
  }

  // Rooftop access: crate/step stack outside near the door
  if (opts.roofAccess !== false) {
    const stepH = 0.48
    const steps = Math.ceil((roofY - baseY) / stepH)
    let sx = x
    let sz = z
    if (door === 's') sz = z + hd + 0.9
    if (door === 'n') sz = z - hd - 0.9
    if (door === 'e') sx = x + hw + 0.9
    if (door === 'w') sx = x - hw - 0.9

    for (let i = 0; i < steps; i++) {
      const along = i * 0.52
      const px = door === 'e' || door === 'w' ? sx + (door === 'e' ? along * 0.05 : -along * 0.05) : sx + (i % 2 === 0 ? -0.55 : 0.55)
      const pz = door === 'n' || door === 's' ? sz + (door === 's' ? along * 0.08 : -along * 0.08) : sz
      add(
        solids,
        box(
          nid('st'),
          px,
          baseY + i * stepH,
          pz,
          1.15,
          stepH,
          1.05,
          i % 2 === 0 ? MAT.wood : MAT.woodOld,
          true,
          'crate',
        ),
      )
    }
  }

  return roofY + 0.28
}

/** Watchtower with interior climb via stacked platforms. */
function addWatchtower(
  solids: SolidAABB[],
  x: number,
  z: number,
  baseY: number,
  h: number,
) {
  const w = 3.6
  const t = 0.4
  const hw = w * 0.5
  // Shell walls with south door
  add(solids, box(nid('tw'), x, baseY, z - hw + t * 0.5, w, h, t, MAT.stoneDark, false, 'wall'))
  add(solids, box(nid('tw'), x + hw - t * 0.5, baseY, z, t, h, w - t * 2, MAT.stone, false, 'wall'))
  add(solids, box(nid('tw'), x - hw + t * 0.5, baseY, z, t, h, w - t * 2, MAT.stone, false, 'wall'))
  const doorW = 1.8
  const side = (w - doorW) * 0.5
  add(
    solids,
    box(nid('tw'), x - hw + side * 0.5, baseY, z + hw - t * 0.5, side, h, t, MAT.stoneDark, false, 'wall'),
  )
  add(
    solids,
    box(nid('tw'), x + hw - side * 0.5, baseY, z + hw - t * 0.5, side, h, t, MAT.stoneDark, false, 'wall'),
  )

  // Interior decks
  for (let y = baseY + 2.6; y < baseY + h - 1; y += 2.6) {
    add(solids, box(nid('td'), x, y, z, w - 0.5, 0.22, w - 0.5, MAT.woodPale, true, 'floor'))
  }
  // Roof deck
  add(solids, box(nid('tr'), x, baseY + h, z, w + 0.4, 0.3, w + 0.4, MAT.stoneLight, true, 'roof'))
  // Exterior crate climb
  const steps = Math.ceil(h / 0.5)
  for (let i = 0; i < steps; i++) {
    add(
      solids,
      box(
        nid('ts'),
        x + (i % 2 === 0 ? 1.1 : -1.1),
        baseY + i * 0.5,
        z + hw + 0.85 + i * 0.05,
        1.2,
        0.5,
        1.1,
        MAT.wood,
        true,
        'crate',
      ),
    )
  }
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
function addUpperQuarter(solids: SolidAABB[], rng: () => number) {
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
  addWatchtower(solids, -12 + rng() * 0.4, -14, terraceY, 6.5)
  addWatchtower(solids, 12 - rng() * 0.4, -14, terraceY, 6.2)

  // Side keep buildings
  addHouse(solids, {
    x: -14,
    z: -26,
    w: 6.5,
    d: 5.5,
    stories: 2,
    baseY: terraceY,
    door: 's',
    stone: true,
  })
  addHouse(solids, {
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

function addInnerQuarter(solids: SolidAABB[], rng: () => number) {
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
  const houses: Array<{ x: number; z: number; door: 'n' | 's' | 'e' | 'w'; stories: number }> = [
    { x: -12 + rng() * 0.6, z: 4, door: 'e', stories: 2 },
    { x: 12 - rng() * 0.6, z: 4, door: 'w', stories: 2 },
    { x: -14, z: -6 + rng() * 0.5, door: 's', stories: 1 },
    { x: 14, z: -5, door: 's', stories: 2 },
    { x: -6, z: 6.5, door: 'n', stories: 1 },
    { x: 7, z: 6.2, door: 'n', stories: 1 },
  ]
  for (const h of houses) {
    addHouse(solids, {
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

  addWatchtower(solids, -18, 2, y, 7.2)
  addWatchtower(solids, 18, -1, y, 6.8)
}

function addLowerQuarter(solids: SolidAABB[], trenches: Trench[], rng: () => number) {
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
  addWatchtower(solids, -5.5, 31, y, 5.5)
  addWatchtower(solids, 5.5, 31, y, 5.5)

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
    addHouse(solids, {
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

  addLowerQuarter(solids, trenches, rng)
  addInnerQuarter(solids, rng)
  const upper = addUpperQuarter(solids, rng)

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
  }
}
