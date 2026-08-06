import { create } from 'zustand'
import * as THREE from 'three'
import { COLORS, COMBAT } from '../constants'
import { clearAllLivePlates, clearLivePlatePosition } from './platePositions'
import { findClosestPlateHit, findCratePierces, tracerSegmentHit } from './combat'

export type PlateData = {
  id: string
  position: [number, number, number]
  color: string
  phase: number
  appearAt: number
  visible: boolean
}

export type TracerData = {
  id: string
  origin: [number, number, number]
  direction: [number, number, number]
  born: number
  distance: number
  /** If false, tracer is visual-only (hitscan already resolved the shot). */
  lethal: boolean
  maxDistance: number
}

export type Fragment = {
  id: string
  position: [number, number, number]
  velocity: [number, number, number]
  color: string
  born: number
  size: number
  spin: [number, number, number]
}

export type ExplosionData = {
  id: string
  fragments: Fragment[]
}

/** Bullet hole punched through a styrofoam crate; persists for the round. */
export type PierceHole = {
  id: string
  position: [number, number, number]
  normal: [number, number, number]
  /** Random roll so holes don't look like identical stamps. */
  spin: number
  scale: number
}

type InputState = {
  moveX: number
  moveZ: number
  lookDx: number
  lookDy: number
  fireQueued: boolean
}

type GameState = {
  score: number
  plates: PlateData[]
  tracers: TracerData[]
  explosions: ExplosionData[]
  pierceHoles: PierceHole[]
  sectorCleared: boolean
  round: number
  input: InputState
  recoilNonce: number
  setMove: (x: number, z: number) => void
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
  queueFire: () => void
  consumeFire: () => boolean
  /**
   * Hitscan from aimOrigin/aimDir (screen-center / crosshair).
   * Visual tracer starts at visualOrigin (muzzle) and flies to the aim point.
   * Styrofoam crates are pierceable — never stop the shot.
   */
  spawnTracer: (
    aimOrigin: THREE.Vector3,
    aimDir: THREE.Vector3,
    visualOrigin?: THREE.Vector3,
  ) => void
  updateTracers: (dt: number, now: number) => void
  hitPlate: (plateId: string, hitPos: THREE.Vector3) => void
  updateExplosions: (dt: number, now: number) => void
  revealPlates: (now: number) => void
  resetRound: () => void
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function createPlates(round: number): PlateData[] {
  const plates: PlateData[] = []
  const count = COMBAT.plateCount
  const now = performance.now()

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + round * 0.35
    const radius = 4 + (i % 4) * 2.2 + (round % 3) * 0.4
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius - 2
    const y = 1.2 + (i % 3) * 0.55

    plates.push({
      id: uid('plate'),
      position: [x, y, z],
      color: COLORS.plates[i % COLORS.plates.length],
      phase: Math.random() * Math.PI * 2,
      appearAt: now + 400 + i * 280,
      visible: false,
    })
  }

  return plates
}

function createExplosion(pos: THREE.Vector3, color: string): ExplosionData {
  const fragments: Fragment[] = []
  for (let i = 0; i < COMBAT.explosionFragments; i++) {
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 0.2,
      Math.random() * 2 - 1,
    ).normalize()
    const speed = 3 + Math.random() * 7
    fragments.push({
      id: uid('frag'),
      position: [pos.x, pos.y, pos.z],
      velocity: [dir.x * speed, dir.y * speed, dir.z * speed],
      color,
      born: performance.now(),
      size: 0.08 + Math.random() * 0.16,
      spin: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ],
    })
  }
  return { id: uid('boom'), fragments }
}

