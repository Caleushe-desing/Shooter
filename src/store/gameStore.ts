import { create } from 'zustand'
import * as THREE from 'three'
import { BIRD, COLORS, COMBAT, ENEMY, PLAYER } from '../constants'
import { clearAllEnemyRuntimes, clearEnemyRuntime } from './enemyRuntime'
import { clearAllBirdRuntimes, clearBirdRuntime, getBirdRuntime } from './birdRuntime'
import { findClosestBirdHit, findClosestEnemyHit, findCratePierces } from './combat'
import { audio } from '../audio/audio'

/** A hostile human hunting the player. Motion lives in `enemyRuntime`. */
export type EnemyData = {
  id: string
  spawnAt: number
  startX: number
  startZ: number
  speed: number
  height: number
  skin: string
  shirt: string
  pants: string
  alive: boolean
  /** performance.now() of death, used to fade the corpse out. */
  diedAt: number
}

/** Bonus bird flushed out from behind a crate. Motion lives in `birdRuntime`. */
export type BirdData = {
  id: string
  color: string
  size: number
  alive: boolean
  /** performance.now() of death, used to clean up after the tumble. */
  diedAt: number
  bornAt: number
}

export type TracerData = {
  id: string
  origin: [number, number, number]
  direction: [number, number, number]
  born: number
  distance: number
  maxDistance: number
}

export type Fragment = {
  id: string
  position: [number, number, number]
  velocity: [number, number, number]
  color: string
  born: number
  size: number
  spin: [number, number, number]
}

export type ExplosionData = {
  id: string
  fragments: Fragment[]
}

/** Bullet hole punched through a styrofoam crate; persists for the round. */
export type PierceHole = {
  id: string
  position: [number, number, number]
  normal: [number, number, number]
  /** Random roll so holes don't look like identical stamps. */
  spin: number
  scale: number
}

type InputState = {
  moveX: number
  moveZ: number
  lookDx: number
  lookDy: number
  fireQueued: boolean
}

type GameState = {
  score: number
  enemies: EnemyData[]
  birds: BirdData[]
  tracers: TracerData[]
  explosions: ExplosionData[]
  pierceHoles: PierceHole[]
  health: number
  caught: boolean
  sectorCleared: boolean
  round: number
  input: InputState
  recoilNonce: number
  /** Bumped when the player takes damage so the HUD can flash. */
  damageNonce: number
  setMove: (x: number, z: number) => void
  addLook: (dx: number, dy: number) => void
  consumeLook: () => { dx: number; dy: number }
  queueFire: () => void
  consumeFire: () => boolean
  /**
   * Hitscan from aimOrigin/aimDir (screen-center / crosshair).
   * Visual tracer starts at visualOrigin (muzzle) and flies to the aim point.
   * Styrofoam crates are pierceable — never stop the shot.
   */
  spawnTracer: (
    aimOrigin: THREE.Vector3,
    aimDir: THREE.Vector3,
    visualOrigin?: THREE.Vector3,
  ) => void
  updateTracers: (dt: number, now: number) => void
  killEnemy: (enemyId: string, hitPos: THREE.Vector3, head: boolean) => void
  addBirds: (birds: BirdData[]) => void
  killBird: (birdId: string, hitPos: THREE.Vector3) => void
  removeBirds: (ids: string[]) => void
  damagePlayer: (amount: number) => void
  pruneCorpses: (now: number) => void
  updateExplosions: (dt: number, now: number) => void
  resetRound: () => void
  restartGame: () => void
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function createEnemies(round: number): EnemyData[] {
  const enemies: EnemyData[] = []
  const count = Math.min(ENEMY.baseCount + (round - 1) * ENEMY.perRound, ENEMY.maxCount)
  const now = performance.now()

  for (let i = 0; i < count; i++) {
    // Spread spawns around the arena edge so they close in from all sides.
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6 + round * 0.4
    const radius = ENEMY.spawnRingMin + Math.random() * (ENEMY.spawnRingMax - ENEMY.spawnRingMin)
    const speedBoost = (round - 1) * ENEMY.speedPerRound

    enemies.push({
      id: uid('enemy'),
      spawnAt: now + ENEMY.firstSpawnDelayMs + i * ENEMY.spawnIntervalMs,
      startX: Math.cos(angle) * radius,
      startZ: Math.sin(angle) * radius,
      speed: ENEMY.speedMin + Math.random() * (ENEMY.speedMax - ENEMY.speedMin) + speedBoost,
      height: 0.94 + Math.random() * 0.12,
      skin: pick(COLORS.enemySkins),
      shirt: pick(COLORS.enemyShirts),
      pants: pick(COLORS.enemyPants),
      alive: true,
      diedAt: 0,
    })
  }

  return enemies
}

function createBloodBurst(pos: THREE.Vector3, head: boolean): ExplosionData {
  const fragments: Fragment[] = []
  const count = head ? COMBAT.explosionFragments + 6 : COMBAT.explosionFragments
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 0.2,
      Math.random() * 2 - 1,
    ).normalize()
    const speed = 2.5 + Math.random() * 6
    fragments.push({
      id: uid('blood'),
      position: [pos.x, pos.y, pos.z],
      velocity: [dir.x * speed, dir.y * speed, dir.z * speed],
      color: Math.random() > 0.4 ? COLORS.blood : COLORS.bloodDark,
      born: performance.now(),
      size: 0.05 + Math.random() * 0.11,
      spin: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ],
    })
  }
  return { id: uid('boom'), fragments }
}

