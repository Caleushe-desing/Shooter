import { FAUNA, FLORA, MINERALS, WORLD, type FaunaKind } from '../world/catalog'
import { sampleHeight } from '../world/heightmap'
import { useWorldStore } from './worldStore'
import { getPlayerPosition } from './enemyRuntime'
import { resolveCircleBoxCollision, type Collider } from '../constants'

export type FaunaRuntime = {
  x: number
  z: number
  y: number
  yaw: number
  speed: number
  phase: number
  targetX: number
  targetZ: number
  nextWanderAt: number
  fleeing: boolean
}

const runtimes = new Map<string, FaunaRuntime>()

export function clearFaunaRuntimes() {
  runtimes.clear()
}

export function getFaunaRuntime(id: string) {
  return runtimes.get(id)
}

export function ensureFaunaRuntime(
  id: string,
  kind: FaunaKind,
  x: number,
  z: number,
  yaw: number,
): FaunaRuntime {
  let rt = runtimes.get(id)
  if (rt) return rt
  rt = {
    x,
    z,
    y: sampleHeight(x, z),
    yaw,
    speed: FAUNA[kind].speed * (0.85 + Math.random() * 0.3),
    phase: Math.random() * Math.PI * 2,
    targetX: x,
    targetZ: z,
    nextWanderAt: performance.now() + 800 + Math.random() * 2400,
    fleeing: false,
  }
  runtimes.set(id, rt)
  return rt
}

function pickWander(rt: FaunaRuntime) {
  const half = WORLD.half - 4
  const ang = Math.random() * Math.PI * 2
  const dist = 4 + Math.random() * 14
  rt.targetX = Math.max(-half, Math.min(half, rt.x + Math.cos(ang) * dist))
  rt.targetZ = Math.max(-half, Math.min(half, rt.z + Math.sin(ang) * dist))
  rt.nextWanderAt = performance.now() + 1800 + Math.random() * 4200
}

/** Advance living fauna: wander, flee from player, collide with world solids. */
export function stepFauna(dt: number, colliders: Collider[]) {
  const now = performance.now()
  const player = getPlayerPosition()
  const fauna = useWorldStore.getState().fauna

  for (const animal of fauna) {
    if (!animal.alive) continue
    const def = FAUNA[animal.kind]
    const rt = ensureFaunaRuntime(animal.id, animal.kind, animal.x, animal.z, animal.yaw)

    const toPlayerX = rt.x - player.x
    const toPlayerZ = rt.z - player.z
    const distPlayer = Math.hypot(toPlayerX, toPlayerZ)
    rt.fleeing = distPlayer < def.fleeRange || animal.hp < def.hp

    if (rt.fleeing && distPlayer > 1e-4) {
      rt.targetX = rt.x + (toPlayerX / distPlayer) * 18
      rt.targetZ = rt.z + (toPlayerZ / distPlayer) * 18
      const half = WORLD.half - 3
      rt.targetX = Math.max(-half, Math.min(half, rt.targetX))
      rt.targetZ = Math.max(-half, Math.min(half, rt.targetZ))
    } else if (now >= rt.nextWanderAt) {
      pickWander(rt)
    }

    const dx = rt.targetX - rt.x
    const dz = rt.targetZ - rt.z
    const dist = Math.hypot(dx, dz)
    if (dist > 0.15) {
      const spd = rt.speed * (rt.fleeing ? 1.35 : 0.7) * dt
      const step = Math.min(spd, dist)
      let nx = rt.x + (dx / dist) * step
      let nz = rt.z + (dz / dist) * step
      const resolved = resolveCircleBoxCollision(nx, nz, def.radius, colliders)
      rt.x = resolved.x
      rt.z = resolved.z
      rt.y = sampleHeight(rt.x, rt.z)
      rt.yaw = Math.atan2(dx, dz)
    } else {
      rt.y = sampleHeight(rt.x, rt.z)
    }
  }
}

export function findClosestFaunaHit(
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  maxDistance: number,
): { id: string; distance: number; point: [number, number, number] } | null {
  let best: { id: string; distance: number; point: [number, number, number] } | null = null
  const fauna = useWorldStore.getState().fauna

  for (const animal of fauna) {
    if (!animal.alive) continue
    const def = FAUNA[animal.kind]
    const rt = getFaunaRuntime(animal.id)
    if (!rt) continue
    const cx = rt.x
    const cy = rt.y + def.height * 0.55
    const cz = rt.z
    const ox = origin.x - cx
    const oy = origin.y - cy
    const oz = origin.z - cz
    const b = ox * dir.x + oy * dir.y + oz * dir.z
    const c = ox * ox + oy * oy + oz * oz - def.radius * def.radius
    const disc = b * b - c
    if (disc < 0) continue
    const t = -b - Math.sqrt(disc)
    if (t < 0.05 || t > maxDistance) continue
    if (best && t >= best.distance) continue
    best = {
      id: animal.id,
      distance: t,
      point: [origin.x + dir.x * t, origin.y + dir.y * t, origin.z + dir.z * t],
    }
  }
  return best
}

export function findClosestWorldPropHit(
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  maxDistance: number,
):
  | { type: 'flora' | 'mineral'; id: string; distance: number }
  | null {
  let best: { type: 'flora' | 'mineral'; id: string; distance: number } | null = null
  const state = useWorldStore.getState()

  for (const f of state.flora) {
    if (!f.alive) continue
    const def = FLORA[f.kind]
    const baseY = f.y
    const canopyR = def.radius * f.scale * (def.woodOnFell > 0 ? 1.85 : 1.25)
    const a = dir.x * dir.x + dir.z * dir.z
    if (a >= 1e-8) {
      const bx = origin.x - f.x
      const bz = origin.z - f.z
      const b = bx * dir.x + bz * dir.z
      const c = bx * bx + bz * bz - canopyR * canopyR
      const disc = b * b - a * c
      if (disc >= 0) {
        const t = (-b - Math.sqrt(disc)) / a
        if (t >= 0.05 && t <= maxDistance) {
          const y = origin.y + dir.y * t
          if (y >= baseY - 0.2 && y <= baseY + def.height * f.scale + 0.5) {
            if (!best || t < best.distance) best = { type: 'flora', id: f.id, distance: t }
          }
        }
      }
    }
  }
  for (const m of state.minerals) {
    if (!m.alive || !m.revealed) continue
    const def = MINERALS[m.kind]
    const baseY = m.y
    const a = dir.x * dir.x + dir.z * dir.z
    if (a < 1e-8) continue
    const bx = origin.x - m.x
    const bz = origin.z - m.z
    const rad = def.radius * m.scale
    const b = bx * dir.x + bz * dir.z
    const c = bx * bx + bz * bz - rad * rad
    const disc = b * b - a * c
    if (disc < 0) continue
    const t = (-b - Math.sqrt(disc)) / a
    if (t < 0.05 || t > maxDistance) continue
    const y = origin.y + dir.y * t
    if (y < baseY - 0.2 || y > baseY + def.height * m.scale + 0.4) continue
    if (!best || t < best.distance) best = { type: 'mineral', id: m.id, distance: t }
  }
  return best
}
