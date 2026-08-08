import { ARENA } from '../constants'
import { HANGAR_TOP } from './hangar'
import type { SolidAABB } from './proceduralLayout'

/** Classic Rubik face colors. */
export const RUBIK_COLORS = [
  '#C62828', // red
  '#F9A825', // yellow
  '#1565C0', // blue
  '#2E7D32', // green
  '#F4511E', // orange
  '#ECEFF1', // white
] as const

export type RubikCube = {
  x: number
  y: number
  z: number
  size: number
  color: string
}

export const RUBIK = {
  cube: 2.5,
  inset: 0.05,
  /**
   * Enough layers to reach past the hangar ceiling underside so no sky gap shows.
   * Top of last layer sits above HANGAR_TOP.
   */
  get layers() {
    return Math.ceil((HANGAR_TOP + RUBIK.cube * 0.35) / RUBIK.cube)
  },
} as const

/** Chaotic per-cube color — well-mixed hash, no ordered stripes/rows. */
function chaoticColor(i: number, layer: number, side: number) {
  let h = (i + 1) * 374761393
  h = Math.imul(h ^ (layer + 1) * 668265263, 2246822519)
  h = Math.imul(h ^ (side + 1) * 1274126177, 3266489917)
  h ^= h >>> 15
  h = Math.imul(h ^ (i * 17 + layer * 31 + side * 13), 0x85ebca6b)
  h ^= h >>> 13
  // Extra scramble so neighbors rarely share the same face color.
  h = Math.imul(h ^ (h >>> 16), 0xc2b2ae35)
  return RUBIK_COLORS[(h >>> 0) % RUBIK_COLORS.length]!
}

/** Visual cube grid for all four perimeter faces (corners shared once). */
export function buildRubikCubes(): RubikCube[] {
  const half = ARENA.size * 0.5
  const s = RUBIK.cube
  const layers = RUBIK.layers
  const n = Math.round(ARENA.size / s)
  const cubes: RubikCube[] = []
  const edge = half - s * 0.5 - RUBIK.inset

  for (let layer = 0; layer < layers; layer++) {
    const y = layer * s + s * 0.5
    for (let i = 0; i < n; i++) {
      const t = -half + s * 0.5 + i * s
      cubes.push({ x: t, y, z: -edge, size: s * 0.96, color: chaoticColor(i, layer, 0) })
      cubes.push({ x: t, y, z: edge, size: s * 0.96, color: chaoticColor(i, layer, 1) })
    }
    for (let i = 1; i < n - 1; i++) {
      const t = -half + s * 0.5 + i * s
      cubes.push({ x: edge, y, z: t, size: s * 0.96, color: chaoticColor(i, layer, 2) })
      cubes.push({ x: -edge, y, z: t, size: s * 0.96, color: chaoticColor(i, layer, 3) })
    }
  }
  return cubes
}

/** Four solid collision slabs matching the full Rubik perimeter height. */
export function createRubikCollisionSolids(idPrefix: string): SolidAABB[] {
  const half = ARENA.size * 0.5
  const thick = RUBIK.cube
  const height = RUBIK.cube * RUBIK.layers
  const mid = half - thick * 0.5

  const mk = (id: string, x: number, z: number, w: number, d: number): SolidAABB => ({
    id: `${idPrefix}-${id}`,
    x,
    y: 0,
    z,
    width: w,
    depth: d,
    height,
    color: '#1565C0',
    walkable: true,
    kind: 'wall',
  })

  return [
    mk('n', 0, -mid, ARENA.size, thick),
    mk('s', 0, mid, ARENA.size, thick),
    mk('e', mid, 0, thick, ARENA.size - thick * 2),
    mk('w', -mid, 0, thick, ARENA.size - thick * 2),
  ]
}

/** Outer XY extent of the Rubik wall (for ceiling overhang). */
export function rubikOuterHalf() {
  return ARENA.size * 0.5 + RUBIK.cube * 0.5
}
