import {
  FAUNA,
  FLORA,
  MINERALS,
  WORLD,
  type BiomeId,
  type FaunaKind,
  type FloraKind,
  type LakeDef,
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
  biome: BiomeId
}

export type FaunaInstance = {
  id: string
  kind: FaunaKind
  x: number
  z: number
  yaw: number
  biome: BiomeId
}

export type MineralInstance = {
  id: string
  kind: MineralKind
  x: number
  z: number
  scale: number
  yaw: number
  biome: BiomeId
  /** True until the player scans the deposit. */
  buried: boolean
}

function farEnough(x: number, z: number, points: { x: number; z: number }[], minDist: number) {
  for (const p of points) {
    if (Math.hypot(p.x - x, p.z - z) < minDist) return false
  }
  return true
}

/** Continuous biome field: lakes override, then rocky ridges, wetland belts, forest vs meadow. */
export function biomeAt(x: number, z: number, lakes: LakeDef[]): BiomeId {
  for (const lake of lakes) {
    const d = Math.hypot(x - lake.x, z - lake.z)
    if (d < lake.radius * 0.85) return 'lago'
    if (d < lake.radius * 1.35) return 'humedal'
  }
  const ridge = Math.abs(Math.sin(x * 0.018) * Math.cos(z * 0.015))
  if (ridge > 0.72 || (Math.hypot(x, z) > 95 && ridge > 0.45)) return 'rocoso'
  const forestNoise = Math.sin(x * 0.03 + 1.7) + Math.cos(z * 0.027 - 0.4)
  if (forestNoise > 0.15) return 'bosque'
  return 'pradera'
}

function floraWeightsFor(biome: BiomeId): [FloraKind, number][] {
  const all = Object.values(FLORA)
  return all
    .filter((d) => d.biomes.includes(biome))
    .map((d) => [d.kind, biome === 'bosque' && (d.kind === 'roble' || d.kind === 'pino') ? 18 : 10])
}

function faunaWeightsFor(biome: BiomeId): [FaunaKind, number][] {
  return Object.values(FAUNA)
    .filter((d) => d.biomes.includes(biome))
    .map((d) => [d.kind, 10])
}

function mineralWeightsFor(biome: BiomeId): [MineralKind, number][] {
  return Object.values(MINERALS)
    .filter((d) => d.biomes.includes(biome))
    .map((d) => [d.kind, d.buried ? 8 : 14])
}

/** Large fantasy wilderness: lakes, forests, meadows, rocky mineral hills. */
export function generateWorld(seed = 20260806) {
  const rng = mulberry32(seed)
  const half = WORLD.half - 8
  const lakes: LakeDef[] = []
  const flora: FloraInstance[] = []
  const fauna: FaunaInstance[] = []
  const minerals: MineralInstance[] = []
  const occupied: { x: number; z: number }[] = [{ x: 0, z: 8 }]

  // Seed lakes away from spawn.
  for (let i = 0; i < WORLD.lakeCount; i++) {
    let x = 0
    let z = 0
    for (let attempt = 0; attempt < 40; attempt++) {
      x = randRange(rng, -half * 0.85, half * 0.85)
      z = randRange(rng, -half * 0.85, half * 0.85)
      if (Math.hypot(x, z - 8) < 28) continue
      if (!farEnough(x, z, lakes, 42)) continue
      break
    }
    lakes.push({
      id: `lake-${i}`,
      x,
      z,
      radius: randRange(rng, 10, 18),
    })
  }

  for (let i = 0; i < WORLD.floraCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 30; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 10) continue
      const biome = biomeAt(x, z, lakes)
      if (biome === 'lago') continue
      if (!farEnough(x, z, occupied, biome === 'bosque' ? 2.6 : 3.4)) continue
      ok = true
      break
    }
    if (!ok) continue
    const biome = biomeAt(x, z, lakes)
    const weights = floraWeightsFor(biome)
    if (weights.length === 0) continue
    const kind = pickWeighted(rng, weights)
    flora.push({
      id: `flora-${i}`,
      kind,
      x,
      z,
      scale: randRange(rng, 0.85, 1.3),
      yaw: randRange(rng, 0, Math.PI * 2),
      biome,
    })
    occupied.push({ x, z })
  }

  for (let i = 0; i < WORLD.faunaCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 30; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 12) continue
      const biome = biomeAt(x, z, lakes)
      if (biome === 'lago') continue
      if (faunaWeightsFor(biome).length === 0) continue
      ok = true
      break
    }
    if (!ok) continue
    const biome = biomeAt(x, z, lakes)
    const kind = pickWeighted(rng, faunaWeightsFor(biome))
    fauna.push({
      id: `fauna-${i}`,
      kind,
      x,
      z,
      yaw: randRange(rng, 0, Math.PI * 2),
      biome,
    })
  }

  for (let i = 0; i < WORLD.mineralCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 30; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 8) continue
      const biome = biomeAt(x, z, lakes)
      if (biome === 'lago') continue
      if (mineralWeightsFor(biome).length === 0) continue
      if (!farEnough(x, z, occupied, 2.2)) continue
      ok = true
      break
    }
    if (!ok) continue
    const biome = biomeAt(x, z, lakes)
    const kind = pickWeighted(rng, mineralWeightsFor(biome))
    const def = MINERALS[kind]
    minerals.push({
      id: `mineral-${i}`,
      kind,
      x,
      z,
      scale: randRange(rng, 0.8, 1.35),
      yaw: randRange(rng, 0, Math.PI * 2),
      biome,
      buried: def.buried,
    })
    occupied.push({ x, z })
  }

  return { flora, fauna, minerals, lakes, defs: { FLORA, FAUNA, MINERALS } }
}
