import {
  FAUNA,
  FLORA,
  MINERALS,
  MINES,
  WORLD,
  type BiomeId,
  type FaunaKind,
  type FloraKind,
  type LakeDef,
  type MineKind,
  type MineralKind,
} from './catalog'
import { sampleHeight, sampleSlope } from './heightmap'

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
  y: number
  scale: number
  yaw: number
  biome: BiomeId
}

export type FaunaInstance = {
  id: string
  kind: FaunaKind
  x: number
  z: number
  y: number
  yaw: number
  biome: BiomeId
}

export type MineralInstance = {
  id: string
  kind: MineralKind
  x: number
  z: number
  y: number
  scale: number
  yaw: number
  biome: BiomeId
  buried: boolean
}

export type MineInstance = {
  id: string
  kind: MineKind
  x: number
  z: number
  y: number
  yaw: number
}

export type OrchardZone = {
  id: string
  x: number
  z: number
  radius: number
}

function farEnough(x: number, z: number, points: { x: number; z: number }[], minDist: number) {
  for (const p of points) {
    if (Math.hypot(p.x - x, p.z - z) < minDist) return false
  }
  return true
}

export function biomeAt(
  x: number,
  z: number,
  lakes: LakeDef[],
  orchards: OrchardZone[],
  mines: MineInstance[],
): BiomeId {
  for (const lake of lakes) {
    const d = Math.hypot(x - lake.x, z - lake.z)
    if (d < lake.radius * 0.85) return 'lago'
    if (d < lake.radius * 1.35) return 'humedal'
  }
  for (const o of orchards) {
    if (Math.hypot(x - o.x, z - o.z) < o.radius) return 'huerto'
  }
  for (const m of mines) {
    const r = MINES[m.kind].radius
    if (Math.hypot(x - m.x, z - m.z) < r * 1.2) return 'montana'
  }
  const h = sampleHeight(x, z)
  const slope = sampleSlope(x, z)
  if (h > 22 || (h > 14 && slope > 0.25)) return 'montana'
  if (h > 10 && slope > 0.18) return 'rocoso'
  const forestNoise = Math.sin(x * 0.03 + 1.7) + Math.cos(z * 0.027 - 0.4)
  if (forestNoise > 0.12 && h < 18) return 'bosque'
  return 'pradera'
}

function floraWeightsFor(biome: BiomeId): [FloraKind, number][] {
  return Object.values(FLORA)
    .filter((d) => d.biomes.includes(biome))
    .map((d) => {
      let w = 10
      if (biome === 'bosque' && (d.kind === 'roble' || d.kind === 'pino')) w = 16
      if (biome === 'bosque' && d.kind === 'secuoya') w = 3
      if (biome === 'montana' && (d.kind === 'abeto' || d.kind === 'pino')) w = 18
      if (biome === 'huerto' && (d.kind === 'manzano' || d.kind === 'trigo' || d.kind === 'maiz')) w = 20
      return [d.kind, w]
    })
}

function faunaWeightsFor(biome: BiomeId): [FaunaKind, number][] {
  return Object.values(FAUNA)
    .filter((d) => d.biomes.includes(biome) || (biome === 'huerto' && d.kind === 'conejo'))
    .map((d) => [d.kind, 10])
}

function mineralWeightsFor(biome: BiomeId): [MineralKind, number][] {
  return Object.values(MINERALS)
    .filter((d) => d.biomes.includes(biome))
    .map((d) => [d.kind, d.kind === 'diamante' ? 3 : d.buried ? 8 : 14])
}

