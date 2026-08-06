import {
  FAUNA,
  FLORA,
  MINERALS,
  WORLD,
  type FaunaKind,
  type FloraKind,
  type MineralKind,
} from './catalog'

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function randRange(rng: () => number, a: number, b: number) {
  return a + (b - a) * rng()
}

function pickWeighted<T extends string>(rng: () => number, entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [k, w] of entries) {
    r -= w
    if (r <= 0) return k
  }
  return entries[0][0]
}

export type FloraInstance = {
  id: string
  kind: FloraKind
  x: number
  z: number
  scale: number
  yaw: number
}

export type FaunaInstance = {
  id: string
  kind: FaunaKind
  x: number
  z: number
  yaw: number
}

export type MineralInstance = {
  id: string
  kind: MineralKind
  x: number
  z: number
  scale: number
  yaw: number
}

const FLORA_WEIGHTS: [FloraKind, number][] = [
  ['araucaria', 10],
  ['alerce', 6],
  ['quillay', 14],
  ['boldo', 14],
  ['canelo', 10],
  ['espino', 12],
  ['maqui', 16],
  ['copihue', 12],
  ['arrayan', 8],
]

const FAUNA_WEIGHTS: [FaunaKind, number][] = [
  ['caballo', 18],
  ['oveja', 28],
  ['perro', 22],
  ['guanaco', 18],
]

const MINERAL_WEIGHTS: [MineralKind, number][] = [
  ['cobre', 22],
  ['litio', 14],
  ['oro', 8],
  ['salitre', 18],
  ['piedra', 28],
]

function farEnough(
  x: number,
  z: number,
  points: { x: number; z: number }[],
  minDist: number,
) {
  for (const p of points) {
    if (Math.hypot(p.x - x, p.z - z) < minDist) return false
  }
  return true
}

/** Deterministic open-world scatter for flora, fauna and minerals. */
export function generateWorld(seed = 20260806) {
  const rng = mulberry32(seed)
  const half = WORLD.half - 6
  const flora: FloraInstance[] = []
  const fauna: FaunaInstance[] = []
  const minerals: MineralInstance[] = []
  const occupied: { x: number; z: number }[] = [{ x: 0, z: 8 }]

  for (let i = 0; i < WORLD.floraCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 24; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 8) continue
      if (!farEnough(x, z, occupied, 3.2)) continue
      ok = true
      break
    }
    if (!ok) continue
    const kind = pickWeighted(rng, FLORA_WEIGHTS)
    flora.push({
      id: `flora-${i}`,
      kind,
      x,
      z,
      scale: randRange(rng, 0.85, 1.25),
      yaw: randRange(rng, 0, Math.PI * 2),
    })
    occupied.push({ x, z })
  }

  for (let i = 0; i < WORLD.faunaCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 24; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 10) continue
      ok = true
      break
    }
    if (!ok) continue
    const kind = pickWeighted(rng, FAUNA_WEIGHTS)
    fauna.push({
      id: `fauna-${i}`,
      kind,
      x,
      z,
      yaw: randRange(rng, 0, Math.PI * 2),
    })
  }

  for (let i = 0; i < WORLD.mineralCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 24; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 7) continue
      if (!farEnough(x, z, occupied, 2.5)) continue
      ok = true
      break
    }
    if (!ok) continue
    const kind = pickWeighted(rng, MINERAL_WEIGHTS)
    minerals.push({
      id: `mineral-${i}`,
      kind,
      x,
      z,
      scale: randRange(rng, 0.8, 1.3),
      yaw: randRange(rng, 0, Math.PI * 2),
    })
    occupied.push({ x, z })
  }

  return { flora, fauna, minerals, defs: { FLORA, FAUNA, MINERALS } }
}
