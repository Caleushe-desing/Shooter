import type * as THREE from 'three'

/**
 * Per-frame enemy simulation state. Kept outside React/zustand so the AI can
 * run every frame without re-rendering the whole roster.
 */
export type EnemyRuntime = {
  x: number
  z: number
  yaw: number
  /** Walk-cycle offset so the crowd doesn't march in lockstep. */
  phase: number
  speed: number
  grabbing: boolean
  /** performance.now() of death, or 0 while alive. */
  deadAt: number
  /** Sideways tilt used by the death fall. */
  fallSide: number
}

const runtimes = new Map<string, EnemyRuntime>()
const targets = new Map<string, THREE.Object3D>()

const player = { x: 0, y: 0, z: 0 }

export function setPlayerPosition(x: number, y: number, z: number) {
  player.x = x
  player.y = y
  player.z = z
}

export function getPlayerPosition() {
  return player
}

export function setEnemyRuntime(id: string, state: EnemyRuntime) {
  runtimes.set(id, state)
}

export function getEnemyRuntime(id: string): EnemyRuntime | undefined {
  return runtimes.get(id)
}

export function getAllEnemyRuntimes(): [string, EnemyRuntime][] {
  return Array.from(runtimes.entries())
}

export function clearEnemyRuntime(id: string) {
  runtimes.delete(id)
}

export function clearAllEnemyRuntimes() {
  runtimes.clear()
}

export function registerEnemyTarget(id: string, object: THREE.Object3D) {
  targets.set(id, object)
}

export function unregisterEnemyTarget(id: string) {
  targets.delete(id)
}

export function getEnemyTargets(): THREE.Object3D[] {
  return Array.from(targets.values())
}

/** Walks up the hierarchy to find which enemy (and body part) was hit. */
export function resolveEnemyHitPart(object: THREE.Object3D): {
  enemyId: string | null
  head: boolean
} {
  let current: THREE.Object3D | null = object
  let head = false
  let enemyId: string | null = null

  while (current) {
    if (current.userData?.part === 'head') head = true
    const id = current.userData?.enemyId as string | undefined
    if (id) {
      enemyId = id
      break
    }
    current = current.parent
  }

  return { enemyId, head }
}
