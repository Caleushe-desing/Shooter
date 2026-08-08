import { ARENA } from '../constants'

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

export type ProceduralMap = {
  seed: number
  solids: SolidAABB[]
  trenches: Trench[]
  flag: FlagMarker
  spawn: { x: number; y: number; z: number }
  hq: {
    x: number
    z: number
    width: number
    depth: number
    roofY: number
  }
}

const WOOD = ['#8B5A2B', '#A06B3A', '#7A4E28', '#9C6B3F'] as const
const CONCRETE = ['#8A8D88', '#7A7E79', '#959990', '#6E726E'] as const
const WALL = ['#6E675C', '#7A7368', '#5C564C', '#8A8276'] as const
const FLOOR = '#9A9184'
const ROOF = '#6B6054'

export const HQ = {
  width: 12,
  depth: 12,
  floorH: 0.28,
  story: 3.2,
  stories: 2,
  wallT: 0.45,
} as const

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

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!
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

function xzOverlap(
  ax: number,
  az: number,
  aw: number,
  ad: number,
  bx: number,
  bz: number,
  bw: number,
  bd: number,
  gap = 0,
) {
  return (
    Math.abs(ax - bx) < aw * 0.5 + bw * 0.5 + gap &&
    Math.abs(az - bz) < ad * 0.5 + bd * 0.5 + gap
  )
}

function overlapsHq(x: number, z: number, w: number, d: number, margin = 2) {
  return xzOverlap(x, z, w, d, 0, 0, HQ.width + margin * 2, HQ.depth + margin * 2, 0)
}

/** Multi-floor HQ tower with south stair run and rooftop capture deck. */
function buildHeadquarters(rng: () => number, solids: SolidAABB[]) {
  const roofY = HQ.story * HQ.stories + HQ.floorH
  const hw = HQ.width * 0.5
  const hd = HQ.depth * 0.5
  const t = HQ.wallT

  // Ground plinth
  solids.push(
    box('hq-plinth', 0, 0, 0, HQ.width + 1.2, 0.2, HQ.depth + 1.2, '#8C8476', true, 'floor'),
  )

  // Intermediate floors + roof deck
  for (let story = 1; story <= HQ.stories; story++) {
    const y = HQ.story * story
    solids.push(
      box(`hq-floor-${story}`, 0, y, 0, HQ.width - 0.2, HQ.floorH, HQ.depth - 0.2, FLOOR, true, 'floor'),
    )
  }
  solids.push(
    box('hq-roof', 0, roofY, 0, HQ.width, HQ.floorH, HQ.depth, ROOF, true, 'roof'),
  )

  // Perimeter walls per story with a south door gap on ground and stair cutouts.
  for (let story = 0; story < HQ.stories; story++) {
    const y0 = story === 0 ? 0.2 : HQ.story * story + HQ.floorH
    const y1 = HQ.story * (story + 1)
    const h = y1 - y0
    const door = story === 0 ? 2.6 : 2.2

    // North wall
    solids.push(box(`hq-n-${story}`, 0, y0, -hd + t * 0.5, HQ.width, h, t, pick(rng, WALL), false, 'wall'))
    // East / West
    solids.push(box(`hq-e-${story}`, hw - t * 0.5, y0, 0, t, h, HQ.depth - t * 2, pick(rng, WALL), false, 'wall'))
    solids.push(box(`hq-w-${story}`, -hw + t * 0.5, y0, 0, t, h, HQ.depth - t * 2, pick(rng, WALL), false, 'wall'))
    // South split around doorway / stair opening
    const sideW = (HQ.width - door) * 0.5
    solids.push(
      box(`hq-sL-${story}`, -hw + sideW * 0.5, y0, hd - t * 0.5, sideW, h, t, pick(rng, WALL), false, 'wall'),
    )
    solids.push(
      box(`hq-sR-${story}`, hw - sideW * 0.5, y0, hd - t * 0.5, sideW, h, t, pick(rng, WALL), false, 'wall'),
    )
  }

  // Rooftop parapet (low walls) — walkable roof stays open in the middle for the flag.
  const parapetH = 0.85
  const py = roofY + HQ.floorH
  solids.push(box('hq-par-n', 0, py, -hd + 0.2, HQ.width - 0.4, parapetH, 0.35, ROOF, false, 'wall'))
  solids.push(box('hq-par-e', hw - 0.2, py, 0, 0.35, parapetH, HQ.depth - 0.8, ROOF, false, 'wall'))
  solids.push(box('hq-par-w', -hw + 0.2, py, 0, 0.35, parapetH, HQ.depth - 0.8, ROOF, false, 'wall'))
  // South parapet open in the middle for stair arrival
  solids.push(box('hq-par-sL', -3.2, py, hd - 0.2, 4.2, parapetH, 0.35, ROOF, false, 'wall'))
  solids.push(box('hq-par-sR', 3.2, py, hd - 0.2, 4.2, parapetH, 0.35, ROOF, false, 'wall'))

  // Exterior switchback stairs on the south face up to the roof.
  const stepH = 0.4
  const stepD = 0.62
  const stepW = 2.5
  const stepsPerFlight = 7
  const steps = Math.ceil((roofY + HQ.floorH) / stepH)
  for (let i = 0; i < steps; i++) {
    const y = i * stepH
    const flight = Math.floor(i / stepsPerFlight)
    const local = i % stepsPerFlight
    const x = flight % 2 === 0 ? -1.15 : 1.15
    const zBase = hd + 0.85
    const z =
      flight % 2 === 0 ? zBase + local * stepD : zBase + (stepsPerFlight - 1 - local) * stepD
    solids.push(box(`hq-step-${i}`, x, y, z, stepW, stepH, stepD, '#7D7468', true, 'step'))

    // Landing at the end of each flight
    if (local === stepsPerFlight - 1) {
      const landY = y + stepH
      solids.push(
        box(
          `hq-flight-land-${flight}`,
          0,
          landY,
          zBase + (stepsPerFlight - 1) * stepD * 0.5,
          4.2,
          HQ.floorH,
          stepsPerFlight * stepD * 0.55,
          '#8A8276',
          true,
          'floor',
        ),
      )
    }
  }

  // Bridging landings into each floor doorway / roof
  for (let story = 1; story <= HQ.stories; story++) {
    const y = HQ.story * story
    solids.push(
      box(`hq-land-${story}`, 0, y, hd + 0.9, 3.4, HQ.floorH, 1.8, FLOOR, true, 'floor'),
    )
  }
  solids.push(
    box('hq-land-roof', 0, roofY, hd + 0.9, 3.4, HQ.floorH, 1.8, ROOF, true, 'floor'),
  )

  return {
    x: 0,
    z: 0,
    width: HQ.width,
    depth: HQ.depth,
    roofY: roofY + HQ.floorH,
  }
}

