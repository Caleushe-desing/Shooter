import { create } from 'zustand'
import * as THREE from 'three'
import { COLORS, COMBAT } from '../constants'
import { getLivePlatePosition, clearAllLivePlates, clearLivePlatePosition } from './platePositions'

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
  sectorCleared: boolean
  round: number
  input: InputState
  recoilNonce: number
  setMove: (x: number, z: number) => void
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
  queueFire: () => void
  consumeFire: () => boolean
  spawnTracer: (origin: THREE.Vector3, direction: THREE.Vector3) => void
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

  spawnTracer: (origin, direction) => {
    const dir = direction.clone().normalize()
    set((s) => ({
      tracers: [
        ...s.tracers,
        {
          id: uid('tracer'),
          origin: [origin.x, origin.y, origin.z],
          direction: [dir.x, dir.y, dir.z],
          born: performance.now(),
          distance: 0,
        },
      ],
    }))
  },

  updateTracers: (dt, now) => {
    const state = get()
    if (state.tracers.length === 0) return

    const remaining: TracerData[] = []
    const hitRadius = COMBAT.plateRadius + 0.15

    for (const tracer of state.tracers) {
      const nextDist = tracer.distance + COMBAT.tracerSpeed * dt
      if (nextDist > COMBAT.tracerMaxDistance) continue

      const ox = tracer.origin[0]
      const oy = tracer.origin[1]
      const oz = tracer.origin[2]
      const dx = tracer.direction[0]
      const dy = tracer.direction[1]
      const dz = tracer.direction[2]

      // Sample along the segment this frame for more reliable hits.
      const steps = 4
      let hit = false
      for (let s = 1; s <= steps; s++) {
        const t = tracer.distance + ((nextDist - tracer.distance) * s) / steps
        const px = ox + dx * t
        const py = oy + dy * t
        const pz = oz + dz * t

        for (const plate of get().plates) {
          if (!plate.visible) continue
          const live = getLivePlatePosition(plate.id) ?? plate.position
          const [qx, qy, qz] = live
          const dist = Math.hypot(px - qx, py - qy, pz - qz)
          if (dist <= hitRadius) {
            get().hitPlate(plate.id, new THREE.Vector3(qx, qy, qz))
            hit = true
            break
          }
        }
        if (hit) break
      }

      if (!hit) {
        remaining.push({ ...tracer, distance: nextDist })
      }
    }

    // Cull very old tracers just in case
    const filtered = remaining.filter((t) => now - t.born < 2000)
    if (filtered.length !== state.tracers.length) {
      set({ tracers: filtered })
    } else {
      set({ tracers: filtered })
    }
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
      sectorCleared: false,
      round,
      input: { ...initialInput },
    })
  },
}))
