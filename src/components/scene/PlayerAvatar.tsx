import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setMuzzleObject } from '../../store/muzzle'

type PlayerAvatarProps = {
  yawRef: MutableRefObject<number>
  pitchRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

/**
 * Nude adult human (game-appropriate, non-explicit) — no clothing.
 * Mesh faces local −Z so the chase cam on +Z always reads the back.
 */
export function PlayerAvatar({ yawRef, pitchRef, movingRef }: PlayerAvatarProps) {
  const root = useRef<THREE.Group>(null)
  const pose = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const lastRecoil = useRef(0)
  const recoil = useRef(0)

  const h = PLAYER.height

  const materials = useMemo(() => {
    const make = (color: string, roughness = 0.72) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
    return {
      skin: make(PLAYER.skin, 0.68),
      skinLight: make(PLAYER.skinLight, 0.7),
      skinShadow: make(PLAYER.skinShadow, 0.75),
      hair: make(PLAYER.hair, 0.85),
      eye: new THREE.MeshBasicMaterial({ color: COLORS.enemyEye }),
      gun: make(COLORS.gunMetal, 0.4),
      grip: make(COLORS.gunGrip, 0.65),
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

  useFrame((_, delta) => {
    if (!root.current || !pose.current || !torso.current) return
    // Body yaw = look yaw → camera always sees the back.
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const stance = game.stance
    const sprint = game.input.sprint && stance === 'stand'
    const slow = game.input.slow
    const airborne = game.airborne
    const walk = movingRef.current && !airborne ? 1 : 0

    let rootY = 0
    let posePitch = 0
    let torsoPitch = 0
    let legBend = 0
    let armHang = 0
    let swingAmp = 0.5
    let swingRate = 8.5

    if (stance === 'crouch') {
      rootY = -0.28
      torsoPitch = 0.32
      legBend = 0.85
      armHang = 0.25
      swingAmp = 0.26
      swingRate = 7
    } else if (stance === 'prone') {
      rootY = 0.18
      posePitch = 1.35
      torsoPitch = 0.08
      legBend = 0.15
      armHang = 1.05
      swingAmp = 0.1
      swingRate = 5
    } else if (sprint) {
      swingAmp = 0.72
      swingRate = 13
    } else if (slow) {
      swingAmp = 0.26
      swingRate = 5.5
    }

    if (airborne) {
      legBend = Math.max(legBend, 0.35)
      armHang = Math.max(armHang, 0.4)
      swingAmp = 0
    }

    pose.current.position.y = THREE.MathUtils.damp(pose.current.position.y, rootY, 12, delta)
    pose.current.rotation.x = THREE.MathUtils.damp(pose.current.rotation.x, posePitch, 12, delta)
    torso.current.rotation.x = THREE.MathUtils.damp(torso.current.rotation.x, torsoPitch, 12, delta)

    const t = performance.now() * 0.001
    const swing = Math.sin(t * swingRate) * swingAmp * walk
    if (legL.current) legL.current.rotation.x = legBend + swing
    if (legR.current) legR.current.rotation.x = legBend - swing
    if (armL.current) armL.current.rotation.x = armHang - swing * 0.7
    if (armR.current) {
      const aim = stance === 'prone' ? pitchRef.current * 0.35 : pitchRef.current * 0.85
      armR.current.rotation.x = aim - 0.55 + armHang * 0.35 + swing * 0.15 - recoil.current * 0.35
    }
    recoil.current = Math.max(0, recoil.current - delta * 6)
  })

  return (
    <group ref={root}>
      <group ref={pose}>
        <group ref={legL} position={[-0.1 * h, 0.82 * h, 0]}>
          <mesh material={materials.skin} position={[0, -0.28 * h, 0]} castShadow>
            <capsuleGeometry args={[0.07 * h, 0.38 * h, 4, 8]} />
          </mesh>
          <mesh material={materials.skinShadow} position={[0, -0.55 * h, 0.02]} castShadow>
            <boxGeometry args={[0.1 * h, 0.08 * h, 0.16 * h]} />
          </mesh>
        </group>
        <group ref={legR} position={[0.1 * h, 0.82 * h, 0]}>
          <mesh material={materials.skin} position={[0, -0.28 * h, 0]} castShadow>
            <capsuleGeometry args={[0.07 * h, 0.38 * h, 4, 8]} />
          </mesh>
          <mesh material={materials.skinShadow} position={[0, -0.55 * h, 0.02]} castShadow>
            <boxGeometry args={[0.1 * h, 0.08 * h, 0.16 * h]} />
          </mesh>
        </group>

        <group ref={torso} position={[0, 0.92 * h, 0]}>
          {/* Hips / pelvis — non-explicit */}
          <mesh material={materials.skinShadow} position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.34 * h, 0.22 * h, 0.2 * h]} />
          </mesh>
          <mesh material={materials.skin} position={[0, 0.3 * h, 0.02]} castShadow>
            <boxGeometry args={[0.38 * h, 0.42 * h, 0.22 * h]} />
          </mesh>
          <mesh material={materials.skinLight} position={[0, 0.46 * h, 0.04]} castShadow>
            <boxGeometry args={[0.4 * h, 0.18 * h, 0.2 * h]} />
          </mesh>

          {/* Head — back of head faces camera (+Z) */}
          <mesh material={materials.skin} position={[0, 0.7 * h, 0]} castShadow>
            <sphereGeometry args={[0.13 * h, 14, 12]} />
          </mesh>
          <mesh material={materials.hair} position={[0, 0.78 * h, 0.04]} castShadow>
            <sphereGeometry args={[0.135 * h, 12, 10]} />
          </mesh>
          {/* Face looks toward −Z (away from camera) */}
          <mesh material={materials.eye} position={[-0.045 * h, 0.72 * h, -0.1 * h]}>
            <sphereGeometry args={[0.018, 6, 6]} />
          </mesh>
          <mesh material={materials.eye} position={[0.045 * h, 0.72 * h, -0.1 * h]}>
            <sphereGeometry args={[0.018, 6, 6]} />
          </mesh>

          <group ref={armL} position={[-0.24 * h, 0.48 * h, 0]}>
            <mesh material={materials.skin} position={[0, -0.22 * h, 0]} castShadow>
              <capsuleGeometry args={[0.055 * h, 0.32 * h, 4, 8]} />
            </mesh>
          </group>
          <group ref={armR} position={[0.24 * h, 0.48 * h, 0]}>
            <mesh material={materials.skin} position={[0, -0.22 * h, 0]} castShadow>
              <capsuleGeometry args={[0.055 * h, 0.32 * h, 4, 8]} />
            </mesh>
            <group position={[0.02, -0.42 * h, -0.08]} rotation={[0.2, 0, 0]}>
              <mesh material={materials.grip} position={[0, 0.02, 0.02]}>
                <boxGeometry args={[0.04, 0.12, 0.05]} />
              </mesh>
              <mesh material={materials.gun} position={[0, -0.02, -0.12]}>
                <boxGeometry args={[0.035, 0.05, 0.28]} />
              </mesh>
              <group ref={muzzleRef} position={[0, -0.02, -0.28]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