/** Feather puff when a bird is shot out of the air. */
function createFeatherBurst(pos: THREE.Vector3): ExplosionData {
  const fragments: Fragment[] = []
  for (let i = 0; i < 10; i++) {
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 1.4,
      Math.random() * 2 - 1,
    ).normalize()
    const speed = 1 + Math.random() * 2.6
    fragments.push({
      id: uid('feather'),
      position: [pos.x, pos.y, pos.z],
      velocity: [dir.x * speed, dir.y * speed, dir.z * speed],
      color: Math.random() > 0.4 ? COLORS.feather : COLORS.featherDark,
      born: performance.now(),
      size: 0.05 + Math.random() * 0.07,
      spin: [
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
      ],
    })
  }
  return { id: uid('boom'), fragments }
}

/** Light foam chip burst when a round punches through plumavit. */
function createFoamBurst(
  pos: THREE.Vector3,
  outward: THREE.Vector3,
  shotDir: THREE.Vector3,
): ExplosionData {
  const fragments: Fragment[] = []
  const base = outward.clone().normalize()
  for (let i = 0; i < COMBAT.pierceChips; i++) {
    const dir = new THREE.Vector3(
      base.x + (Math.random() - 0.5) * 1.4 + shotDir.x * 0.35,
      base.y + (Math.random() - 0.5) * 1.4 + shotDir.y * 0.35,
      base.z + (Math.random() - 0.5) * 1.4 + shotDir.z * 0.35,
    ).normalize()
    const speed = 1.2 + Math.random() * 3.5
    fragments.push({
      id: uid('foam'),
      position: [pos.x, pos.y, pos.z],
      velocity: [dir.x * speed, dir.y * speed + 0.6, dir.z * speed],
      color: Math.random() > 0.35 ? COLORS.foamChip : COLORS.woodDark,
      born: performance.now(),
      size: 0.04 + Math.random() * 0.09,
      spin: [
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
      ],
    })
  }
  return { id: uid('pierce'), fragments }
}

function holeFrom(pos: THREE.Vector3, normal: THREE.Vector3): PierceHole {
  const n = normal.lengthSq() > 0 ? normal.clone().normalize() : new THREE.Vector3(0, 0, 1)
  // Crate bodies are inset 0.01 from the collision box, so pull the decal
  // slightly inward to sit just proud of the visible foam face.
  const p = pos.clone().addScaledVector(n, -0.008)
  return {
    id: uid('hole'),
    position: [p.x, p.y, p.z],
    normal: [n.x, n.y, n.z],
    spin: Math.random() * Math.PI * 2,
    scale: 0.82 + Math.random() * 0.5,
  }
}

