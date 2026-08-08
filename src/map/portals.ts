import { PORTAL } from '../constants'

export type PortalSpot = {
  id: number
  x: number
  z: number
  yaw: number
}

const SUPER_PORTAL: PortalSpot = {
  id: 0,
  x: PORTAL.x,
  z: PORTAL.z,
  yaw: 0,
}

export function getPortals(): PortalSpot[] {
  return [SUPER_PORTAL]
}

export function getSuperPortal(): PortalSpot {
  return SUPER_PORTAL
}

export function clearPortals() {
  // Single fixed portal — nothing to clear.
}

export function ensurePortalsForRun(_runId: number): PortalSpot[] {
  return getPortals()
}

export function takeNextPortal(): PortalSpot {
  return SUPER_PORTAL
}
