import { create } from 'zustand'

type InputState = {
  moveX: number
  moveZ: number
  sprint: boolean
}

type GameState = {
  input: InputState
  /** One-shot jump request (Space / jump button). */
  jumpQueued: boolean
  /** One-shot fire requests (can stack briefly). */
  fireQueued: number
  lookDx: number
  lookDy: number
  setMove: (x: number, z: number) => void
  setSprint: (on: boolean) => void
  toggleSprint: () => void
  requestJump: () => void
  consumeJump: () => boolean
  requestFire: () => void
  consumeFire: () => boolean
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
}

export const useGameStore = create<GameState>((set, get) => ({
  input: { moveX: 0, moveZ: 0, sprint: false },
  jumpQueued: false,
  fireQueued: 0,
  lookDx: 0,
  lookDy: 0,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  toggleSprint: () =>
    set((s) => ({ input: { ...s.input, sprint: !s.input.sprint } })),

  requestJump: () => set({ jumpQueued: true }),
  consumeJump: () => {
    if (!get().jumpQueued) return false
    set({ jumpQueued: false })
    return true
  },

  requestFire: () => set((s) => ({ fireQueued: s.fireQueued + 1 })),
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
}))
