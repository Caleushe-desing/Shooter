import { create } from 'zustand'
import { COMBAT, PLAYER } from '../constants'
import { clearEnemies } from '../combat/enemies'

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
  health: number
  alive: boolean
  kills: number
  /** Bumped on restart so systems can reset timers. */
  runId: number

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
  damagePlayer: (amount: number) => void
  registerKill: () => void
  restartRun: () => void
}

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
  health: COMBAT.maxHealth,
  alive: true,
  kills: 0,
  runId: 1,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  toggleSprint: () =>
    set((s) => ({ input: { ...s.input, sprint: !s.input.sprint } })),

  requestJump: () => {
    if (!get().alive) return
    set({ jumpQueued: true })
  },
  consumeJump: () => {
    if (!get().jumpQueued) return false
    set({ jumpQueued: false })
    return true
  },

  requestFire: () => {
    if (!get().alive) return
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

  damagePlayer: (amount) => {
    const s = get()
    if (!s.alive) return
    const health = Math.max(0, s.health - amount)
    set({ health, alive: health > 0 })
  },

  registerKill: () => set((s) => ({ kills: s.kills + 1 })),

  restartRun: () => {
    clearEnemies()
    set({
      health: COMBAT.maxHealth,
      alive: true,
      kills: 0,
      fireQueued: 0,
      jumpQueued: false,
      input: { moveX: 0, moveZ: 0, sprint: false },
      playerX: PLAYER.spawn.x,
      playerY: 0,
      playerZ: PLAYER.spawn.z,
      runId: get().runId + 1,
    })
  },
}))
