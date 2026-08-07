import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PICKUPS } from '../../constants'
import { AMMO_SPAWNS, ORB_SPAWNS } from '../../map/pickupsLayout'
import { useGameStore } from '../../store/gameStore'
import { playAmmoPickup, playOrbPickup, unlockAudio } from '../../audio/gunshot'

type OrbState = { x: number; z: number; taken: boolean; mesh: THREE.Mesh }
type AmmoState = { x: number; z: number; taken: boolean; group: THREE.Group }

/**
 * Golden orbs + ammo crates. Collect by walking near them.
 */
export function PickupSystem() {
  const root = useRef<THREE.Group>(null)
  const orbs = useRef<OrbState[]>([])
  const crates = useRef<AmmoState[]>([])
  const lastRunId = useRef(useGameStore.getState().runId)
  const burstMeshes = useRef<THREE.Mesh[]>([])

  const orbGeo = useMemo(() => new THREE.SphereGeometry(PICKUPS.orbRadius, 12, 10), [])
  const orbMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFD24A',
        emissive: '#FFB000',
        emissiveIntensity: 1.35,
        roughness: 0.25,
        metalness: 0.55,
      }),
    [],
  )
  const crateGeo = useMemo(
    () => new THREE.BoxGeometry(PICKUPS.ammoBoxSize, PICKUPS.ammoBoxSize * 0.7, PICKUPS.ammoBoxSize),
    [],
  )
  const crateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8B5A2B',
        roughness: 0.85,
        metalness: 0.05,
      }),
    [],
  )
  const strapMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#C4A35A',
        roughness: 0.6,
        metalness: 0.2,
        emissive: '#6A5010',
        emissiveIntensity: 0.35,
      }),
    [],
  )

  const rebuild = () => {
    const parent = root.current
    if (!parent) return
    while (parent.children.length) {
      const c = parent.children[0]
      parent.remove(c)
    }
    orbs.current = []
    crates.current = []
    burstMeshes.current = []

    for (const p of ORB_SPAWNS) {
      const mesh = new THREE.Mesh(orbGeo, orbMat.clone())
      mesh.position.set(p.x, PICKUPS.orbHeight, p.z)
      mesh.castShadow = true
      parent.add(mesh)
      orbs.current.push({ x: p.x, z: p.z, taken: false, mesh })
    }

    for (const p of AMMO_SPAWNS) {
      const g = new THREE.Group()
      const box = new THREE.Mesh(crateGeo, crateMat)
      box.position.y = PICKUPS.ammoBoxSize * 0.35
      box.castShadow = true
      box.receiveShadow = true
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(PICKUPS.ammoBoxSize * 1.05, 0.08, 0.12),
        strapMat,
      )
      strap.position.y = PICKUPS.ammoBoxSize * 0.45
      g.add(box)
      g.add(strap)
      g.position.set(p.x, 0, p.z)
      parent.add(g)
      crates.current.push({ x: p.x, z: p.z, taken: false, group: g })
    }
  }

  useEffect(() => {
    rebuild()
  }, [orbGeo, orbMat, crateGeo, crateMat, strapMat])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const game = useGameStore.getState()
    const parent = root.current
    if (!parent) return

    if (game.runId !== lastRunId.current) {
      lastRunId.current = game.runId
      rebuild()
    }

    if (game.status !== 'playing') return

    const t = performance.now() * 0.001
    const px = game.playerX
    const pz = game.playerZ

    for (const orb of orbs.current) {
      if (orb.taken) continue
      orb.mesh.position.y = PICKUPS.orbHeight + Math.sin(t * 3 + orb.x) * 0.12
      orb.mesh.rotation.y += dt * 1.8
      const dist = Math.hypot(px - orb.x, pz - orb.z)
      if (dist <= PICKUPS.orbCollectDist) {
        orb.taken = true
        parent.remove(orb.mesh)
        ;(orb.mesh.material as THREE.Material).dispose()
        unlockAudio()
        playOrbPickup()
        // Brief spark burst
        const burst = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 6, 6),
          new THREE.MeshBasicMaterial({
            color: '#FFE28A',
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
          }),
        )
        burst.position.set(orb.x, PICKUPS.orbHeight, orb.z)
        parent.add(burst)
        burstMeshes.current.push(burst)
        game.collectOrb()
      }
    }

    for (const crate of crates.current) {
      if (crate.taken) continue
      crate.group.rotation.y += dt * 0.6
      const dist = Math.hypot(px - crate.x, pz - crate.z)
      if (dist <= PICKUPS.ammoCollectDist) {
        crate.taken = true
        parent.remove(crate.group)
        unlockAudio()
        playAmmoPickup()
        game.collectAmmo()
      }
    }

    const live: THREE.Mesh[] = []
    for (const b of burstMeshes.current) {
      const mat = b.material as THREE.MeshBasicMaterial
      mat.opacity -= dt * 4
      b.scale.multiplyScalar(1 + dt * 6)
      if (mat.opacity <= 0) {
        parent.remove(b)
        mat.dispose()
        b.geometry.dispose()
      } else {
        live.push(b)
      }
    }
    burstMeshes.current = live
  })

  return <group ref={root} />
}
