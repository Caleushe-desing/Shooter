import type * as THREE from 'three'

/** Active plate object3Ds for mesh raycasting. */
const plateTargets = new Map<string, THREE.Object3D>()

export function registerPlateTarget(id: string, object: THREE.Object3D) {
  plateTargets.set(id, object)
}

export function unregisterPlateTarget(id: string) {
  plateTargets.delete(id)
}

export function getPlateTargets(): THREE.Object3D[] {
  return Array.from(plateTargets.values())
}

export function getPlateIdFromObject(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object
  while (current) {
    const id = current.userData?.plateId as string | undefined
    if (id) return id
    current = current.parent
  }
  return null
}