const initialInput: InputState = {
  moveX: 0,
  moveZ: 0,
  lookDx: 0,
  lookDy: 0,
  fireQueued: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  enemies: createEnemies(1),
  birds: [],
  tracers: [],
  explosions: [],
  pierceHoles: [],
  health: PLAYER.maxHealth,
  caught: false,
  sectorCleared: false,
  round: 1,
  input: { ...initialInput },
  recoilNonce: 0,
  damageNonce: 0,

  setMove: (x, z) =>
    set((s) => ({
      input: { ...s.input, moveX: x, moveZ: z },
    })),

  addLook: (dx, dy) =>
    set((s) => ({
      input: {
        ...s.input,
        lookDx: s.input.lookDx + dx,
        lookDy: s.input.lookDy + dy,
      },
    })),

  consumeLook: () => {
    const { lookDx, lookDy } = get().input
    if (lookDx === 0 && lookDy === 0) return { dx: 0, dy: 0 }
    set((s) => ({
      input: { ...s.input, lookDx: 0, lookDy: 0 },
    }))
    return { dx: lookDx, dy: lookDy }
  },

  queueFire: () =>
    set((s) => ({
      input: { ...s.input, fireQueued: true },
      recoilNonce: s.recoilNonce + 1,
    })),

  consumeFire: () => {
    if (!get().input.fireQueued) return false
    set((s) => ({
      input: { ...s.input, fireQueued: false },
    }))
    return true
  },

  spawnTracer: (aimOrigin, aimDir, visualOrigin) => {
    const dir = aimDir.clone().normalize()
    const now = performance.now()

    // Precise hitscan exactly through the crosshair (camera center ray).
    // Crates are styrofoam — they never occlude this ray.
    const enemyHit = findClosestEnemyHit(aimOrigin, dir, get().enemies)
    const birdHit = findClosestBirdHit(aimOrigin, dir, get().birds)

    // Whichever target the crosshair reaches first takes the round.
    const birdIsCloser =
      birdHit != null && (enemyHit == null || birdHit.distance < enemyHit.distance)
    const shotRange = birdIsCloser
      ? birdHit.distance
      : (enemyHit?.distance ?? COMBAT.tracerMaxDistance)

    // Aim point always lies on the crosshair ray (hit or max range).
    const aimPoint = aimOrigin.clone().addScaledVector(dir, shotRange)

    if (birdIsCloser) {
      get().killBird(birdHit.birdId, birdHit.point)
    } else if (enemyHit) {
      get().killEnemy(enemyHit.enemyId, enemyHit.point, enemyHit.head)
    }

    // Punch through any plumavit crates along the shot (entry + exit).
    audio.gunshot()

    const pierces = findCratePierces(aimOrigin, dir, shotRange)
    const bursts: ExplosionData[] = []
    const newHoles: PierceHole[] = []
    if (pierces.length > 0) audio.foamPierce()
    for (const p of pierces) {
      bursts.push(createFoamBurst(p.enter, p.enterNormal, dir))
      bursts.push(createFoamBurst(p.exit, p.exitNormal, dir.clone().negate()))
      newHoles.push(holeFrom(p.enter, p.enterNormal))
      newHoles.push(holeFrom(p.exit, p.exitNormal))
    }

    // Visual streak: muzzle → aim point (flies straight through foam crates).
    const start = visualOrigin?.clone() ?? aimOrigin.clone()
    const visualDir = aimPoint.clone().sub(start)
    const maxDistance = Math.max(visualDir.length(), 0.5)
    if (visualDir.lengthSq() < 1e-8) {
      visualDir.copy(dir)
    } else {
      visualDir.normalize()
    }

    set((s) => {
      const pierceHoles = [...s.pierceHoles, ...newHoles]
      const overflow = pierceHoles.length - COMBAT.pierceHoleMax
      if (overflow > 0) pierceHoles.splice(0, overflow)

      return {
        tracers: [
          ...s.tracers,
          {
            id: uid('tracer'),
            origin: [start.x, start.y, start.z],
            direction: [visualDir.x, visualDir.y, visualDir.z],
            born: now,
            distance: 0,
            maxDistance,
          },
        ],
        explosions: bursts.length ? [...s.explosions, ...bursts] : s.explosions,
        pierceHoles,
      }
    })
  },

  updateTracers: (dt, now) => {
    const state = get()
    if (state.tracers.length === 0) return

    const remaining: TracerData[] = []
    for (const tracer of state.tracers) {
      const nextDist = tracer.distance + COMBAT.tracerSpeed * dt
      if (nextDist > tracer.maxDistance) continue
      remaining.push({ ...tracer, distance: nextDist })
    }

    set({ tracers: remaining.filter((t) => now - t.born < 2000) })
  },

  killEnemy: (enemyId, hitPos, head) => {
    const enemy = get().enemies.find((e) => e.id === enemyId)
    if (!enemy || !enemy.alive) return

    const now = performance.now()
    const nextEnemies = get().enemies.map((e) =>
      e.id === enemyId ? { ...e, alive: false, diedAt: now } : e,
    )
    const points = ENEMY.pointsPerKill + (head ? ENEMY.headshotBonus : 0)
    const cleared = nextEnemies.every((e) => !e.alive)

    audio.enemyDown(head)
    if (cleared) audio.waveCleared()

    set({
      enemies: nextEnemies,
      explosions: [...get().explosions, createBloodBurst(hitPos, head)],
      score: get().score + points,
      sectorCleared: cleared && !get().caught,
    })
  },

  addBirds: (birds) => {
    if (birds.length === 0) return
    audio.birdFlush()
    set((s) => ({ birds: [...s.birds, ...birds] }))
  },

  killBird: (birdId, hitPos) => {
    const bird = get().birds.find((b) => b.id === birdId)
    if (!bird || !bird.alive) return

    const now = performance.now()
    const rt = getBirdRuntime(birdId)
    if (rt) {
      // Hand the body over to the falling branch of the flight sim.
      rt.deadAt = now
      rt.vy = Math.min(rt.vy, -0.5)
    }

    audio.birdHit()
    set((s) => ({
      birds: s.birds.map((b) =>
        b.id === birdId ? { ...b, alive: false, diedAt: now } : b,
      ),
      explosions: [...s.explosions, createFeatherBurst(hitPos)],
      score: s.score + BIRD.points,
    }))
  },

  removeBirds: (ids) => {
    if (ids.length === 0) return
    for (const id of ids) clearBirdRuntime(id)
    set((s) => ({ birds: s.birds.filter((b) => !ids.includes(b.id)) }))
  },

  damagePlayer: (amount) => {
    const state = get()
    if (state.caught || state.sectorCleared) return

    const health = Math.max(0, state.health - amount)
    if (health <= 0) audio.caught()
    else audio.playerHurt()

    set({
      health,
      caught: health <= 0,
      damageNonce: state.damageNonce + 1,
    })
  },

  pruneCorpses: (now) => {
    const enemies = get().enemies
    const next = enemies.filter((e) => e.alive || now - e.diedAt < ENEMY.corpseFadeMs)
    if (next.length === enemies.length) return
    for (const e of enemies) {
      if (!next.includes(e)) clearEnemyRuntime(e.id)
    }
    set({ enemies: next })
  },

  updateExplosions: (dt, now) => {
    const explosions = get().explosions
    if (explosions.length === 0) return

    const next: ExplosionData[] = []
    for (const boom of explosions) {
      const fragments = boom.fragments
        .map((f) => {
          const age = (now - f.born) / 1000
          if (age > 0.85) return null
          return {
            ...f,
            position: [
              f.position[0] + f.velocity[0] * dt,
              f.position[1] + f.velocity[1] * dt,
              f.position[2] + f.velocity[2] * dt,
            ] as [number, number, number],
            velocity: [
              f.velocity[0] * 0.98,
              f.velocity[1] - 9.8 * dt * 0.35,
              f.velocity[2] * 0.98,
            ] as [number, number, number],
          }
        })
        .filter(Boolean) as Fragment[]

      if (fragments.length > 0) next.push({ ...boom, fragments })
    }

    set({ explosions: next })
  },

  resetRound: () => {
    clearAllEnemyRuntimes()
    clearAllBirdRuntimes()
    const round = get().round + 1
    set({
      enemies: createEnemies(round),
      birds: [],
      tracers: [],
      explosions: [],
      pierceHoles: [],
      health: PLAYER.maxHealth,
      caught: false,
      sectorCleared: false,
      round,
      input: { ...initialInput },
    })
  },

  restartGame: () => {
    clearAllEnemyRuntimes()
    clearAllBirdRuntimes()
    set({
      score: 0,
      enemies: createEnemies(1),
      birds: [],
      tracers: [],
      explosions: [],
      pierceHoles: [],
      health: PLAYER.maxHealth,
      caught: false,
      sectorCleared: false,
      round: 1,
      input: { ...initialInput },
    })
  },
}))
