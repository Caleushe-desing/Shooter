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
  /** 0–1 mix levels for the procedural soundtrack and effects. */
  musicVolume: number
  sfxVolume: number
}

const defaults: ControlSettings = {
  moveSpeed: 1,
  lookSpeed: 1,
  musicVolume: 0.5,
  sfxVolume: 0.75,
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(SETTINGS_RANGE.max, Math.max(SETTINGS_RANGE.min, value))
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0.5
  return Math.min(1, Math.max(0, value))
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
      musicVolume: clampVolume(parsed.musicVolume ?? defaults.musicVolume),
      sfxVolume: clampVolume(parsed.sfxVolume ?? defaults.sfxVolume),
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
  setMusicVolume: (value: number) => void
  setSfxVolume: (value: number) => void
  reset: () => void
}

function snapshot(state: SettingsState): ControlSettings {
  return {
    moveSpeed: state.moveSpeed,
    lookSpeed: state.lookSpeed,
    musicVolume: state.musicVolume,
    sfxVolume: state.sfxVolume,
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...load(),
  open: false,

  setOpen: (open) => set({ open }),

  setMoveSpeed: (value) => {
    set({ moveSpeed: clamp(value) })
    persist(snapshot(get()))
  },

  setLookSpeed: (value) => {
    set({ lookSpeed: clamp(value) })
    persist(snapshot(get()))
  },

  setMusicVolume: (value) => {
    set({ musicVolume: clampVolume(value) })
    persist(snapshot(get()))
  },

  setSfxVolume: (value) => {
    set({ sfxVolume: clampVolume(value) })
    persist(snapshot(get()))
  },

  reset: () => {
    set({ ...defaults })
    persist(defaults)
  },
}))