/** Light foam chip burst when a round punches through plumavit. */
function createFoamBurst(
  pos: THREE.Vector3,
  outward: THREE.Vector3,
  shotDir: THREE.Vector3,
): ExplosionData {
  const fragments: Fragment[] = []
  const base = outward.clone().normalize()
  for (let i = 0; i < COMBAT.pierceChips; i++) {
    const dir = new THREE.Vector3(
      base.x + (Math.random() - 0.5) * 1.4 + shotDir.x * 0.35,
      base.y + (Math.random() - 0.5) * 1.4 + shotDir.y * 0.35,
      base.z + (Math.random() - 0.5) * 1.4 + shotDir.z * 0.35,
    ).normalize()
    const speed = 1.2 + Math.random() * 3.5
    fragments.push({
      id: uid('foam'),
      position: [pos.x, pos.y, pos.z],
      velocity: [dir.x * speed, dir.y * speed + 0.6, dir.z * speed],
      color: Math.random() > 0.35 ? COLORS.foamChip : COLORS.woodDark,
      born: performance.now(),
      size: 0.04 + Math.random() * 0.09,
      spin: [
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
      ],
    })
  }
  return { id: uid('pierce'), fragments }
}

function holeFrom(pos: THREE.Vector3, normal: THREE.Vector3): PierceHole {
  const n = normal.lengthSq() > 0 ? normal.clone().normalize() : new THREE.Vector3(0, 0, 1)
  // Crate bodies are inset 0.01 from the collision box, so pull the decal
  // slightly inward to sit just proud of the visible foam face.
  const p = pos.clone().addScaledVector(n, -0.008)
  return {
    id: uid('hole'),
    position: [p.x, p.y, p.z],
    normal: [n.x, n.y, n.z],
    spin: Math.random() * Math.PI * 2,
    scale: 0.82 + Math.random() * 0.5,
  }
}

