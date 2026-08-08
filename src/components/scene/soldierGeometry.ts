import * as THREE from 'three'

/**
 * Low-poly WWII-era infantry silhouette (helmet, tunic, boots).
 * No political symbols — only generic military shapes/colors.
 */
export function createSoldierParts(radius: number, height: number) {
  const geos = {
    body: new THREE.CapsuleGeometry(radius * 0.72, height * 0.42, 4, 8),
    head: new THREE.SphereGeometry(radius * 0.38, 8, 8),
    helmet: new THREE.SphereGeometry(radius * 0.44, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
    brim: new THREE.TorusGeometry(radius * 0.42, 0.04, 6, 16),
    armL: new THREE.CapsuleGeometry(radius * 0.16, height * 0.28, 3, 6),
    armR: new THREE.CapsuleGeometry(radius * 0.16, height * 0.28, 3, 6),
    legL: new THREE.CapsuleGeometry(radius * 0.2, height * 0.32, 3, 6),
    legR: new THREE.CapsuleGeometry(radius * 0.2, height * 0.32, 3, 6),
    bootL: new THREE.BoxGeometry(radius * 0.38, radius * 0.22, radius * 0.55),
    bootR: new THREE.BoxGeometry(radius * 0.38, radius * 0.22, radius * 0.55),
    rifle: new THREE.BoxGeometry(0.06, 0.06, height * 0.55),
  }
  return geos
}

export const SOLDIER_COLORS = {
  tunic: '#4A5560',
  tunicAlert: '#6B3030',
  helmet: '#3A4248',
  skin: '#C4A07A',
  boots: '#1A1814',
  rifle: '#2A241C',
} as const
