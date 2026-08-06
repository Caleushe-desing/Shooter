import { useRef, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, SCOPE } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setMuzzleObject } from '../../store/muzzle'

function Solid({
  children,
  color,
  position,
  rotation,
  scale,
}: {
  children: ReactNode
  color: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      {children}
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.02} fog={false} />
    </mesh>
  )
}

function Metal({
  children,
  color,
  position,
  rotation,
  scale,
}: {
  children: ReactNode
  color: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      {children}
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.45} fog={false} />
    </mesh>
  )
}

/** Segmented finger: proximal + middle + tip, curled for a grip pose. */
function Finger({
  position,
  rotation,
  length = 0.09,
  curl = 0.85,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  length?: number
  curl?: number
}) {
  const seg = length / 3
  const r = 0.012
  return (
    <group position={position} rotation={rotation}>
      <Solid color={COLORS.skin} position={[0, 0, -seg * 0.5]}>
        <capsuleGeometry args={[r, seg * 0.55, 4, 8]} />
      </Solid>
      <group position={[0, 0, -seg]} rotation={[curl, 0, 0]}>
        <Solid color={COLORS.skinLight} position={[0, 0, -seg * 0.45]}>
          <capsuleGeometry args={[r * 0.92, seg * 0.45, 4, 8]} />
        </Solid>
        <group position={[0, 0, -seg * 0.9]} rotation={[curl * 0.9, 0, 0]}>
          <Solid color={COLORS.skin} position={[0, 0, -seg * 0.35]}>
            <capsuleGeometry args={[r * 0.82, seg * 0.35, 4, 8]} />
          </Solid>
        </group>
      </group>
    </group>
  )
}