const initialInput: InputState = {
  moveX: 0,
  moveZ: 0,
  lookDx: 0,
  lookDy: 0,
  fireQueued: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  plates: createPlates(1),
  tracers: [],
  explosions: [],
  pierceHoles: [],
  sectorCleared: false,
  round: 1,
  input: { ...initialInput },
  recoilNonce: 0,

  setMove: (x, z) =>
    set((s) => ({
      input: { ...s.input, moveX: x, moveZ: z },
    })),

  addLook: (dx, dy) =>
    set((s) => ({
      input: {
        ...s.input,
        lookDx: s.input.lookDx + dx,
        lookDy: s.input.lookDy + dy,
      },
    })),

  consumeLook: () => {
    const { lookDx, lookDy } = get().input
    if (lookDx === 0 && lookDy === 0) return { dx: 0, dy: 0 }
    set((s) => ({
      input: { ...s.input, lookDx: 0, lookDy: 0 },
    }))
    return { dx: lookDx, dy: lookDy }
  },

  queueFire: () =>
    set((s) => ({
      input: { ...s.input, fireQueued: true },
      recoilNonce: s.recoilNonce + 1,
    })),

  consumeFire: () => {
    if (!get().input.fireQueued) return false
    set((s) => ({
      input: { ...s.input, fireQueued: false },
    }))
    return true
  },

  spawnTracer: (aimOrigin, aimDir, visualOrigin) => {
    const dir = aimDir.clone().normalize()
    const now = performance.now()

    // Precise hitscan exactly through the crosshair (camera center ray).
    // Crates are styrofoam — they never occlude this ray.
    const hit = findClosestPlateHit(aimOrigin, dir, get().plates)
    const shotRange = hit?.distance ?? COMBAT.tracerMaxDistance

    // Aim point always lies on the crosshair ray (hit or max range).
    const aimPoint = aimOrigin.clone().addScaledVector(dir, shotRange)

    if (hit) {
      get().hitPlate(hit.plateId, hit.point)
    }

    // Punch through any plumavit crates along the shot (entry + exit).
    const pierces = findCratePierces(aimOrigin, dir, shotRange)
    const foamBursts: ExplosionData[] = []
    const newHoles: PierceHole[] = []
    for (const p of pierces) {
      foamBursts.push(createFoamBurst(p.enter, p.enterNormal, dir))
      foamBursts.push(createFoamBurst(p.exit, p.exitNormal, dir.clone().negate()))
      newHoles.push(holeFrom(p.enter, p.enterNormal))
      newHoles.push(holeFrom(p.exit, p.exitNormal))
    }

    // Visual streak: muzzle → aim point (flies straight through foam crates).
    const start = visualOrigin?.clone() ?? aimOrigin.clone()
    const visualDir = aimPoint.clone().sub(start)
    const maxDistance = Math.max(visualDir.length(), 0.5)
    if (visualDir.lengthSq() < 1e-8) {
      visualDir.copy(dir)
    } else {
      visualDir.normalize()
    }

    set((s) => {
      const pierceHoles = [...s.pierceHoles, ...newHoles]
      const overflow = pierceHoles.length - COMBAT.pierceHoleMax
      if (overflow > 0) pierceHoles.splice(0, overflow)

      return {
        tracers: [
          ...s.tracers,
          {
            id: uid('tracer'),
            origin: [start.x, start.y, start.z],
            direction: [visualDir.x, visualDir.y, visualDir.z],
            born: now,
            distance: 0,
            lethal: false, // damage already resolved by crosshair hitscan
            maxDistance,
          },
        ],
        explosions: foamBursts.length ? [...s.explosions, ...foamBursts] : s.explosions,
        pierceHoles,
      }
    })
  },

  updateTracers: (dt, now) => {
    const state = get()
    if (state.tracers.length === 0) return

    const remaining: TracerData[] = []

    for (const tracer of state.tracers) {
      const nextDist = tracer.distance + COMBAT.tracerSpeed * dt
      if (nextDist > tracer.maxDistance) continue

      if (tracer.lethal) {
        const hit = tracerSegmentHit(
          tracer.origin,
          tracer.direction,
          tracer.distance,
          nextDist,
          get().plates,
        )
        if (hit) {
          get().hitPlate(hit.plateId, hit.point)
          continue
        }
      }

      remaining.push({ ...tracer, distance: nextDist })
    }

    set({ tracers: remaining.filter((t) => now - t.born < 2000) })
  },

  hitPlate: (plateId, hitPos) => {
    const plate = get().plates.find((p) => p.id === plateId)
    if (!plate) return

    clearLivePlatePosition(plateId)
    const nextPlates = get().plates.filter((p) => p.id !== plateId)
    const explosion = createExplosion(hitPos, plate.color)
    const score = get().score + COMBAT.pointsPerPlate
    const cleared = nextPlates.length === 0

    set({
      plates: nextPlates,
      explosions: [...get().explosions, explosion],
      score,
      sectorCleared: cleared,
    })
  },

  updateExplosions: (dt, now) => {
    const explosions = get().explosions
    if (explosions.length === 0) return

    const next: ExplosionData[] = []
    for (const boom of explosions) {
      const fragments = boom.fragments
        .map((f) => {
          const age = (now - f.born) / 1000
          if (age > 0.85) return null
          return {
            ...f,
            position: [
              f.position[0] + f.velocity[0] * dt,
              f.position[1] + f.velocity[1] * dt,
              f.position[2] + f.velocity[2] * dt,
            ] as [number, number, number],
            velocity: [
              f.velocity[0] * 0.98,
              f.velocity[1] - 9.8 * dt * 0.35,
              f.velocity[2] * 0.98,
            ] as [number, number, number],
          }
        })
        .filter(Boolean) as Fragment[]

      if (fragments.length > 0) next.push({ ...boom, fragments })
    }

    set({ explosions: next })
  },

  revealPlates: (now) => {
    const plates = get().plates
    let changed = false
    const next = plates.map((p) => {
      if (!p.visible && now >= p.appearAt) {
        changed = true
        return { ...p, visible: true }
      }
      return p
    })
    if (changed) set({ plates: next })
  },

  resetRound: () => {
    clearAllLivePlates()
    const round = get().round + 1
    set({
      plates: createPlates(round),
      tracers: [],
      explosions: [],
      pierceHoles: [],
      sectorCleared: false,
      round,
      input: { ...initialInput },
    })
  },
}))
