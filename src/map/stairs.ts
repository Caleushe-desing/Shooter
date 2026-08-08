import type { SolidAABB } from './proceduralLayout'

type DoorSide = 'n' | 's' | 'e' | 'w'

/** Uniform modular stair run — constant rise/run, walkable step tops. */
export const STAIR = {
  stepH: 0.36,
  stepD: 0.48,
  width: 1.7,
  color: '#B89A72',
  railColor: '#7A8896',
  railH: 0.8,
  railT: 0.12,
} as const

type BoxFn = (
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
) => SolidAABB

/**
 * Straight exterior stair from ground up onto the rooftop.
 * Starts away from the building and climbs toward the wall/roof edge.
 */
export function addStraightStairs(
  _solids: SolidAABB[],
  opts: {
    buildingX: number
    buildingZ: number
    buildingW: number
    buildingD: number
    baseY: number
    topY: number
    side: DoorSide
    box: BoxFn
    nid: (prefix: string) => string
    add: (s: SolidAABB) => void
  },
) {
  const { buildingX: bx, buildingZ: bz, buildingW: bw, buildingD: bd, baseY, topY, side } = opts
  const rise = Math.max(STAIR.stepH, topY - baseY)
  const steps = Math.max(2, Math.ceil(rise / STAIR.stepH))
  const stepH = rise / steps
  const stepD = STAIR.stepD
  const w = STAIR.width
  const hw = bw * 0.5
  const hd = bd * 0.5
  const gap = 0.2
  const alongX = side === 'e' || side === 'w'

  // Contact point on the building face (top of stairs / landing).
  let endX = bx
  let endZ = bz
  let dx = 0
  let dz = 0

  if (side === 's') {
    endX = bx + Math.min(hw - w * 0.55, hw * 0.4)
    endZ = bz + hd + gap + stepD * 0.5
    dz = -stepD // climb while moving north toward the wall
  } else if (side === 'n') {
    endX = bx - Math.min(hw - w * 0.55, hw * 0.4)
    endZ = bz - hd - gap - stepD * 0.5
    dz = stepD
  } else if (side === 'e') {
    endX = bx + hw + gap + stepD * 0.5
    endZ = bz - Math.min(hd - w * 0.55, hd * 0.4)
    dx = -stepD
  } else {
    endX = bx - hw - gap - stepD * 0.5
    endZ = bz + Math.min(hd - w * 0.55, hd * 0.4)
    dx = stepD
  }

  // First tread is furthest from the building.
  const x0 = endX - dx * (steps - 1)
  const z0 = endZ - dz * (steps - 1)

  for (let i = 0; i < steps; i++) {
    const x = x0 + dx * i
    const z = z0 + dz * i
    const y = baseY + i * stepH
    const treadW = alongX ? stepD * 0.96 : w
    const treadD = alongX ? w : stepD * 0.96
    opts.add(
      opts.box(opts.nid('stair'), x, y, z, treadW, stepH, treadD, STAIR.color, true, 'step'),
    )
  }

  // Landing on the roof edge so you step off cleanly.
  if (alongX) {
    opts.add(
      opts.box(
        opts.nid('landing'),
        side === 'e' ? bx + hw - 0.55 : bx - hw + 0.55,
        topY,
        endZ,
        1.2,
        0.2,
        w + 0.3,
        STAIR.color,
        true,
        'floor',
      ),
    )
  } else {
    opts.add(
      opts.box(
        opts.nid('landing'),
        endX,
        topY,
        side === 's' ? bz + hd - 0.55 : bz - hd + 0.55,
        w + 0.3,
        0.2,
        1.2,
        STAIR.color,
        true,
        'floor',
      ),
    )
  }

  for (let i = 0; i < steps; i += 2) {
    const x = x0 + dx * i
    const z = z0 + dz * i
    const y = baseY + i * stepH + stepH * 0.5
    if (alongX) {
      opts.add(
        opts.box(
          opts.nid('rail'),
          x,
          y,
          z + w * 0.5 + 0.08,
          Math.max(stepD, 0.35),
          STAIR.railH,
          STAIR.railT,
          STAIR.railColor,
          false,
          'prop',
        ),
      )
    } else {
      opts.add(
        opts.box(
          opts.nid('rail'),
          x + w * 0.5 + 0.08,
          y,
          z,
          STAIR.railT,
          STAIR.railH,
          Math.max(stepD, 0.35),
          STAIR.railColor,
          false,
          'prop',
        ),
      )
    }
  }
}
