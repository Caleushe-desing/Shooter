import { create } from 'zustand'
import * as THREE from 'three'
import { COLORS, COMBAT, PLAYER, type Stance } from '../constants'
import { NEEDS, MINERALS } from '../world/catalog'
import { findCratePierces } from './combat'
import { findClosestFaunaHit, findClosestWorldPropHit } from './faunaRuntime'
import { useWorldStore } from './worldStore'
import { audio } from '../audio/audio'

export type TracerData = {
  id: string
  origin: [number, number, number]
  direction: [number, number, number]
  born: number
  distance: number
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

export type PierceHole = {
  id: string
  position: [number, number, number]
  normal: [number, number, number]
  spin: number
  scale: number
}

type InputState = {
  moveX: number
  moveZ: number
  lookDx: number
  lookDy: number
  fireQueued: boolean
  sprint: boolean
  slow: boolean
  jumpQueued: boolean
}

type GameState = {
  tracers: TracerData[]
  explosions: ExplosionData[]
  pierceHoles: PierceHole[]
  health: number
  hunger: number
  thirst: number
  hygiene: number
  caught: boolean
  sectorCleared: boolean
  scoped: boolean
  stance: Stance
  airborne: boolean
  startedAt: number
  input: InputState
  recoilNonce: number
  damageNonce: number
  setMove: (x: number, z: number) => void
  setSprint: (on: boolean) => void
  setSlow: (on: boolean) => void
  setStance: (stance: Stance) => void
  toggleCrouch: () => void
  toggleProne: () => void
  queueJump: () => void
  consumeJump: () => boolean
  setAirborne: (on: boolean) => void
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
  queueFire: () => void
  consumeFire: () => boolean
  toggleScope: () => void
  setScoped: (scoped: boolean) => void
  spawnTracer: (
    aimOrigin: THREE.Vector3,
    aimDir: THREE.Vector3,
    visualOrigin?: THREE.Vector3,
  ) => void
  updateTracers: (dt: number, now: number) => void
  damagePlayer: (amount: number) => void
  applyNeeds: (delta: { hunger?: number; thirst?: number; hygiene?: number }) => void
  tickNeeds: (dt: number) => void
  updateExplosions: (dt: number, now: number) => void
  pruneCorpses: (now: number) => void
  resetRound: () => void
  restartGame: () => void
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

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
  sprint: false,
  slow: false,
  jumpQueued: false,
}

const clampNeed = (v: number) => Math.max(0, Math.min(NEEDS.max, v))

export const useGameStore = create<GameState>((set, get) => ({
  tracers: [],
  explosions: [],
  pierceHoles: [],
  health: PLAYER.maxHealth,
  hunger: 78,
  thirst: 72,
  hygiene: 85,
  caught: false,
  sectorCleared: false,
  scoped: false,
  stance: 'stand',
  airborne: false,
  startedAt: performance.now(),
  input: { ...initialInput },
  recoilNonce: 0,
  damageNonce: 0,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),

  setSprint: (on) =>
    set((s) => ({
      input: { ...s.input, sprint: on },
      stance: on && s.stance !== 'stand' ? 'stand' : s.stance,
    })),

  setSlow: (on) => set((s) => ({ input: { ...s.input, slow: on } })),

  setStance: (stance) =>
    set((s) => ({
      stance,
      input: {
        ...s.input,
        sprint: stance === 'stand' ? s.input.sprint : false,
      },
    })),

  toggleCrouch: () => {
    const s = get()
    if (s.stance === 'crouch') set({ stance: 'stand' })
    else
      set({
        stance: 'crouch',
        input: { ...s.input, sprint: false },
      })
  },

  toggleProne: () => {
    const s = get()
    if (s.stance === 'prone') set({ stance: 'stand' })
    else
      set({
        stance: 'prone',
        input: { ...s.input, sprint: false },
      })
  },

  queueJump: () => set((s) => ({ input: { ...s.input, jumpQueued: true } })),

  consumeJump: () => {
    if (!get().input.jumpQueued) return false
    set((s) => ({ input: { ...s.input, jumpQueued: false } }))
    return true
  },

  setAirborne: (on) => {
    if (get().airborne === on) return
    set({ airborne: on })
  },

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
    set((s) => ({ input: { ...s.input, lookDx: 0, lookDy: 0 } }))
    return { dx: lookDx, dy: lookDy }
  },

  queueFire: () =>
    set((s) => ({
      input: { ...s.input, fireQueued: true },
      recoilNonce: s.recoilNonce + 1,
    })),

  consumeFire: () => {
    if (!get().input.fireQueued) return false
    set((s) => ({ input: { ...s.input, fireQueued: false } }))
    return true
  },

  toggleScope: () => {
    const scoped = !get().scoped
    audio.scopeToggle(scoped)
    set({ scoped })
  },

  setScoped: (scoped) => {
    if (get().scoped === scoped) return
    audio.scopeToggle(scoped)
    set({ scoped })
  },

  spawnTracer: (aimOrigin, aimDir, visualOrigin) => {
    const dir = aimDir.clone().normalize()
    const now = performance.now()

    const faunaHit = findClosestFaunaHit(aimOrigin, dir, COMBAT.tracerMaxDistance)
    const propHit = findClosestWorldPropHit(aimOrigin, dir, COMBAT.tracerMaxDistance)

    let shotRange: number = COMBAT.tracerMaxDistance
    if (faunaHit) shotRange = Math.min(shotRange, faunaHit.distance)
    if (propHit) shotRange = Math.min(shotRange, propHit.distance)

    const aimPoint = aimOrigin.clone().addScaledVector(dir, shotRange)

    if (faunaHit && faunaHit.distance <= shotRange + 1e-4) {
      useWorldStore.getState().damageFauna(faunaHit.id, 1)
    } else if (propHit && propHit.distance <= shotRange + 1e-4) {
      if (propHit.type === 'flora') useWorldStore.getState().damageFlora(propHit.id, 1)
      else useWorldStore.getState().damageMineral(propHit.id, 1)
    }

    audio.gunshot()

    const pierces = findCratePierces(aimOrigin, dir, shotRange)
    const bursts: ExplosionData[] = []
    const newHoles: PierceHole[] = []
    if (pierces.length > 0) audio.foamPierce()
    for (const p of pierces) {
      bursts.push(createFoamBurst(p.enter, p.enterNormal, dir))
      bursts.push(createFoamBurst(p.exit, p.exitNormal, dir.clone().negate()))
      newHoles.push(holeFrom(p.enter, p.enterNormal))
      newHoles.push(holeFrom(p.exit, p.exitNormal))
    }

    const start = visualOrigin?.clone() ?? aimOrigin.clone()
    const visualDir = aimPoint.clone().sub(start)
    const maxDistance = Math.max(visualDir.length(), 0.5)
    if (visualDir.lengthSq() < 1e-8) visualDir.copy(dir)
    else visualDir.normalize()

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
            maxDistance,
          },
        ],
        explosions: bursts.length ? [...s.explosions, ...bursts] : s.explosions,
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
      remaining.push({ ...tracer, distance: nextDist })
    }
    set({ tracers: remaining.filter((t) => now - t.born < 2000) })
  },

  damagePlayer: (amount) => {
    const state = get()
    if (state.caught) return
    const health = Math.max(0, state.health - amount)
    if (health <= 0) audio.caught()
    else if (amount > 0.5) audio.playerHurt()
    set({
      health,
      caught: health <= 0,
      scoped: health <= 0 ? false : state.scoped,
      damageNonce: state.damageNonce + 1,
    })
  },

  applyNeeds: (delta) => {
    set((s) => ({
      hunger: clampNeed(s.hunger + (delta.hunger ?? 0)),
      thirst: clampNeed(s.thirst + (delta.thirst ?? 0)),
      hygiene: clampNeed(s.hygiene + (delta.hygiene ?? 0)),
    }))
  },

  tickNeeds: (dt) => {
    const s = get()
    if (s.caught) return
    const hunger = clampNeed(s.hunger - NEEDS.hungerDecay * dt)
    const thirst = clampNeed(s.thirst - NEEDS.thirstDecay * dt)
    const hygiene = clampNeed(s.hygiene - NEEDS.hygieneDecay * dt)
    set({ hunger, thirst, hygiene })

    let dmg = 0
    if (hunger <= 0) dmg += NEEDS.starveDps * dt
    if (thirst <= 0) dmg += NEEDS.dehydrateDps * dt
    if (hygiene <= 8) dmg += 1.2 * dt
    if (dmg > 0) get().damagePlayer(dmg)
  },

  pruneCorpses: () => {},

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

  resetRound: () => get().restartGame(),

  restartGame: () => {
    // Soft world reset so the colonist can start gathering again.
    useWorldStore.setState({
      inventory: {
        madera: 6,
        bayas: 4,
        agua: 3,
        fibra: 4,
        piedra: 2,
      },
      equipped: {},
      inventoryOpen: false,
      buildMode: null,
      buildings: [],
      toast: null,
    })
    // Re-reveal only surface minerals; buried stay hidden until scan.
    const minerals = useWorldStore.getState().minerals.map((m) => ({
      ...m,
      alive: true,
      hp: MINERALS[m.kind].hp,
      revealed: !m.buried,
    }))
    useWorldStore.setState({ minerals })
    set({
      tracers: [],
      explosions: [],
      pierceHoles: [],
      health: PLAYER.maxHealth,
      hunger: 78,
      thirst: 72,
      hygiene: 85,
      caught: false,
      sectorCleared: false,
      scoped: false,
      stance: 'stand',
      airborne: false,
      startedAt: performance.now(),
      input: { ...initialInput },
    })
  },
}))
