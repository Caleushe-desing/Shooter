import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PICKUPS } from '../../constants'
import { AMMO_SPAWNS } from '../../map/pickupsLayout'
import { useGameStore } from '../../store/gameStore'
import { playAmmoPickup, unlockAudio } from '../../audio/gunshot'

type AmmoState = { x: number; y: number; z: number; taken: boolean; group: THREE.Group }

/**
 * Hidden ammo crates scattered across the map (including ledges).
 */
export function PickupSystem() {
  const root = useRef<THREE.Group>(null)
  const crates = useRef<AmmoState[]>([])
  const lastRunId = useRef(useGameStore.getState().runId)

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
    crates.current = []

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
      g.position.set(p.x, p.y, p.z)
      parent.add(g)
      crates.current.push({ x: p.x, y: p.y, z: p.z, taken: false, group: g })
    }
  }

  useEffect(() => {
    rebuild()
  }, [crateGeo, crateMat, strapMat])

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

    const px = game.playerX
    const py = game.playerY
    const pz = game.playerZ

    for (const crate of crates.current) {
      if (crate.taken) continue
      crate.group.rotation.y += dt * 0.6
      const dist = Math.hypot(px - crate.x, pz - crate.z)
      const dy = Math.abs(py - crate.y)
      if (dist <= PICKUPS.ammoCollectDist && dy < 1.6) {
        crate.taken = true
        parent.remove(crate.group)
        unlockAudio()
        playAmmoPickup()
        game.collectAmmo()
      }
    }
  })

  return <group ref={root} />
}
