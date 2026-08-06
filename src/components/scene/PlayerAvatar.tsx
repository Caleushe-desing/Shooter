import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setMuzzleObject } from '../../store/muzzle'

type PlayerAvatarProps = {
  /** Horizontal look yaw — body faces this direction. */
  yawRef: MutableRefObject<number>
  /** True while the player is moving on the ground plane. */
  movingRef: MutableRefObject<boolean>
}

/**
 * Sim-like third-person body for the player — bright plumbob shirt so they
 * read clearly against the hostile crowd.
 */
export function PlayerAvatar({ yawRef, movingRef }: PlayerAvatarProps) {
  const root = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const lastRecoil = useRef(0)
  const recoil = useRef(0)

  const h = PLAYER.height

  const materials = useMemo(() => {
    const make = (color: string) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color).multiplyScalar(0.08),
        roughness: 0.48,
        metalness: 0,
      })
    return {
      skin: make(PLAYER.skin),
      shirt: make(PLAYER.shirt),
      pants: make(PLAYER.pants),
      eye: new THREE.MeshBasicMaterial({ color: COLORS.enemyEye }),
      eyeWhite: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      blush: new THREE.MeshBasicMaterial({ color: '#FF8FAB', transparent: true, opacity: 0.4 }),
      gun: new THREE.MeshStandardMaterial({
        color: COLORS.gunMetal,
        roughness: 0.4,
        metalness: 0.45,
      }),
      grip: new THREE.MeshStandardMaterial({
        color: COLORS.gunGrip,
        roughness: 0.6,
        metalness: 0,
      }),
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const mat of Object.values(materials)) mat.dispose()
    }
  }, [materials])

  useLayoutEffect(() => {
    setMuzzleObject(muzzleRef.current)
    return () => setMuzzleObject(null)
  }, [])

  useEffect(() => {
    return useGameStore.subscribe((s) => {
      if (s.recoilNonce !== lastRecoil.current) {
        lastRecoil.current = s.recoilNonce
        recoil.current = 1
      }
    })
  }, [])

  useFrame(({ clock }, delta) => {
    if (!root.current) return
    root.current.rotation.y = yawRef.current
    recoil.current = THREE.MathUtils.damp(recoil.current, 0, 10, delta)

    const t = clock.elapsedTime
    const walking = movingRef.current
    const swing = walking ? Math.sin(t * 9.5) * 0.7 : Math.sin(t * 1.4) * 0.04

    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing

    // Left arm idle / slight walk sway; right arm holds the revolver forward.
    if (armL.current) {
      armL.current.rotation.x = walking ? -0.35 + swing * 0.35 : -0.2
      armL.current.rotation.z = 0.12
    }
    if (armR.current) {
      armR.current.rotation.x = -1.05 - recoil.current * 0.35
      armR.current.rotation.y = -0.15
      armR.current.rotation.z = -0.2
    }
  })

  return (
    <group ref={root}>
      {/* Legs */}
      <group ref={legL} position={[-0.14, 0.78 * h, 0]}>
        <mesh material={materials.pants} position={[0, -0.38 * h, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.46 * h, 4, 8]} />
        </mesh>
      </group>
      <group ref={legR} position={[0.14, 0.78 * h, 0]}>
        <mesh material={materials.pants} position={[0, -0.38 * h, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.46 * h, 4, 8]} />
        </mesh>
      </group>

      {/* Hips + torso */}
      <mesh material={materials.pants} position={[0, 0.84 * h, 0]} castShadow>
        <boxGeometry args={[0.42, 0.22, 0.26]} />
      </mesh>
      <mesh material={materials.shirt} position={[0, 1.12 * h, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.34 * h, 4, 10]} />
      </mesh>

      {/* Left arm */}
      <group ref={armL} position={[-0.32, 1.3 * h, 0]}>
        <mesh material={materials.shirt} position={[0, -0.18 * h, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.28 * h, 4, 8]} />
        </mesh>
        <mesh material={materials.skin} position={[0, -0.4 * h, 0]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
      </group>

      {/* Right arm + held revolver */}
      <group ref={armR} position={[0.32, 1.3 * h, 0]}>
        <mesh material={materials.shirt} position={[0, -0.18 * h, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.28 * h, 4, 8]} />
        </mesh>
        <mesh material={materials.skin} position={[0, -0.4 * h, 0]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>

        <group position={[0.02, -0.42 * h, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={materials.gun} castShadow>
            <boxGeometry args={[0.05, 0.22, 0.07]} />
          </mesh>
          <mesh material={materials.gun} position={[0, -0.16, 0.01]} castShadow>
            <cylinderGeometry args={[0.022, 0.025, 0.2, 8]} />
          </mesh>
          <mesh material={materials.grip} position={[0, 0.06, 0.07]} rotation={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.045, 0.1, 0.05]} />
          </mesh>
          {/* Tracer visual origin */}
          <group ref={muzzleRef} position={[0, -0.27, 0.01]} />
        </group>
      </group>

      {/* Neck + head */}
      <mesh material={materials.skin} position={[0, 1.38 * h, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.09, 8]} />
      </mesh>
      <group position={[0, 1.62 * h, 0]}>
        <mesh material={materials.skin} scale={[1.08, 1.15, 1.02]} castShadow>
          <sphereGeometry args={[0.22, 14, 14]} />
        </mesh>
        <mesh material={materials.blush} position={[-0.12, -0.02, 0.16]}>
          <sphereGeometry args={[0.035, 6, 6]} />
        </mesh>
        <mesh material={materials.blush} position={[0.12, -0.02, 0.16]}>
          <sphereGeometry args={[0.035, 6, 6]} />
        </mesh>
        <mesh material={materials.eyeWhite} position={[-0.08, 0.04, 0.18]}>
          <sphereGeometry args={[0.048, 8, 8]} />
        </mesh>
        <mesh material={materials.eyeWhite} position={[0.08, 0.04, 0.18]}>
          <sphereGeometry args={[0.048, 8, 8]} />
        </mesh>
        <mesh material={materials.eye} position={[-0.08, 0.04, 0.218]}>
          <sphereGeometry args={[0.022, 6, 6]} />
        </mesh>
        <mesh material={materials.eye} position={[0.08, 0.04, 0.218]}>
          <sphereGeometry args={[0.022, 6, 6]} />
        </mesh>
      </group>
    </group>
  )
}
