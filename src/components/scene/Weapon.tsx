import { useRef, useEffect, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setMuzzleObject } from '../../store/muzzle'

/**
 * Minimalist wireframe hand + classic revolver (FPS viewmodel child of camera rig).
 */
export function Weapon() {
  const group = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const recoil = useRef(0)
  const lastNonce = useRef(0)

  useLayoutEffect(() => {
    setMuzzleObject(muzzleRef.current)
    return () => setMuzzleObject(null)
  }, [])

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      if (s.recoilNonce !== lastNonce.current) {
        lastNonce.current = s.recoilNonce
        recoil.current = 1
      }
    })
    return unsub
  }, [])

  useFrame((_, delta) => {
    if (!group.current) return
    recoil.current = THREE.MathUtils.damp(recoil.current, 0, 10, delta)

    const kick = recoil.current
    group.current.position.set(0.32, -0.32 + kick * 0.05, -0.62 - kick * 0.1)
    group.current.rotation.set(0.15 - kick * 0.4, -0.4, 0.1 + kick * 0.06)
  })

  return (
    <group ref={group} position={[0.32, -0.32, -0.62]} scale={1.15}>
      <mesh position={[0.06, -0.14, 0.2]} rotation={[0.45, 0, 0.25]}>
        <boxGeometry args={[0.12, 0.12, 0.32]} />
        <meshBasicMaterial color={COLORS.neonGreen} wireframe />
      </mesh>

      <mesh position={[0.02, -0.02, 0.04]} rotation={[0.25, 0.1, 0.15]}>
        <boxGeometry args={[0.16, 0.08, 0.18]} />
        <meshBasicMaterial color={COLORS.neonGreen} wireframe />
      </mesh>

      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.05 + i * 0.04, 0.03, -0.08]} rotation={[1.0, 0, 0]}>
          <boxGeometry args={[0.032, 0.032, 0.11]} />
          <meshBasicMaterial color={COLORS.neonGreen} wireframe />
        </mesh>
      ))}

      <mesh position={[0.1, 0.02, 0.02]} rotation={[0.3, 0.7, 0.5]}>
        <boxGeometry args={[0.035, 0.035, 0.1]} />
        <meshBasicMaterial color={COLORS.neonGreen} wireframe />
      </mesh>

      <group position={[-0.02, 0.06, -0.14]} rotation={[0.08, 0.05, 0]}>
        <mesh position={[0, 0.05, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.034, 0.36, 6]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        {/* Muzzle tip — ballistic visual origin */}
        <group ref={muzzleRef} position={[0, 0.05, -0.38]} />

        <mesh position={[0, 0.04, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.09, 8]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        <mesh position={[0, 0.0, 0.07]}>
          <boxGeometry args={[0.07, 0.12, 0.18]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        <mesh position={[0, 0.1, 0.14]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.025, 0.05, 0.06]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        <mesh position={[0, -0.12, 0.16]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.06, 0.18, 0.08]} />
          <meshBasicMaterial color={COLORS.neonGreen} wireframe />
        </mesh>

        <mesh position={[0, -0.05, 0.07]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.04, 0.01, 4, 10, Math.PI]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>
      </group>
    </group>
  )
}
