import { create } from 'zustand'

type InputState = {
  moveX: number
  moveZ: number
  sprint: boolean
}

type AvatarStatus = 'loading' | 'ready' | 'error'

type GameState = {
  input: InputState
  crouched: boolean
  avatarStatus: AvatarStatus
  lookDx: number
  lookDy: number
  setMove: (x: number, z: number) => void
  setSprint: (on: boolean) => void
  toggleCrouch: () => void
  setAvatarStatus: (status: AvatarStatus) => void
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
}

export const useGameStore = create<GameState>((set, get) => ({
  input: { moveX: 0, moveZ: 0, sprint: false },
  crouched: false,
  avatarStatus: 'loading',
  lookDx: 0,
  lookDy: 0,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  toggleCrouch: () =>
    set((s) => ({
      crouched: !s.crouched,
      input: { ...s.input, sprint: s.crouched ? s.input.sprint : false },
    })),
  setAvatarStatus: (avatarStatus) => set({ avatarStatus }),

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