/**
 * Solid human right hand + opaque classic revolver (FPS viewmodel).
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

  useFrame(({ camera }, delta) => {
    if (!group.current) return
    recoil.current = THREE.MathUtils.damp(recoil.current, 0, 10, delta)

    // Swing the viewmodel toward the eye while scoping, then hide it so the
    // scope optics own the screen.
    const perspective = camera as THREE.PerspectiveCamera
    const zoom = perspective.isPerspectiveCamera
      ? THREE.MathUtils.clamp(
          (SCOPE.baseFov - perspective.fov) / (SCOPE.baseFov - SCOPE.zoomedFov),
          0,
          1,
        )
      : 0
    group.current.visible = zoom < SCOPE.hideWeaponAt

    const kick = recoil.current
    group.current.position.set(
      0.28 - zoom * 0.28,
      -0.28 + kick * 0.05 - zoom * 0.05,
      -0.55 - kick * 0.1 + zoom * 0.1,
    )
    group.current.rotation.set(
      0.12 - kick * 0.35,
      -0.35 + zoom * 0.35,
      0.08 + kick * 0.05,
    )
  })

  return (
    <group ref={group} position={[0.28, -0.28, -0.55]} scale={1.2}>
      {/* Soft fill so plastic skin/metal reads under bright Sims daylight */}
      <pointLight position={[0.15, 0.25, 0.1]} intensity={0.55} distance={1.8} color="#fff6e8" />
      <pointLight position={[-0.2, 0.05, -0.3]} intensity={0.22} distance={1.4} color="#b8e0ff" />

      {/* —— Human right hand —— */}
      <group position={[0.04, -0.08, 0.12]} rotation={[0.35, 0.15, 0.2]}>
        {/* Forearm */}
        <Solid color={COLORS.skinShadow} position={[0.02, -0.1, 0.22]} rotation={[0.55, 0.05, 0.15]}>
          <capsuleGeometry args={[0.045, 0.22, 4, 10]} />
        </Solid>

        {/* Wrist */}
        <Solid color={COLORS.skin} position={[0.01, -0.02, 0.1]} rotation={[0.3, 0.08, 0.1]}>
          <boxGeometry args={[0.08, 0.055, 0.07]} />
        </Solid>

        {/* Palm */}
        <Solid color={COLORS.skinLight} position={[0, 0.02, 0.02]} rotation={[0.15, 0.05, 0.08]}>
          <boxGeometry args={[0.095, 0.035, 0.11]} />
        </Solid>
        <Solid color={COLORS.skin} position={[0, 0.0, 0.02]} rotation={[0.15, 0.05, 0.08]} scale={[0.92, 0.7, 0.95]}>
          <boxGeometry args={[0.095, 0.035, 0.11]} />
        </Solid>

        {/* Thumb — wraps the left side of the frame */}
        <group position={[0.055, 0.015, 0.02]} rotation={[-0.2, 0.9, 1.1]}>
          <Solid color={COLORS.skinLight} position={[0, 0, -0.03]}>
            <capsuleGeometry args={[0.014, 0.04, 4, 8]} />
          </Solid>
          <group position={[0, 0, -0.055]} rotation={[0.5, 0.2, 0]}>
            <Solid color={COLORS.skin} position={[0, 0, -0.025]}>
              <capsuleGeometry args={[0.012, 0.03, 4, 8]} />
            </Solid>
          </group>
        </group>

        {/* Index — along the trigger guard / frame */}
        <Finger
          position={[0.028, 0.03, -0.04]}
          rotation={[0.35, 0.05, 0.05]}
          length={0.1}
          curl={0.35}
        />
        {/* Middle / ring / pinky — curl around grip */}
        <Finger position={[0.005, 0.028, -0.035]} rotation={[0.55, 0, 0.02]} length={0.105} curl={1.05} />
        <Finger position={[-0.02, 0.025, -0.03]} rotation={[0.65, -0.02, -0.04]} length={0.1} curl={1.15} />
        <Finger position={[-0.042, 0.02, -0.02]} rotation={[0.75, -0.05, -0.1]} length={0.085} curl={1.25} />
      </group>

      {/* —— Solid revolver —— */}
      <group position={[-0.02, 0.06, -0.14]} rotation={[0.08, 0.05, 0]}>
        {/* Barrel */}
        <Metal color={COLORS.gunSteel} position={[0, 0.05, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.032, 0.34, 12]} />
        </Metal>
        <Metal color={COLORS.gunMetal} position={[0, 0.05, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.345, 10]} />
        </Metal>

        {/* Front sight */}
        <Metal color={COLORS.gunMetalLight} position={[0, 0.085, -0.36]}>
          <boxGeometry args={[0.012, 0.02, 0.03]} />
        </Metal>

        {/* Muzzle tip — ballistic visual origin */}
        <group ref={muzzleRef} position={[0, 0.05, -0.4]} />

        {/* Cylinder */}
        <Metal color={COLORS.gunMetalLight} position={[0, 0.045, 0.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.085, 12]} />
        </Metal>
        <Metal color={COLORS.gunMetal} position={[0, 0.045, 0.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.09, 10]} />
        </Metal>

        {/* Frame */}
        <Metal color={COLORS.gunMetal} position={[0, 0.01, 0.08]}>
          <boxGeometry args={[0.06, 0.1, 0.16]} />
        </Metal>
        <Metal color={COLORS.gunMetalLight} position={[0, 0.055, 0.12]}>
          <boxGeometry args={[0.045, 0.04, 0.08]} />
        </Metal>

        {/* Hammer */}
        <Metal color={COLORS.gunSteel} position={[0, 0.1, 0.15]} rotation={[-0.55, 0, 0]}>
          <boxGeometry args={[0.02, 0.045, 0.05]} />
        </Metal>

        {/* Trigger guard */}
        <Metal color={COLORS.gunSteel} position={[0, -0.045, 0.07]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.038, 0.008, 6, 14, Math.PI]} />
        </Metal>

        {/* Trigger */}
        <Metal color={COLORS.gunMetalLight} position={[0, -0.03, 0.07]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.012, 0.035, 0.018]} />
        </Metal>

        {/* Grip (solid polymer / wood) */}
        <Solid color={COLORS.gunGrip} position={[0, -0.11, 0.16]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.055, 0.16, 0.07]} />
        </Solid>
        <Solid color={COLORS.skinShadow} position={[0.028, -0.11, 0.16]} rotation={[0.42, 0, 0]} scale={[0.35, 0.95, 0.95]}>
          <boxGeometry args={[0.055, 0.16, 0.07]} />
        </Solid>
        <Solid color={COLORS.skinShadow} position={[-0.028, -0.11, 0.16]} rotation={[0.42, 0, 0]} scale={[0.35, 0.95, 0.95]}>
          <boxGeometry args={[0.055, 0.16, 0.07]} />
        </Solid>
      </group>
    </group>
  )
}
