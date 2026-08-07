import { create } from 'zustand'
import {
  PLAYER,
  WEAPON_AMMO,
  PICKUPS,
  type CameraMode,
  type GameStatus,
} from '../constants'
import { ORB_SPAWNS } from '../map/pickupsLayout'
import { clearZombies } from '../combat/zombies'

type InputState = {
  moveX: number
  moveZ: number
  sprint: boolean
}

type GameState = {
  input: InputState
  jumpQueued: boolean
  fireQueued: number
  shotId: number
  lookDx: number
  lookDy: number

  playerX: number
  playerY: number
  playerZ: number
  runId: number
  cameraMode: CameraMode

  status: GameStatus
  score: number
  orbsRemaining: number
  orbsTotal: number
  ammo: number
  ammoMax: number

  setMove: (x: number, z: number) => void
  setSprint: (on: boolean) => void
  toggleSprint: () => void
  requestJump: () => void
  consumeJump: () => boolean
  requestFire: () => void
  consumeFire: () => boolean
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }

  setPlayerPos: (x: number, y: number, z: number) => void
  /** Spend one round; returns false if empty / not playing. */
  tryFireAmmo: () => boolean
  collectOrb: () => void
  collectAmmo: () => void
  setLost: () => void
  restartRun: () => void
  setCameraMode: (mode: CameraMode) => void
  toggleCameraMode: () => void
}

const totalOrbs = ORB_SPAWNS.length

export const useGameStore = create<GameState>((set, get) => ({
  input: { moveX: 0, moveZ: 0, sprint: false },
  jumpQueued: false,
  fireQueued: 0,
  shotId: 0,
  lookDx: 0,
  lookDy: 0,

  playerX: PLAYER.spawn.x,
  playerY: 0,
  playerZ: PLAYER.spawn.z,
  runId: 1,
  cameraMode: 'top',

  status: 'playing',
  score: 0,
  orbsRemaining: totalOrbs,
  orbsTotal: totalOrbs,
  ammo: WEAPON_AMMO.start,
  ammoMax: WEAPON_AMMO.max,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  toggleSprint: () =>
    set((s) => ({ input: { ...s.input, sprint: !s.input.sprint } })),

  requestJump: () => {
    if (get().status !== 'playing') return
    set({ jumpQueued: true })
  },
  consumeJump: () => {
    if (!get().jumpQueued) return false
    set({ jumpQueued: false })
    return true
  },

  requestFire: () => {
    if (get().status !== 'playing') return
    set((s) => ({ fireQueued: s.fireQueued + 1, shotId: s.shotId + 1 }))
  },
  consumeFire: () => {
    if (get().fireQueued <= 0) return false
    set((s) => ({ fireQueued: Math.max(0, s.fireQueued - 1) }))
    return true
  },

  addLook: (dx, dy) =>
    set((s) => ({
      lookDx: s.lookDx + dx,
      lookDy: s.lookDy + dy,
    })),

  consumeLook: () => {
    const { lookDx, lookDy } = get()
    if (lookDx !== 0 || lookDy !== 0) set({ lookDx: 0, lookDy: 0 })
    return { dx: lookDx, dy: lookDy }
  },

  setPlayerPos: (x, y, z) => set({ playerX: x, playerY: y, playerZ: z }),

  tryFireAmmo: () => {
    const s = get()
    if (s.status !== 'playing' || s.ammo <= 0) return false
    set({ ammo: s.ammo - 1 })
    return true
  },

  collectOrb: () => {
    const s = get()
    if (s.status !== 'playing' || s.orbsRemaining <= 0) return
    const orbsRemaining = s.orbsRemaining - 1
    const score = s.score + PICKUPS.orbPoints
    set({
      orbsRemaining,
      score,
      status: orbsRemaining <= 0 ? 'won' : 'playing',
    })
  },

  collectAmmo: () => {
    const s = get()
    if (s.status !== 'playing') return
    set({
      ammo: Math.min(s.ammoMax, s.ammo + PICKUPS.ammoPerBox),
    })
  },

  setLost: () => {
    if (get().status !== 'playing') return
    set({ status: 'lost' })
  },

  restartRun: () => {
    clearZombies()
    set({
      status: 'playing',
      score: 0,
      orbsRemaining: totalOrbs,
      orbsTotal: totalOrbs,
      ammo: WEAPON_AMMO.start,
      fireQueued: 0,
      jumpQueued: false,
      input: { moveX: 0, moveZ: 0, sprint: false },
      playerX: PLAYER.spawn.x,
      playerY: 0,
      playerZ: PLAYER.spawn.z,
      runId: get().runId + 1,
    })
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleCameraMode: () =>
    set((s) => ({
      cameraMode:
        s.cameraMode === 'third' ? 'top' : s.cameraMode === 'top' ? 'first' : 'third',
    })),
}))
