import { create } from 'zustand'

export type Stance = 'stand' | 'crouch'

type InputState = {
  moveX: number
  moveZ: number
  sprint: boolean
}

type GameState = {
  input: InputState
  stance: Stance
  airborne: boolean
  jumpQueued: boolean
  lookDx: number
  lookDy: number
  setMove: (x: number, z: number) => void
  setSprint: (on: boolean) => void
  setStance: (stance: Stance) => void
  toggleCrouch: () => void
  setAirborne: (on: boolean) => void
  queueJump: () => void
  consumeJump: () => boolean
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
}

export const useGameStore = create<GameState>((set, get) => ({
  input: { moveX: 0, moveZ: 0, sprint: false },
  stance: 'stand',
  airborne: false,
  jumpQueued: false,
  lookDx: 0,
  lookDy: 0,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  setStance: (stance) => set({ stance }),
  toggleCrouch: () =>
    set((s) => ({
      stance: s.stance === 'crouch' ? 'stand' : 'crouch',
      // Standing up cancels sprint conflict; crouch clears sprint feel.
      input: { ...s.input, sprint: s.stance === 'crouch' ? s.input.sprint : false },
    })),
  setAirborne: (on) => set({ airborne: on }),
  queueJump: () => set({ jumpQueued: true }),
  consumeJump: () => {
    if (!get().jumpQueued) return false
    set({ jumpQueued: false })
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
