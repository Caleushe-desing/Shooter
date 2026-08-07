import { COLORS, type SolidBox } from '../constants'

export type PropBox = {
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
  color: string
  /** If true, blocks player movement on XZ. */
  solid?: boolean
  roughness?: number
}

/** Building block helper (origin at footprint center, sits on ground). */
function building(
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  color: string,
  extras: PropBox[] = [],
): PropBox[] {
  return [
    { x, y: h / 2, z, w, h, d, color, solid: true, roughness: 0.9 },
    ...extras,
  ]
}

function roof(
  x: number,
  z: number,
  w: number,
  d: number,
  baseH: number,
  color: string = COLORS.roof,
): PropBox {
  return {
    x,
    y: baseH + 0.22,
    z,
    w: w + 0.35,
    h: 0.45,
    d: d + 0.35,
    color,
    solid: false,
    roughness: 0.85,
  }
}

/**
 * Large three-plaza layout inspired by Haven-style topology
 * (A west · Mid · C east · B south temple), original blockout only.
 */
export function buildHavenInspiredMap(): { props: PropBox[]; solids: SolidBox[] } {
  const props: PropBox[] = []
  const S = 96
  const half = S / 2
  const t = 1.1
  const wallH = 4.2

  // Outer perimeter (gaps none — closed courtyard city).
  props.push(
    { x: 0, y: wallH / 2, z: -half + t / 2, w: S, h: wallH, d: t, color: COLORS.stoneDark, solid: true },
    { x: 0, y: wallH / 2, z: half - t / 2, w: S, h: wallH, d: t, color: COLORS.stoneDark, solid: true },
    { x: -half + t / 2, y: wallH / 2, z: 0, w: t, h: wallH, d: S, color: COLORS.stoneDark, solid: true },
    { x: half - t / 2, y: wallH / 2, z: 0, w: t, h: wallH, d: S, color: COLORS.stoneDark, solid: true },
  )

  // —— Site A (west courtyard) ——
  props.push(
    ...building(-30, -8, 10, 8, 4.5, COLORS.stone, [roof(-30, -8, 10, 8, 4.5)]),
    ...building(-34, 6, 7, 10, 5.5, COLORS.plaster, [roof(-34, 6, 7, 10, 5.5, COLORS.roofGreen)]),
    ...building(-22, 14, 8, 6, 3.8, COLORS.brick, [roof(-22, 14, 8, 6, 3.8)]),
    ...building(-38, -20, 6, 12, 6.2, COLORS.stoneDark, [roof(-38, -20, 6, 12, 6.2)]),
    // Low cover walls around A plaza
    { x: -26, y: 1.1, z: 0, w: 1, h: 2.2, d: 14, color: COLORS.stone, solid: true },
    { x: -18, y: 0.9, z: -12, w: 12, h: 1.8, d: 0.9, color: COLORS.wood, solid: true },
  )

  // —— Mid lane (north–south spine) ——
  props.push(
    { x: -8, y: 2.2, z: 2, w: 1.2, h: 4.4, d: 22, color: COLORS.stone, solid: true },
    { x: 8, y: 2.2, z: 2, w: 1.2, h: 4.4, d: 22, color: COLORS.stone, solid: true },
    ...building(-12, 18, 6, 8, 4, COLORS.plaster, [roof(-12, 18, 6, 8, 4)]),
    ...building(12, 18, 6, 8, 4, COLORS.plaster, [roof(12, 18, 6, 8, 4)]),
    ...building(-11, -18, 5, 7, 3.6, COLORS.brick, [roof(-11, -18, 5, 7, 3.6)]),
    ...building(11, -18, 5, 7, 3.6, COLORS.brick, [roof(11, -18, 5, 7, 3.6)]),
    // Mid arches / gate pillars
    { x: -4.5, y: 2.5, z: -6, w: 1.4, h: 5, d: 1.4, color: COLORS.stoneDark, solid: true },
    { x: 4.5, y: 2.5, z: -6, w: 1.4, h: 5, d: 1.4, color: COLORS.stoneDark, solid: true },
    { x: 0, y: 4.6, z: -6, w: 10, h: 0.7, d: 1.6, color: COLORS.stone, solid: false },
  )

  // —— Site C (east courtyard) ——
  props.push(
    ...building(30, -6, 11, 9, 4.8, COLORS.stone, [roof(30, -6, 11, 9, 4.8)]),
    ...building(34, 8, 8, 11, 5.8, COLORS.plaster, [roof(34, 8, 8, 11, 5.8, COLORS.roofGreen)]),
    ...building(22, 16, 7, 6, 3.5, COLORS.brick, [roof(22, 16, 7, 6, 3.5)]),
    ...building(38, -22, 7, 10, 6.5, COLORS.stoneDark, [roof(38, -22, 7, 10, 6.5)]),
    { x: 26, y: 1.1, z: 2, w: 1, h: 2.2, d: 16, color: COLORS.stone, solid: true },
    { x: 18, y: 0.9, z: -14, w: 12, h: 1.8, d: 0.9, color: COLORS.wood, solid: true },
  )

  // —— Site B (south “temple” plaza) ——
  props.push(
    // Raised plaza pad (visual only — XZ collision is flat for this demo)
    { x: 0, y: 0.28, z: 30, w: 28, h: 0.56, d: 18, color: COLORS.sand, solid: false, roughness: 0.95 },
    // Temple hall
    ...building(0, 34, 14, 8, 6.5, COLORS.stoneDark, [
      roof(0, 34, 14, 8, 6.5, COLORS.roof),
    ]),
    // Side wings
    ...building(-12, 28, 6, 6, 4.2, COLORS.stone, [roof(-12, 28, 6, 6, 4.2)]),
    ...building(12, 28, 6, 6, 4.2, COLORS.stone, [roof(12, 28, 6, 6, 4.2)]),
    // Pillars in front of temple
    { x: -5, y: 2.4, z: 24, w: 1.2, h: 4.8, d: 1.2, color: COLORS.stone, solid: true },
    { x: 0, y: 2.4, z: 24, w: 1.2, h: 4.8, d: 1.2, color: COLORS.stone, solid: true },
    { x: 5, y: 2.4, z: 24, w: 1.2, h: 4.8, d: 1.2, color: COLORS.stone, solid: true },
    { x: 0, y: 5.1, z: 24, w: 12, h: 0.55, d: 1.6, color: COLORS.stoneDark, solid: false },
    // Low steps / ledge edge toward mid (walkable gap in center)
    { x: -10, y: 0.55, z: 21, w: 8, h: 1.1, d: 1.2, color: COLORS.stone, solid: true },
    { x: 10, y: 0.55, z: 21, w: 8, h: 1.1, d: 1.2, color: COLORS.stone, solid: true },
  )

  // —— Connector alleys / market stalls (cover) ——
  props.push(
    { x: -20, y: 1.3, z: 22, w: 8, h: 2.6, d: 1.1, color: COLORS.wood, solid: true },
    { x: 20, y: 1.3, z: 22, w: 8, h: 2.6, d: 1.1, color: COLORS.wood, solid: true },
    ...building(-28, 28, 8, 5, 3.2, COLORS.plaster, [roof(-28, 28, 8, 5, 3.2)]),
    ...building(28, 28, 8, 5, 3.2, COLORS.plaster, [roof(28, 28, 8, 5, 3.2)]),
    // North market / spawn cover
    ...building(-16, -30, 9, 6, 3.4, COLORS.brick, [roof(-16, -30, 9, 6, 3.4)]),
    ...building(16, -30, 9, 6, 3.4, COLORS.brick, [roof(16, -30, 9, 6, 3.4)]),
    { x: 0, y: 1.2, z: -28, w: 10, h: 2.4, d: 1, color: COLORS.wood, solid: true },
    // Crates / low cover mid
    { x: -3, y: 0.55, z: 8, w: 1.6, h: 1.1, d: 1.6, color: COLORS.wood, solid: true },
    { x: 3.2, y: 0.55, z: 9, w: 1.4, h: 1.1, d: 1.4, color: COLORS.wood, solid: true },
    { x: -2.2, y: 0.9, z: -2, w: 1.2, h: 1.8, d: 1.2, color: COLORS.stone, solid: true },
    { x: 2.5, y: 0.7, z: -3, w: 2, h: 1.4, d: 1.1, color: COLORS.wood, solid: true },
  )

  const solids: SolidBox[] = props
    .filter((p) => p.solid)
    .map((p) => ({ x: p.x, z: p.z, w: p.w, d: p.d }))

  return { props, solids }
}
