import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setMuzzleObject } from '../../store/muzzle'

type PlayerAvatarProps = {
  /** Horizontal look yaw — body faces this direction. */
  yawRef: MutableRefObject<number>
  /** Vertical aim — tips the gun arm so shots match the look. */
  pitchRef: MutableRefObject<number>
  /** True while the player is moving on the ground plane. */
  movingRef: MutableRefObject<boolean>
}

/**
 * Bipedal toy dog for the player.
 * Mesh faces local -Z (forward). Camera sits on +Z, so you always see the back,
 * ears and wagging tail.
 */
export function PlayerAvatar({ yawRef, pitchRef, movingRef }: PlayerAvatarProps) {
  const root = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const lastRecoil = useRef(0)
  const recoil = useRef(0)

  const h = PLAYER.height

  const materials = useMemo(() => {
    const make = (color: string, roughness = 0.55) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color).multiplyScalar(0.06),
        roughness,
        metalness: 0,
      })
    return {
      fur: make(PLAYER.fur, 0.62),
      furLight: make(PLAYER.furLight, 0.58),
      furDark: make(PLAYER.furDark, 0.65),
      belly: make(PLAYER.belly, 0.55),
      nose: make(PLAYER.nose, 0.4),
      collar: make(PLAYER.collar, 0.45),
      eye: new THREE.MeshBasicMaterial({ color: COLORS.enemyEye }),
      eyeWhite: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
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
    // Face look-forward (-Z at yaw 0). Camera is behind on +Z → back view.
    root.current.rotation.y = yawRef.current
    recoil.current = THREE.MathUtils.damp(recoil.current, 0, 10, delta)

    const t = clock.elapsedTime
    const walking = movingRef.current
    const swing = walking ? Math.sin(t * 10) * 0.65 : Math.sin(t * 1.6) * 0.05

    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing

    if (armL.current) {
      armL.current.rotation.x = walking ? -0.4 + swing * 0.4 : -0.25
      armL.current.rotation.z = 0.18
    }
    if (armR.current) {
      armR.current.rotation.x = -1.0 + pitchRef.current - recoil.current * 0.35
      armR.current.rotation.y = 0.05
      armR.current.rotation.z = -0.08
    }
    if (tail.current) {
      const wag = walking ? Math.sin(t * 14) * 0.55 : Math.sin(t * 5) * 0.25
      tail.current.rotation.x = 0.55
      tail.current.rotation.y = wag
      tail.current.rotation.z = wag * 0.35
    }
  })

  return (
    <group ref={root}>
      {/* Hind legs (standing) */}
      <group ref={legL} position={[-0.13, 0.72 * h, 0.04]}>
        <mesh material={materials.fur} position={[0, -0.34 * h, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.4 * h, 4, 8]} />
        </mesh>
        <mesh material={materials.furDark} position={[0, -0.58 * h, -0.04]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
      </group>
      <group ref={legR} position={[0.13, 0.72 * h, 0.04]}>
        <mesh material={materials.fur} position={[0, -0.34 * h, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.4 * h, 4, 8]} />
        </mesh>
        <mesh material={materials.furDark} position={[0, -0.58 * h, -0.04]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
      </group>

      {/* Hips + upright torso */}
      <mesh material={materials.fur} position={[0, 0.78 * h, 0.02]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
      </mesh>
      <mesh material={materials.fur} position={[0, 1.08 * h, 0]} scale={[0.95, 1.15, 0.85]} castShadow>
        <sphereGeometry args={[0.26, 14, 14]} />
      </mesh>
      <mesh material={materials.belly} position={[0, 1.05 * h, -0.12]} scale={[0.75, 0.95, 0.55]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
      </mesh>

      {/* Plumbob collar */}
      <mesh material={materials.collar} position={[0, 1.32 * h, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.16, 0.035, 8, 16]} />
      </mesh>
      <mesh material={materials.collar} position={[0, 1.28 * h, -0.17]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.04]} />
      </mesh>

      {/* Front paws as arms */}
      <group ref={armL} position={[-0.28, 1.2 * h, -0.02]}>
        <mesh material={materials.fur} position={[0, -0.16 * h, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.22 * h, 4, 8]} />
        </mesh>
        <mesh material={materials.furLight} position={[0, -0.34 * h, -0.02]} castShadow>
          <sphereGeometry args={[0.085, 8, 8]} />
        </mesh>
      </group>

      <group ref={armR} position={[0.28, 1.2 * h, -0.02]}>
        <mesh material={materials.fur} position={[0, -0.16 * h, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.22 * h, 4, 8]} />
        </mesh>
        <mesh material={materials.furLight} position={[0, -0.34 * h, -0.02]} castShadow>
          <sphereGeometry args={[0.085, 8, 8]} />
        </mesh>

        {/* Tiny revolver aimed toward local -Z (forward) */}
        <group position={[0.02, -0.36 * h, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={materials.gun} castShadow>
            <boxGeometry args={[0.045, 0.18, 0.06]} />
          </mesh>
          <mesh material={materials.gun} position={[0, -0.14, 0.01]} castShadow>
            <cylinderGeometry args={[0.018, 0.02, 0.16, 8]} />
          </mesh>
          <mesh material={materials.grip} position={[0, 0.05, 0.06]} rotation={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.08, 0.045]} />
          </mesh>
          <group ref={muzzleRef} position={[0, -0.23, 0.01]} />
        </group>
      </group>

      {/* Head — snout toward -Z so the camera behind sees the back of the head */}
      <group position={[0, 1.55 * h, 0]}>
        <mesh material={materials.fur} scale={[1.05, 1.0, 1.05]} castShadow>
          <sphereGeometry args={[0.24, 14, 14]} />
        </mesh>

        {/* Floppy ears (read clearly from behind) */}
        <mesh
          material={materials.furDark}
          position={[-0.2, 0.12, 0.04]}
          rotation={[0.25, 0, 0.55]}
          castShadow
        >
          <capsuleGeometry args={[0.06, 0.16, 4, 8]} />
        </mesh>
        <mesh
          material={materials.furDark}
          position={[0.2, 0.12, 0.04]}
          rotation={[0.25, 0, -0.55]}
          castShadow
        >
          <capsuleGeometry args={[0.06, 0.16, 4, 8]} />
        </mesh>
        <mesh material={materials.furLight} position={[-0.2, 0.1, 0.02]} rotation={[0.25, 0, 0.55]}>
          <capsuleGeometry args={[0.035, 0.1, 4, 6]} />
        </mesh>
        <mesh material={materials.furLight} position={[0.2, 0.1, 0.02]} rotation={[0.25, 0, -0.55]}>
          <capsuleGeometry args={[0.035, 0.1, 4, 6]} />
        </mesh>

        {/* Snout + nose pointing forward (-Z) */}
        <mesh material={materials.furLight} position={[0, -0.04, -0.22]} scale={[0.85, 0.7, 1]} castShadow>
          <sphereGeometry args={[0.12, 10, 10]} />
        </mesh>
        <mesh material={materials.nose} position={[0, -0.02, -0.34]} castShadow>
          <sphereGeometry args={[0.045, 8, 8]} />
        </mesh>

        {/* Eyes on the face (-Z) */}
        <mesh material={materials.eyeWhite} position={[-0.08, 0.05, -0.2]}>
          <sphereGeometry args={[0.045, 8, 8]} />
        </mesh>
        <mesh material={materials.eyeWhite} position={[0.08, 0.05, -0.2]}>
          <sphereGeometry args={[0.045, 8, 8]} />
        </mesh>
        <mesh material={materials.eye} position={[-0.08, 0.05, -0.235]}>
          <sphereGeometry args={[0.022, 6, 6]} />
        </mesh>
        <mesh material={materials.eye} position={[0.08, 0.05, -0.235]}>
          <sphereGeometry args={[0.022, 6, 6]} />
        </mesh>
      </group>

      {/* Tail on the back (+Z) — wagging toward the camera */}
      <group ref={tail} position={[0, 0.95 * h, 0.16]}>
        <mesh material={materials.fur} position={[0, 0.08, 0.1]} rotation={[0.9, 0, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
        </mesh>
        <mesh material={materials.furLight} position={[0, 0.16, 0.22]} rotation={[1.1, 0, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
        </mesh>
      </group>
    </group>
  )
}
