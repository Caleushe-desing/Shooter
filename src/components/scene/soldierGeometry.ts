import * as THREE from 'three'

/**
 * Commandos-style low-poly rifleman:
 * Stahlhelm, feldgrau greatcoat, Y-straps, jackboots, rifle.
 * No political symbols — silhouette and colors only.
 */
export function createSoldierParts(radius: number, height: number) {
  const r = radius
  const h = height
  return {
    // Longer coat body (Commandos greatcoat read)
    coat: new THREE.CylinderGeometry(r * 0.78, r * 0.95, h * 0.52, 10),
    shoulders: new THREE.BoxGeometry(r * 1.7, r * 0.35, r * 0.9),
    collar: new THREE.BoxGeometry(r * 0.85, r * 0.22, r * 0.55),
    // Head + iconic flared Stahlhelm
    head: new THREE.SphereGeometry(r * 0.34, 10, 10),
    helmetDome: new THREE.SphereGeometry(r * 0.42, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
    helmetSkirt: new THREE.CylinderGeometry(r * 0.5, r * 0.58, r * 0.22, 12, 1, true),
    helmetBrim: new THREE.TorusGeometry(r * 0.48, 0.035, 6, 18),
    // Limbs
    armL: new THREE.CapsuleGeometry(r * 0.15, h * 0.26, 3, 6),
    armR: new THREE.CapsuleGeometry(r * 0.15, h * 0.26, 3, 6),
    handL: new THREE.SphereGeometry(r * 0.12, 6, 6),
    handR: new THREE.SphereGeometry(r * 0.12, 6, 6),
    legL: new THREE.CapsuleGeometry(r * 0.18, h * 0.28, 3, 6),
    legR: new THREE.CapsuleGeometry(r * 0.18, h * 0.28, 3, 6),
    bootL: new THREE.BoxGeometry(r * 0.36, r * 0.42, r * 0.7),
    bootR: new THREE.BoxGeometry(r * 0.36, r * 0.42, r * 0.7),
    // Gear
    belt: new THREE.TorusGeometry(r * 0.72, 0.045, 6, 16),
    pouchL: new THREE.BoxGeometry(r * 0.28, r * 0.22, r * 0.18),
    pouchR: new THREE.BoxGeometry(r * 0.28, r * 0.22, r * 0.18),
    strapL: new THREE.BoxGeometry(0.05, h * 0.28, 0.04),
    strapR: new THREE.BoxGeometry(0.05, h * 0.28, 0.04),
    // Kar98-ish rifle
    stock: new THREE.BoxGeometry(0.08, 0.1, h * 0.28),
    barrel: new THREE.CylinderGeometry(0.025, 0.03, h * 0.42, 6),
    grip: new THREE.BoxGeometry(0.06, 0.12, 0.08),
  }
}

/** Classic Commandos feldgrau palette. */
export const SOLDIER_COLORS = {
  tunic: '#5C6B58',
  tunicAlert: '#7A4038',
  coatDark: '#4A5848',
  helmet: '#3E463C',
  skin: '#C9A882',
  boots: '#1C1814',
  belt: '#2A241C',
  strap: '#3A3228',
  rifleWood: '#6B4A2A',
  rifleMetal: '#2E3230',
} as const

/** Assemble a readable Commandos-like soldier group. */
export function buildSoldierMesh(
  parts: ReturnType<typeof createSoldierParts>,
  mats: {
    tunic: THREE.Material
    coat: THREE.Material
    helmet: THREE.Material
    skin: THREE.Material
    boots: THREE.Material
    belt: THREE.Material
    strap: THREE.Material
    wood: THREE.Material
    metal: THREE.Material
  },
  radius: number,
  height: number,
): THREE.Group {
  const g = new THREE.Group()
  const r = radius
  const h = height

  const coat = new THREE.Mesh(parts.coat, mats.coat)
  coat.name = 'body'
  coat.position.y = h * 0.52
  coat.castShadow = true
  g.add(coat)

  const shoulders = new THREE.Mesh(parts.shoulders, mats.tunic)
  shoulders.position.y = h * 0.72
  shoulders.castShadow = true
  g.add(shoulders)

  const collar = new THREE.Mesh(parts.collar, mats.coat)
  collar.position.set(0, h * 0.78, -r * 0.05)
  g.add(collar)

  const head = new THREE.Mesh(parts.head, mats.skin)
  head.position.y = h * 0.86
  head.castShadow = true
  g.add(head)

  const dome = new THREE.Mesh(parts.helmetDome, mats.helmet)
  dome.position.y = h * 0.92
  dome.castShadow = true
  g.add(dome)

  const skirt = new THREE.Mesh(parts.helmetSkirt, mats.helmet)
  skirt.position.y = h * 0.86
  g.add(skirt)

  const brim = new THREE.Mesh(parts.helmetBrim, mats.helmet)
  brim.rotation.x = Math.PI / 2
  brim.position.set(0, h * 0.845, -0.04)
  brim.scale.set(1, 1.15, 1)
  g.add(brim)

  const armL = new THREE.Mesh(parts.armL, mats.tunic)
  armL.position.set(-r * 0.95, h * 0.58, 0)
  armL.rotation.z = 0.18
  armL.castShadow = true
  g.add(armL)
  const armR = new THREE.Mesh(parts.armR, mats.tunic)
  armR.position.set(r * 0.95, h * 0.58, 0)
  armR.rotation.z = -0.18
  armR.castShadow = true
  g.add(armR)

  const handL = new THREE.Mesh(parts.handL, mats.skin)
  handL.position.set(-r * 1.05, h * 0.38, 0.05)
  g.add(handL)
  const handR = new THREE.Mesh(parts.handR, mats.skin)
  handR.position.set(r * 1.05, h * 0.38, 0.05)
  g.add(handR)

  const legL = new THREE.Mesh(parts.legL, mats.tunic)
  legL.position.set(-r * 0.3, h * 0.22, 0)
  legL.castShadow = true
  g.add(legL)
  const legR = new THREE.Mesh(parts.legR, mats.tunic)
  legR.position.set(r * 0.3, h * 0.22, 0)
  legR.castShadow = true
  g.add(legR)

  const bootL = new THREE.Mesh(parts.bootL, mats.boots)
  bootL.position.set(-r * 0.3, 0.12, -0.06)
  bootL.castShadow = true
  g.add(bootL)
  const bootR = new THREE.Mesh(parts.bootR, mats.boots)
  bootR.position.set(r * 0.3, 0.12, -0.06)
  bootR.castShadow = true
  g.add(bootR)

  const belt = new THREE.Mesh(parts.belt, mats.belt)
  belt.rotation.x = Math.PI / 2
  belt.position.y = h * 0.42
  g.add(belt)

  const pouchL = new THREE.Mesh(parts.pouchL, mats.belt)
  pouchL.position.set(-r * 0.55, h * 0.4, r * 0.55)
  g.add(pouchL)
  const pouchR = new THREE.Mesh(parts.pouchR, mats.belt)
  pouchR.position.set(r * 0.55, h * 0.4, r * 0.55)
  g.add(pouchR)

  const strapL = new THREE.Mesh(parts.strapL, mats.strap)
  strapL.position.set(-r * 0.35, h * 0.58, r * 0.15)
  strapL.rotation.z = 0.35
  g.add(strapL)
  const strapR = new THREE.Mesh(parts.strapR, mats.strap)
  strapR.position.set(r * 0.35, h * 0.58, r * 0.15)
  strapR.rotation.z = -0.35
  g.add(strapR)

  // Rifle across body, barrel forward (−Z)
  const stock = new THREE.Mesh(parts.stock, mats.wood)
  stock.position.set(r * 0.35, h * 0.5, -h * 0.02)
  stock.rotation.x = 0.2
  g.add(stock)
  const barrel = new THREE.Mesh(parts.barrel, mats.metal)
  barrel.rotation.x = Math.PI / 2 + 0.2
  barrel.position.set(r * 0.35, h * 0.52, -h * 0.28)
  g.add(barrel)
  const grip = new THREE.Mesh(parts.grip, mats.wood)
  grip.position.set(r * 0.35, h * 0.44, -h * 0.08)
  g.add(grip)

  return g
}
