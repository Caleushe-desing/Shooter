import { useRef, useEffect } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../../constants'
import { useGameStore } from '../../store/gameStore'

/**
 * Minimalist wireframe hand + classic revolver, locked to camera (FPS viewmodel).
 */
export function Weapon() {
  const group = useRef<THREE.Group>(null)
  const recoil = useRef(0)
  const lastNonce = useRef(0)
  const { camera } = useThree()

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
    group.current.position.set(0.28, -0.28 + kick * 0.04, -0.55 - kick * 0.08)
    group.current.rotation.set(0.12 - kick * 0.35, -0.35, 0.08 + kick * 0.05)
  })

  return createPortal(
    <group ref={group} position={[0.28, -0.28, -0.55]}>
      <mesh position={[0.05, -0.12, 0.18]} rotation={[0.4, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.1, 0.28]} />
        <meshBasicMaterial color={COLORS.neonGreen} wireframe />
      </mesh>

      <mesh position={[0.02, -0.02, 0.02]} rotation={[0.2, 0.1, 0.15]}>
        <boxGeometry args={[0.14, 0.07, 0.16]} />
        <meshBasicMaterial color={COLORS.neonGreen} wireframe />
      </mesh>

      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.04 + i * 0.04, 0.02, -0.08]} rotation={[0.9, 0, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.1]} />
          <meshBasicMaterial color={COLORS.neonGreen} wireframe />
        </mesh>
      ))}

      <mesh position={[0.08, 0.01, 0]} rotation={[0.3, 0.6, 0.4]}>
        <boxGeometry args={[0.03, 0.03, 0.09]} />
        <meshBasicMaterial color={COLORS.neonGreen} wireframe />
      </mesh>

      <group position={[-0.02, 0.04, -0.12]} rotation={[0.05, 0.05, 0]}>
        <mesh position={[0, 0.04, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.028, 0.32, 6]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        <mesh position={[0, 0.03, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 8]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        <mesh position={[0, 0.0, 0.06]}>
          <boxGeometry args={[0.06, 0.1, 0.16]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        <mesh position={[0, 0.08, 0.12]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.02, 0.04, 0.05]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>

        <mesh position={[0, -0.1, 0.14]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.055, 0.16, 0.07]} />
          <meshBasicMaterial color={COLORS.neonGreen} wireframe />
        </mesh>

        <mesh position={[0, -0.04, 0.06]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.035, 0.008, 4, 8, Math.PI]} />
          <meshBasicMaterial color={COLORS.white} wireframe />
        </mesh>
      </group>
    </group>,
    camera,
  )
}
