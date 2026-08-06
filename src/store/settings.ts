import { create } from 'zustand'

const STORAGE_KEY = 'shooter.controls.v1'

/** Multiplier bounds shared by the UI sliders and the clamping below. */
export const SETTINGS_RANGE = {
  min: 0.3,
  max: 2.5,
  step: 0.05,
} as const

export type ControlSettings = {
  /** Scales locomotion speed (movement stick / WASD). */
  moveSpeed: number
  /** Scales look sensitivity (look stick / mouse). */
  lookSpeed: number
}

const defaults: ControlSettings = {
  moveSpeed: 1,
  lookSpeed: 1,
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(SETTINGS_RANGE.max, Math.max(SETTINGS_RANGE.min, value))
}

function load(): ControlSettings {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<ControlSettings>
    return {
      moveSpeed: clamp(parsed.moveSpeed ?? defaults.moveSpeed),
      lookSpeed: clamp(parsed.lookSpeed ?? defaults.lookSpeed),
    }
  } catch {
    return defaults
  }
}

function persist(settings: ControlSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private mode / blocked storage: settings just stay session-only.
  }
}

type SettingsState = ControlSettings & {
  open: boolean
  setOpen: (open: boolean) => void
  setMoveSpeed: (value: number) => void
  setLookSpeed: (value: number) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...load(),
  open: false,

  setOpen: (open) => set({ open }),

  setMoveSpeed: (value) => {
    const moveSpeed = clamp(value)
    set({ moveSpeed })
    persist({ moveSpeed, lookSpeed: get().lookSpeed })
  },

  setLookSpeed: (value) => {
    const lookSpeed = clamp(value)
    set({ lookSpeed })
    persist({ moveSpeed: get().moveSpeed, lookSpeed })
  },

  reset: () => {
    set({ ...defaults })
    persist(defaults)
  },
}))
