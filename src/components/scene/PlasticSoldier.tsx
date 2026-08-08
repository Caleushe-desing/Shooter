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
 * Right arm raises to aim/fire while LMB is held.
 */
export function PlasticSoldier({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const muzzle = useRef<THREE.Mesh>(null)
  const legL = useRef<THREE.Mesh>(null)
  const legR = useRef<THREE.Mesh>(null)
  const crouch = useRef(0)
  const aim = useRef(0)
  const bob = useRef(0)
  const flash = useRef(0)
  const fireClock = useRef(0)

  useFrame((_, dt) => {
    if (!root.current || !body.current || !rightArm.current) return
    // Model faces +Z; +PI so the camera behind (+Z local) sees the back.
    root.current.rotation.y = yawRef.current + Math.PI

    const { isCrouching, isSprinting, input } = useGameStore.getState()
    const moving =
      movingRef.current || Math.hypot(input.moveX, input.moveZ) > 0.05
    const firing = input.firing

    crouch.current = THREE.MathUtils.damp(crouch.current, isCrouching ? 1 : 0, 14, dt)
    aim.current = THREE.MathUtils.damp(aim.current, firing ? 1 : 0, 18, dt)

    body.current.position.y = THREE.MathUtils.lerp(0, -0.52, crouch.current)
    body.current.rotation.x = THREE.MathUtils.lerp(0, 0.22, crouch.current)

    const cadence = isSprinting ? 14 : 9
    const amp = (isSprinting ? 0.42 : 0.28) * (1 - crouch.current * 0.65) * (1 - aim.current * 0.5)
    if (moving) bob.current += dt * cadence
    else bob.current = THREE.MathUtils.damp(bob.current, 0, 8, dt)

    const swing = Math.sin(bob.current) * amp * (moving ? 1 : 0)
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing

    // Rest: arm down along side. Aim: raise forward (+Z model forward).
    const restX = 0.85
    const aimX = -1.15
    const restZ = -0.15
    const aimZ = 0.05
    rightArm.current.rotation.x = THREE.MathUtils.lerp(restX, aimX, aim.current)
    rightArm.current.rotation.z = THREE.MathUtils.lerp(restZ, aimZ, aim.current)
    rightArm.current.rotation.y = THREE.MathUtils.lerp(0.1, -0.05, aim.current)

    // Muzzle flash pulses while holding fire
    if (firing) {
      fireClock.current += dt
      if (fireClock.current > 0.12) {
        fireClock.current = 0
        flash.current = 1
      }
    } else {
      fireClock.current = 0
    }
    flash.current = Math.max(0, flash.current - dt * 8)
    if (muzzle.current) {
      const s = 0.08 + flash.current * 0.55
      muzzle.current.scale.setScalar(s)
      const mat = muzzle.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = flash.current * 3.5
      mat.opacity = 0.15 + flash.current * 0.85
      muzzle.current.visible = flash.current > 0.02 || aim.current > 0.7
    }
  })

  const green = PLAYER.plastic
  const greenDark = PLAYER.plasticDark
  const greenLight = PLAYER.plasticLight

  return (
    <group ref={root}>
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
        <mesh position={[0, 1.05, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.42, 4, 8]} />
          <meshStandardMaterial color={green} roughness={0.42} metalness={0.06} />
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <boxGeometry args={[0.42, 0.08, 0.28]} />
          <meshStandardMaterial color={greenDark} roughness={0.5} metalness={0.08} />
        </mesh>

        {/* Left arm — idle */}
        <mesh position={[-0.28, 1.05, 0.02]} rotation={[0.15, 0, 0.35]} castShadow>
          <capsuleGeometry args={[0.055, 0.38, 3, 6]} />
          <meshStandardMaterial color={green} roughness={0.45} metalness={0.05} />
        </mesh>

        {/* Right arm + pistol — pivots from shoulder for aim/fire */}
        <group ref={rightArm} position={[0.26, 1.18, 0.02]}>
          <mesh position={[0.02, -0.22, 0.02]} castShadow>
            <capsuleGeometry args={[0.055, 0.36, 3, 6]} />
            <meshStandardMaterial color={green} roughness={0.45} metalness={0.05} />
          </mesh>
          {/* Pistol */}
          <mesh position={[0.02, -0.48, 0.16]} castShadow>
            <boxGeometry args={[0.07, 0.12, 0.28]} />
            <meshStandardMaterial color={greenDark} roughness={0.5} metalness={0.12} />
          </mesh>
          <mesh position={[0.02, -0.42, 0.32]} castShadow>
            <boxGeometry args={[0.05, 0.06, 0.18]} />
            <meshStandardMaterial color={greenLight} roughness={0.48} metalness={0.1} />
          </mesh>
          {/* Muzzle flash */}
          <mesh ref={muzzle} position={[0.02, -0.4, 0.48]} visible={false}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshStandardMaterial
              color="#ffe8a0"
              emissive="#ffaa44"
              emissiveIntensity={0}
              transparent
              opacity={0}
              roughness={0.3}
              metalness={0}
              depthWrite={false}
            />
          </mesh>
        </group>

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
