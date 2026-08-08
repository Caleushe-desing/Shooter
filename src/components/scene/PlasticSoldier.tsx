import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'

type Props = {
  yawRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

/**
 * Low-poly green plastic army man — rigid toy geometry, mechanical bob.
 * No Mixamo, no skeleton, no clip blending.
 */
export function PlasticSoldier({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Mesh>(null)
  const legR = useRef<THREE.Mesh>(null)
  const crouch = useRef(0)
  const bob = useRef(0)

  useFrame((_, dt) => {
    if (!root.current || !body.current) return
    root.current.rotation.y = yawRef.current

    const { isCrouching, isSprinting, input } = useGameStore.getState()
    const moving =
      movingRef.current || Math.hypot(input.moveX, input.moveZ) > 0.05

    crouch.current = THREE.MathUtils.damp(crouch.current, isCrouching ? 1 : 0, 14, dt)

    // Drop the whole torso as a rigid toy piece — no soft knee IK.
    body.current.position.y = THREE.MathUtils.lerp(0, -0.52, crouch.current)
    body.current.rotation.x = THREE.MathUtils.lerp(0, 0.22, crouch.current)

    const cadence = isSprinting ? 14 : 9
    const amp = (isSprinting ? 0.42 : 0.28) * (1 - crouch.current * 0.65)
    if (moving) bob.current += dt * cadence
    else bob.current = THREE.MathUtils.damp(bob.current, 0, 8, dt)

    const swing = Math.sin(bob.current) * amp * (moving ? 1 : 0)
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
  })

  const green = PLAYER.plastic
  const greenDark = PLAYER.plasticDark
  const greenLight = PLAYER.plasticLight

  return (
    <group ref={root}>
      {/* Planted feet base — never squashed */}
      <mesh ref={legL} position={[-0.11, 0.38, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.42, 3, 6]} />
        <meshStandardMaterial color={green} roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh ref={legR} position={[0.11, 0.38, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.42, 3, 6]} />
        <meshStandardMaterial color={green} roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh position={[-0.11, 0.05, 0.04]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.22]} />
        <meshStandardMaterial color={greenDark} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0.11, 0.05, 0.04]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.22]} />
        <meshStandardMaterial color={greenDark} roughness={0.5} metalness={0.05} />
      </mesh>

      <group ref={body}>
        {/* Torso */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.42, 4, 8]} />
          <meshStandardMaterial color={green} roughness={0.42} metalness={0.06} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.82, 0]} castShadow>
          <boxGeometry args={[0.42, 0.08, 0.28]} />
          <meshStandardMaterial color={greenDark} roughness={0.5} metalness={0.08} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.28, 1.05, 0.02]} rotation={[0.15, 0, 0.35]} castShadow>
          <capsuleGeometry args={[0.055, 0.38, 3, 6]} />
          <meshStandardMaterial color={green} roughness={0.45} metalness={0.05} />
        </mesh>
        <mesh position={[0.28, 1.0, 0.12]} rotation={[-0.55, 0, -0.2]} castShadow>
          <capsuleGeometry args={[0.055, 0.38, 3, 6]} />
          <meshStandardMaterial color={green} roughness={0.45} metalness={0.05} />
        </mesh>
        {/* Rifle (rigid toy prop) */}
        <mesh position={[0.22, 0.92, 0.38]} rotation={[-0.35, 0.15, 0]} castShadow>
          <boxGeometry args={[0.06, 0.06, 0.72]} />
          <meshStandardMaterial color={greenDark} roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh position={[0.22, 0.96, 0.7]} castShadow>
          <boxGeometry args={[0.05, 0.08, 0.14]} />
          <meshStandardMaterial color={greenLight} roughness={0.5} metalness={0.08} />
        </mesh>
        {/* Head + helmet */}
        <mesh position={[0, 1.48, 0.02]} castShadow>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color={greenLight} roughness={0.4} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.58, 0]} castShadow>
          <sphereGeometry args={[0.175, 10, 8]} />
          <meshStandardMaterial color={green} roughness={0.42} metalness={0.06} />
        </mesh>
        <mesh position={[0, 1.52, 0.12]} castShadow>
          <boxGeometry args={[0.34, 0.06, 0.16]} />
          <meshStandardMaterial color={green} roughness={0.45} metalness={0.05} />
        </mesh>
      </group>
    </group>
  )
}