function buildTrenches(rng: () => number, trenches: Trench[], solids: SolidAABB[]) {
  const specs = [
    { x: -18, z: -14, w: 10, d: 3.2 },
    { x: 16, z: -18, w: 8, d: 3.4 },
    { x: -15, z: 17, w: 11, d: 3 },
    { x: 18, z: 14, w: 9, d: 3.2 },
    { x: 0, z: 22, w: 12, d: 2.8 },
  ]

  for (let i = 0; i < specs.length; i++) {
    const s = specs[i]!
    const jitterX = (rng() * 2 - 1) * 2.5
    const jitterZ = (rng() * 2 - 1) * 2.5
    const x = s.x + jitterX
    const z = s.z + jitterZ
    const width = s.w + rng() * 2
    const depth = s.d
    const floorY = -1.35 - rng() * 0.25
    if (overlapsHq(x, z, width, depth, 4)) continue

    trenches.push({
      id: `trench-${i}`,
      x,
      z,
      width,
      depth,
      floorY,
      color: '#5A4A32',
    })

    // Trench walls (from floor up to ground)
    const wallH = -floorY
    const t = 0.35
    const hw = width * 0.5
    const hd = depth * 0.5
    solids.push(box(`tw-n-${i}`, x, floorY, z - hd + t * 0.5, width, wallH, t, '#4A3C28', false, 'wall'))
    solids.push(box(`tw-s-${i}`, x, floorY, z + hd - t * 0.5, width, wallH, t, '#4A3C28', false, 'wall'))
    solids.push(box(`tw-e-${i}`, x + hw - t * 0.5, floorY, z, t, wallH, depth - t * 2, '#4A3C28', false, 'wall'))
    solids.push(box(`tw-w-${i}`, x - hw + t * 0.5, floorY, z, t, wallH, depth - t * 2, '#4A3C28', false, 'wall'))
    // Walkable trench floor slab
    solids.push(
      box(`tf-${i}`, x, floorY, z, width - t * 2, 0.12, depth - t * 2, '#6B5538', true, 'floor'),
    )
  }
}