/** Large fantasy wilderness with height, mines and orchards. */
export function generateWorld(seed = 20260807) {
  const rng = mulberry32(seed)
  const half = WORLD.half - 8
  const lakes: LakeDef[] = []
  const orchards: OrchardZone[] = []
  const mines: MineInstance[] = []
  const flora: FloraInstance[] = []
  const fauna: FaunaInstance[] = []
  const minerals: MineralInstance[] = []
  const occupied: { x: number; z: number }[] = [{ x: 0, z: 8 }]

  for (let i = 0; i < WORLD.lakeCount; i++) {
    let x = 0
    let z = 0
    for (let attempt = 0; attempt < 40; attempt++) {
      x = randRange(rng, -half * 0.85, half * 0.85)
      z = randRange(rng, -half * 0.85, half * 0.85)
      if (Math.hypot(x, z - 8) < 45) continue
      if (sampleHeight(x, z) > 8) continue
      if (!farEnough(x, z, lakes, 100)) continue
      break
    }
    lakes.push({ id: `lake-${i}`, x, z, radius: randRange(rng, 14, 28) })
  }

  for (let i = 0; i < WORLD.orchardCount; i++) {
    let x = 0
    let z = 0
    for (let attempt = 0; attempt < 40; attempt++) {
      x = randRange(rng, -half * 0.7, half * 0.7)
      z = randRange(rng, -half * 0.7, half * 0.7)
      if (Math.hypot(x, z - 8) < 35) continue
      if (sampleHeight(x, z) > 10 || sampleSlope(x, z) > 0.2) continue
      if (!farEnough(x, z, [...lakes, ...orchards], 70)) continue
      break
    }
    orchards.push({ id: `orchard-${i}`, x, z, radius: randRange(rng, 18, 32) })
  }

  const mineKinds: MineKind[] = [
    'carbon_subterranea',
    'carbon_subterranea',
    'cobre_cielo_abierto',
    'cobre_cielo_abierto',
    'cobre_interior',
    'diamante_profunda',
    'diamante_profunda',
  ]
  for (let i = 0; i < mineKinds.length; i++) {
    const kind = mineKinds[i]
    let x = 0
    let z = 0
    for (let attempt = 0; attempt < 50; attempt++) {
      x = randRange(rng, -half * 0.9, half * 0.9)
      z = randRange(rng, -half * 0.9, half * 0.9)
      if (Math.hypot(x, z - 8) < 80) continue
      const h = sampleHeight(x, z)
      if (kind.includes('diamante') && h < 18) continue
      if (kind === 'cobre_cielo_abierto' && (h < 6 || h > 28)) continue
      if (!farEnough(x, z, mines, 110)) continue
      break
    }
    mines.push({
      id: `mine-${i}`,
      kind,
      x,
      z,
      y: sampleHeight(x, z),
      yaw: randRange(rng, 0, Math.PI * 2),
    })
  }

  const biomeCtx = () => ({ lakes, orchards, mines })

  for (let i = 0; i < WORLD.floraCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 36; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 12) continue
      if (sampleSlope(x, z) > 0.45) continue
      const { lakes: L, orchards: O, mines: M } = biomeCtx()
      const biome = biomeAt(x, z, L, O, M)
      if (biome === 'lago') continue
      if (!farEnough(x, z, occupied, biome === 'bosque' ? 2.4 : 3.2)) continue
      if (floraWeightsFor(biome).length === 0) continue
      ok = true
      break
    }
    if (!ok) continue
    const biome = biomeAt(x, z, lakes, orchards, mines)
    const weights = floraWeightsFor(biome)
    if (!weights.length) continue
    const kind = pickWeighted(rng, weights)
    flora.push({
      id: `flora-${i}`,
      kind,
      x,
      z,
      y: sampleHeight(x, z),
      scale: randRange(rng, 0.85, 1.35),
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
      if (Math.hypot(x, z - 8) < 14) continue
      if (sampleSlope(x, z) > 0.35) continue
      const biome = biomeAt(x, z, lakes, orchards, mines)
      if (biome === 'lago' || faunaWeightsFor(biome).length === 0) continue
      ok = true
      break
    }
    if (!ok) continue
    const biome = biomeAt(x, z, lakes, orchards, mines)
    fauna.push({
      id: `fauna-${i}`,
      kind: pickWeighted(rng, faunaWeightsFor(biome)),
      x,
      z,
      y: sampleHeight(x, z),
      yaw: randRange(rng, 0, Math.PI * 2),
      biome,
    })
  }

  // Scatter minerals; force mine interiors to hold their ores.
  for (const mine of mines) {
    const def = MINES[mine.kind]
    const count = def.openPit ? 10 : 7
    for (let j = 0; j < count; j++) {
      const ang = rng() * Math.PI * 2
      const rad = rng() * def.radius * 0.75
      const x = mine.x + Math.cos(ang) * rad
      const z = mine.z + Math.sin(ang) * rad
      const kind = def.yields[Math.floor(rng() * def.yields.length)]
      const mdef = MINERALS[kind]
      minerals.push({
        id: `mineral-mine-${mine.id}-${j}`,
        kind,
        x,
        z,
        y: sampleHeight(x, z) - (def.openPit ? 0.2 : 0.6),
        scale: randRange(rng, 0.85, 1.3),
        yaw: randRange(rng, 0, Math.PI * 2),
        biome: 'montana',
        buried: mdef.buried && !def.openPit,
      })
    }
  }

  for (let i = 0; i < WORLD.mineralCount; i++) {
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 30; attempt++) {
      x = randRange(rng, -half, half)
      z = randRange(rng, -half, half)
      if (Math.hypot(x, z - 8) < 10) continue
      const biome = biomeAt(x, z, lakes, orchards, mines)
      if (biome === 'lago' || mineralWeightsFor(biome).length === 0) continue
      if (!farEnough(x, z, occupied, 2.2)) continue
      ok = true
      break
    }
    if (!ok) continue
    const biome = biomeAt(x, z, lakes, orchards, mines)
    const kind = pickWeighted(rng, mineralWeightsFor(biome))
    const def = MINERALS[kind]
    minerals.push({
      id: `mineral-${i}`,
      kind,
      x,
      z,
      y: sampleHeight(x, z),
      scale: randRange(rng, 0.8, 1.35),
      yaw: randRange(rng, 0, Math.PI * 2),
      biome,
      buried: def.buried,
    })
    occupied.push({ x, z })
  }

  return { flora, fauna, minerals, lakes, orchards, mines, defs: { FLORA, FAUNA, MINERALS } }
}
