import type * as THREE from 'three'

/** Per-frame bird flight state, kept outside React like the enemy runtime. */
export type BirdRuntime = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  /** Wing-flap phase. */
  flap: number
  bobPhase: number
  /** performance.now() of death, or 0 while flying. */
  deadAt: number
  tumble: number
}

const runtimes = new Map<string, BirdRuntime>()
const targets = new Map<string, THREE.Object3D>()

export function setBirdRuntime(id: string, state: BirdRuntime) {
  runtimes.set(id, state)
}

export function getBirdRuntime(id: string): BirdRuntime | undefined {
  return runtimes.get(id)
}

export function clearBirdRuntime(id: string) {
  runtimes.delete(id)
}

export function clearAllBirdRuntimes() {
  runtimes.clear()
}

export function registerBirdTarget(id: string, object: THREE.Object3D) {
  targets.set(id, object)
}

export function unregisterBirdTarget(id: string) {
  targets.delete(id)
}

export function getBirdTargets(): THREE.Object3D[] {
  return Array.from(targets.values())
}

export function resolveBirdId(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object
  while (current) {
    const id = current.userData?.birdId as string | undefined
    if (id) return id
    current = current.parent
  }
  return null
}