function buildCrateStacks(rng: () => number, solids: SolidAABB[]) {
  const sites = [
    { x: -8, z: 10 },
    { x: 9, z: 9 },
    { x: -10, z: -9 },
    { x: 11, z: -8 },
    { x: -22, z: 4 },
    { x: 22, z: -5 },
    { x: 6, z: 18 },
    { x: -5, z: -20 },
    { x: 14, z: 6 },
    { x: -14, z: 0 },
  ]

  let n = 0
  for (const site of sites) {
    const x0 = site.x + (rng() * 2 - 1) * 1.5
    const z0 = site.z + (rng() * 2 - 1) * 1.5
    if (overlapsHq(x0, z0, 3, 3, 1.5)) continue

    const stackH = 1 + Math.floor(rng() * 3)
    let y = 0
    for (let i = 0; i < stackH; i++) {
      const isConcrete = rng() > 0.55
      const w = isConcrete ? 1.1 + rng() * 0.5 : 0.85 + rng() * 0.35
      const d = isConcrete ? 1.0 + rng() * 0.45 : 0.8 + rng() * 0.3
      const h = isConcrete ? 0.9 + rng() * 0.35 : 0.7 + rng() * 0.25
      const ox = (rng() * 2 - 1) * 0.12
      const oz = (rng() * 2 - 1) * 0.12
      solids.push(
        box(
          `obs-${n++}`,
          x0 + ox,
          y,
          z0 + oz,
          w,
          h,
          d,
          isConcrete ? pick(rng, CONCRETE) : pick(rng, WOOD),
          true,
          isConcrete ? 'concrete' : 'crate',
        ),
      )
      y += h
    }

    // Side step crate for parkour approach toward HQ
    if (rng() > 0.4) {
      const h = 0.65 + rng() * 0.2
      solids.push(
        box(
          `obs-${n++}`,
          x0 + 1.2,
          0,
          z0 + 0.9,
          0.9,
          h,
          0.9,
          pick(rng, WOOD),
          true,
          'crate',
        ),
      )
    }
  }
}

function buildCoverBlocks(rng: () => number, solids: SolidAABB[]) {
  const half = ARENA.size * 0.5 - 4
  let placed = 0
  for (let i = 0; i < 80 && placed < 14; i++) {
    const w = 2.5 + rng() * 4
    const d = 2.5 + rng() * 4
    const h = 2.2 + rng() * 3.5
    const x = (rng() * 2 - 1) * half
    const z = (rng() * 2 - 1) * half
    if (overlapsHq(x, z, w, d, 5)) continue
    // Keep south stair approach relatively open
    if (Math.abs(x) < 4 && z > 0 && z < 22) continue
    if (
      solids.some(
        (s) =>
          s.kind !== 'step' &&
          xzOverlap(x, z, w, d, s.x, s.z, s.width, s.depth, 1.8),
      )
    ) {
      continue
    }
    solids.push(box(`cover-${placed}`, x, 0, z, w, h, d, pick(rng, WALL), true, 'wall'))
    placed++
  }
}

/**
 * Vertical tactical training field: trenches, crates, cover blocks,
 * and a central multi-floor HQ with the KotH flag on the rooftop.
 */
export function generateProceduralMap(seed = (Math.random() * 0xffffffff) >>> 0): ProceduralMap {
  const rng = createRng(seed || 1)
  const solids: SolidAABB[] = []
  const trenches: Trench[] = []

  const hq = buildHeadquarters(rng, solids)
  buildTrenches(rng, trenches, solids)
  buildCrateStacks(rng, solids)
  buildCoverBlocks(rng, solids)

  // Spawn south of the HQ, on open ground facing the stair approach.
  const spawn = {
    x: (rng() * 2 - 1) * 1.5,
    y: 0,
    z: HQ.depth * 0.5 + 8 + rng() * 2,
  }

  return {
    seed,
    solids,
    trenches,
    flag: { x: 0, y: hq.roofY, z: 0 },
    spawn,
    hq,
  }
}
