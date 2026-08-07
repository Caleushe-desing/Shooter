import { create } from 'zustand'

type InputState = {
  moveX: number
  moveZ: number
  sprint: boolean
}

type GameState = {
  input: InputState
  crouched: boolean
  lookDx: number
  lookDy: number
  setMove: (x: number, z: number) => void
  setSprint: (on: boolean) => void
  toggleCrouch: () => void
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
}

export const useGameStore = create<GameState>((set, get) => ({
  input: { moveX: 0, moveZ: 0, sprint: false },
  crouched: false,
  lookDx: 0,
  lookDy: 0,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  toggleCrouch: () =>
    set((s) => ({
      crouched: !s.crouched,
      input: { ...s.input, sprint: false },
    })),

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
