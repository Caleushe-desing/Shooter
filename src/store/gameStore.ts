import { create } from 'zustand'
import {
  PLAYER,
  CAMERA,
  WEAPON_AMMO,
  PICKUPS,
  STAMINA,
  ENEMY,
  type CameraMode,
  type GameStatus,
} from '../constants'
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
  runId: number
  cameraMode: CameraMode
  /** Bird's-eye camera height (meters). User-adjustable zoom. */
  topCamHeight: number

  status: GameStatus
  score: number
  kills: number
  ammo: number
  ammoMax: number
  /** 0..1 sprint stamina. */
  stamina: number
  /** True while refilling — sprint blocked until 100%. */
  staminaRecovering: boolean
  /** Effective sprint this frame (after stamina rules). */
  isSprinting: boolean
  /** Alive Mixamo hunters currently on the map. */
  enemyCount: number
  /** Current hunter wave (1-based). */
  wave: number

  setMove: (x: number, z: number) => void
  setEnemyCount: (n: number) => void
  setWave: (n: number) => void
  setSprint: (on: boolean) => void
  toggleSprint: () => void
  /**
   * Drain while sprinting, refill while walking/idle.
   * Returns whether the player is effectively sprinting this frame.
   */
  tickStamina: (dt: number, wantsSprint: boolean, moving: boolean) => boolean
  requestJump: () => void
  consumeJump: () => boolean
  requestFire: () => void
  consumeFire: () => boolean
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }

  setPlayerPos: (x: number, y: number, z: number) => void
  /** Spend one round; returns false if empty / not playing. */
  tryFireAmmo: () => boolean
  collectAmmo: () => void
  registerKill: () => void
  registerWaveClear: (wave: number) => void
  setLost: () => void
  setWon: () => void
  restartRun: () => void
  setCameraMode: (mode: CameraMode) => void
  toggleCameraMode: () => void
  /** Positive delta = zoom out (higher cam). */
  adjustTopZoom: (deltaMeters: number) => void
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
  runId: 1,
  cameraMode: 'third',
  topCamHeight: CAMERA.topHeight,

  status: 'playing',
  score: 0,
  kills: 0,
  ammo: WEAPON_AMMO.start,
  ammoMax: WEAPON_AMMO.max,
  stamina: 1,
  staminaRecovering: false,
  isSprinting: false,
  enemyCount: 0,
  wave: 1,

  setMove: (x, z) => set((s) => ({ input: { ...s.input, moveX: x, moveZ: z } })),
  setEnemyCount: (n) => {
    if (get().enemyCount !== n) set({ enemyCount: n })
  },
  setWave: (n) => {
    if (get().wave !== n) set({ wave: n })
  },
  setSprint: (on) => set((s) => ({ input: { ...s.input, sprint: on } })),
  toggleSprint: () =>
    set((s) => {
      if (!s.input.sprint && s.staminaRecovering) return s
      return { input: { ...s.input, sprint: !s.input.sprint } }
    }),

  tickStamina: (dt, wantsSprint, moving) => {
    const s = get()
    if (s.status !== 'playing') {
      if (s.isSprinting) set({ isSprinting: false })
      return false
    }

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

  collectAmmo: () => {
    const s = get()
    if (s.status !== 'playing') return
    set({
      ammo: Math.min(s.ammoMax, s.ammo + PICKUPS.ammoPerBox),
    })
  },

  registerKill: () => {
    const s = get()
    if (s.status !== 'playing') return
    set({
      kills: s.kills + 1,
      score: s.score + ENEMY.killScore,
    })
  },

  registerWaveClear: (wave) => {
    const s = get()
    if (s.status !== 'playing') return
    set({ score: s.score + ENEMY.waveClearScore * wave })
  },

  setLost: () => {
    if (get().status !== 'playing') return
    set({ status: 'lost' })
  },

  setWon: () => {
    if (get().status !== 'playing') return
    set({ status: 'won' })
  },

  restartRun: () => {
    clearEnemies()
    set({
      status: 'playing',
      score: 0,
      kills: 0,
      ammo: WEAPON_AMMO.start,
      fireQueued: 0,
      jumpQueued: false,
      input: { moveX: 0, moveZ: 0, sprint: false },
      stamina: 1,
      staminaRecovering: false,
      isSprinting: false,
      enemyCount: 0,
      wave: 1,
      playerX: PLAYER.spawn.x,
      playerY: 0,
      playerZ: PLAYER.spawn.z,
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
