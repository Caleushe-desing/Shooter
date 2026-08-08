/**
 * Sober industrial / earth interior palette.
 * No bright primaries — wood, stone, dirty white, charcoal fabric.
 */
export const MAT = {
  floor: '#9A8B74',
  wall: '#E4DDD2',
  wallDirty: '#D6CFC4',
  baseboard: '#B8AFA0',
  ceiling: '#EDE8E0',
  /** Uniform hardwood — main table & ramp. */
  wood: '#8B5A2B',
  woodDark: '#6E4520',
  woodEdge: '#7A4E24',
  /** Charcoal upholstery for the sofa. */
  fabric: '#5C5854',
  fabricDark: '#4A4642',
  /** Industrial steel / shelf frames. */
  steel: '#7A7E84',
  steelDark: '#5C6066',
  shelf: '#8A8680',
  /** Quiet control-zone accent (rust, not toy red). */
  accent: '#8B4A3A',
  accentSoft: '#A06050',
  flagPole: '#3E3C3A',
} as const

export type MatKey = keyof typeof MAT

/** Per-color PBR finish so merged meshes catch light cleanly. */
export const FINISH: Record<string, { roughness: number; metalness: number }> = {
  [MAT.floor]: { roughness: 0.9, metalness: 0.02 },
  [MAT.wall]: { roughness: 0.94, metalness: 0.01 },
  [MAT.wallDirty]: { roughness: 0.92, metalness: 0.01 },
  [MAT.baseboard]: { roughness: 0.88, metalness: 0.02 },
  [MAT.ceiling]: { roughness: 0.96, metalness: 0.0 },
  [MAT.wood]: { roughness: 0.7, metalness: 0.04 },
  [MAT.woodDark]: { roughness: 0.74, metalness: 0.04 },
  [MAT.woodEdge]: { roughness: 0.72, metalness: 0.04 },
  [MAT.fabric]: { roughness: 0.92, metalness: 0.0 },
  [MAT.fabricDark]: { roughness: 0.94, metalness: 0.0 },
  [MAT.steel]: { roughness: 0.55, metalness: 0.35 },
  [MAT.steelDark]: { roughness: 0.5, metalness: 0.4 },
  [MAT.shelf]: { roughness: 0.78, metalness: 0.08 },
  [MAT.accent]: { roughness: 0.68, metalness: 0.08 },
  [MAT.accentSoft]: { roughness: 0.72, metalness: 0.05 },
  [MAT.flagPole]: { roughness: 0.45, metalness: 0.55 },
}

export function finishFor(color: string) {
  return FINISH[color] ?? { roughness: 0.82, metalness: 0.04 }
}
