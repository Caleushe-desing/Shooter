import type { Object3D, Vector3 } from 'three'

/** Live muzzle tip object for ballistic visuals. */
let muzzleObject: Object3D | null = null

export function setMuzzleObject(object: Object3D | null) {
  muzzleObject = object
}

export function getMuzzleWorldPosition(out: Vector3): boolean {
  if (!muzzleObject) return false
  muzzleObject.getWorldPosition(out)
  return true
}
