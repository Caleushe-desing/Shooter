import { create } from 'zustand'
import {
  CAMERA,
  STAMINA,
  type CameraMode,
  type GameStatus,
} from '../constants'
import { generateProceduralMap, type ProceduralMap } from '../map/proceduralLayout'

type InputState = {
  moveX: number
  moveZ: number
  sprint: boolean
}

type GameState = {
  input: InputState
  jumpQueued: boolean
  lookDx: number
  lookDy: number

  playerX: number
  playerY: number
  playerZ: number
  runId: number
  cameraMode: CameraMode
  topCamHeight: number
  status: GameStatus

  stamina: number
  staminaRecovering: boolean
  isSprinting: boolean

  map: ProceduralMap

  setMove: (x: number, z: number) => void
  setSprint: (on: boolean) => void
  toggleSprint: () => void
  tickStamina: (dt: number, wantsSprint: boolean, moving: boolean) => boolean
  requestJump: () => void
  consumeJump: () => boolean
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
  setPlayerPos: (x: number, y: number, z: number) => void
  regenerateMap: () => void
  restartRun: () => void
  setCameraMode: (mode: CameraMode) => void
  toggleCameraMode: () => void
  adjustTopZoom: (deltaMeters: number) => void
}

function freshMap() {
  return generateProceduralMap((Math.random() * 0xffffffff) >>> 0)
}

const initialMap = freshMap()

export const useGameStore = create<GameState>((set, get) => ({
  input: { moveX: 0, moveZ: 0, sprint: false },
  jumpQueued: false,
  lookDx: 0,
  lookDy: 0,

  playerX: initialMap.spawn.x,
  playerY: 0,
  playerZ: initialMap.spawn.z,
  runId: 1,
  cameraMode: 'third',
  topCamHeight: CAMERA.topHeight,
  status: 'playing',

  stamina: 1,
  staminaRecovering: false,
  isSprinting: false,

  map: initialMap,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  toggleSprint: () =>
    set((s) => {
      if (!s.input.sprint && s.staminaRecovering) return s
      return { input: { ...s.input, sprint: !s.input.sprint } }
    }),

  tickStamina: (dt, wantsSprint, moving) => {
    const s = get()
    const rate = 1 / STAMINA.duration
    let stamina = s.stamina
    let recovering = s.staminaRecovering
    const isSprinting = wantsSprint && moving && stamina > 0 && !recovering

    if (isSprinting) {
      stamina = Math.max(0, stamina - dt * rate)
      if (stamina <= 0) {
        stamina = 0
        recovering = true
      }
    } else if (stamina < 1) {
      recovering = true
      stamina = Math.min(1, stamina + dt * rate)
      if (stamina >= 1) {
        stamina = 1
        recovering = false
      }
    } else {
      stamina = 1
      recovering = false
    }

    if (
      stamina !== s.stamina ||
      recovering !== s.staminaRecovering ||
      isSprinting !== s.isSprinting
    ) {
      set({ stamina, staminaRecovering: recovering, isSprinting })
    }
    return isSprinting
  },

  requestJump: () => set({ jumpQueued: true }),
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

  setPlayerPos: (x, y, z) => set({ playerX: x, playerY: y, playerZ: z }),

  regenerateMap: () => {
    const map = freshMap()
    set({
      map,
      playerX: map.spawn.x,
      playerY: 0,
      playerZ: map.spawn.z,
      runId: get().runId + 1,
    })
  },

  restartRun: () => {
    const map = freshMap()
    set({
      status: 'playing',
      input: { moveX: 0, moveZ: 0, sprint: false },
      stamina: 1,
      staminaRecovering: false,
      isSprinting: false,
      jumpQueued: false,
      map,
      playerX: map.spawn.x,
      playerY: 0,
      playerZ: map.spawn.z,
      cameraMode: 'third',
      runId: get().runId + 1,
    })
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleCameraMode: () =>
    set((s) => ({
      cameraMode:
        s.cameraMode === 'third' ? 'top' : s.cameraMode === 'top' ? 'first' : 'third',
    })),
  adjustTopZoom: (deltaMeters) => {
    const s = get()
    const next = Math.min(
      CAMERA.topHeightMax,
      Math.max(CAMERA.topHeightMin, s.topCamHeight + deltaMeters),
    )
    if (next !== s.topCamHeight) set({ topCamHeight: next })
  },
}))
