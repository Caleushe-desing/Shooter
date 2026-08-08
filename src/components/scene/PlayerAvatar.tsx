import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { COLORS, PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'

const SHIRT = '#4a5d4e'
const PANTS = '#2f3a42'
const BOOTS = '#1a1410'

type Props = {
  yawRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

export function PlayerAvatar({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)

  const materials = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({
        color: PLAYER.skin,
        roughness: 0.72,
        metalness: 0.02,
      }),
      shirt: new THREE.MeshStandardMaterial({ color: SHIRT, roughness: 0.86, metalness: 0.02 }),
      pants: new THREE.MeshStandardMaterial({ color: PANTS, roughness: 0.9, metalness: 0.02 }),
      boots: new THREE.MeshStandardMaterial({ color: BOOTS, roughness: 0.95, metalness: 0.02 }),
      eye: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.35, metalness: 0.1 }),
    }),
    [],
  )

  useFrame((state) => {
    const g = root.current
    if (!g || !leftArm.current || !rightArm.current || !leftLeg.current || !rightLeg.current) {
      return
    }

    g.rotation.y = yawRef.current

    const sprinting = useGameStore.getState().isSprinting
    const moving = movingRef.current
    const t = state.clock.elapsedTime
    const swing = moving ? Math.sin(t * (sprinting ? 12 : 8)) * (sprinting ? 0.55 : 0.35) : 0
    const bob = moving ? Math.abs(Math.sin(t * (sprinting ? 12 : 8))) * 0.03 : 0

    g.position.y = bob
    leftArm.current.rotation.x = swing
    rightArm.current.rotation.x = -swing
    leftLeg.current.rotation.x = -swing
    rightLeg.current.rotation.x = swing
  })

  return (
    <group ref={root}>
      <mesh position={[0, 0.95, 0]} castShadow material={materials.shirt}>
        <capsuleGeometry args={[0.22, 0.45, 6, 12]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} castShadow material={materials.skin}>
        <sphereGeometry args={[0.16, 16, 16]} />
      </mesh>
      <mesh position={[-0.05, 1.45, 0.14]} material={materials.eye}>
        <sphereGeometry args={[0.02, 8, 8]} />
      </mesh>
      <mesh position={[0.05, 1.45, 0.14]} material={materials.eye}>
        <sphereGeometry args={[0.02, 8, 8]} />
      </mesh>

      <group ref={leftArm} position={[-0.3, 1.15, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow material={materials.shirt}>
          <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow material={materials.skin}>
          <sphereGeometry args={[0.055, 10, 10]} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.3, 1.15, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow material={materials.shirt}>
          <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow material={materials.skin}>
          <sphereGeometry args={[0.055, 10, 10]} />
        </mesh>
      </group>

      <group ref={leftLeg} position={[-0.1, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow material={materials.pants}>
          <capsuleGeometry args={[0.08, 0.32, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.42, 0.02]} castShadow material={materials.boots}>
          <boxGeometry args={[0.12, 0.08, 0.18]} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.1, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow material={materials.pants}>
          <capsuleGeometry args={[0.08, 0.32, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.42, 0.02]} castShadow material={materials.boots}>
          <boxGeometry args={[0.12, 0.08, 0.18]} />
        </mesh>
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 20]} />
        <meshBasicMaterial color={COLORS.sky} transparent opacity={0.12} />
      </mesh>
    </group>
  )
}
