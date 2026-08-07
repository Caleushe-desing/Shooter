import { create } from 'zustand'

type InputState = {
  moveX: number
  moveZ: number
  sprint: boolean
}

type GameState = {
  input: InputState
  /** Normalized move dir when sprint was locked (input space). */
  sprintLockX: number
  sprintLockZ: number
  /** Shift/engage pressed while idle — lock on first movement. */
  sprintPending: boolean
  lookDx: number
  lookDy: number
  setMove: (x: number, z: number) => void
  /** true = engage/lock sprint; false = clear. Stays on until direction changes. */
  setSprint: (on: boolean) => void
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
}

/** Dot below this vs lock dir ≈ angle > ~41° → unlock sprint. */
const SPRINT_DIR_DOT_MIN = 0.75
const MOVE_EPS = 0.08

export const useGameStore = create<GameState>((set, get) => ({
  input: { moveX: 0, moveZ: 0, sprint: false },
  sprintLockX: 0,
  sprintLockZ: 0,
  sprintPending: false,
  lookDx: 0,
  lookDy: 0,

  setMove: (x, z) => {
    const s = get()
    let sprint = s.input.sprint
    let lockX = s.sprintLockX
    let lockZ = s.sprintLockZ
    let pending = s.sprintPending
    const mag = Math.hypot(x, z)

    // Engage was requested while standing still — lock when motion starts.
    if (pending && mag >= MOVE_EPS) {
      sprint = true
      lockX = x / mag
      lockZ = z / mag
      pending = false
    }

    if (sprint) {
      if (mag < MOVE_EPS) {
        sprint = false
        lockX = 0
        lockZ = 0
      } else {
        const nx = x / mag
        const nz = z / mag
        const lm = Math.hypot(lockX, lockZ)
        if (lm > 0.01) {
          const dot = nx * (lockX / lm) + nz * (lockZ / lm)
          if (dot < SPRINT_DIR_DOT_MIN) {
            sprint = false
            lockX = 0
            lockZ = 0
          }
        }
      }
    }

    set({
      input: { moveX: x, moveZ: z, sprint },
      sprintLockX: lockX,
      sprintLockZ: lockZ,
      sprintPending: pending,
    })
  },

  setSprint: (on) => {
    if (!on) {
      set((s) => ({
        input: { ...s.input, sprint: false },
        sprintLockX: 0,
        sprintLockZ: 0,
        sprintPending: false,
      }))
      return
    }

    const { moveX, moveZ } = get().input
    const mag = Math.hypot(moveX, moveZ)
    if (mag < MOVE_EPS) {
      // Will lock on the next non-zero setMove.
      set((s) => ({
        input: { ...s.input, sprint: false },
        sprintPending: true,
      }))
      return
    }

    set((s) => ({
      input: { ...s.input, sprint: true },
      sprintLockX: moveX / mag,
      sprintLockZ: moveZ / mag,
      sprintPending: false,
    }))
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
