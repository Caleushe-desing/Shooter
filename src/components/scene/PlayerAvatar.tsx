import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { useWorldStore } from '../../store/worldStore'
import { setMuzzleObject } from '../../store/muzzle'

type PlayerAvatarProps = {
  yawRef: MutableRefObject<number>
  pitchRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

/**
 * Nude adult human colonist (game-appropriate, non-explicit).
 * Mesh faces local -Z. Camera sits on +Z so you see the back.
 */
export function PlayerAvatar({ yawRef, pitchRef, movingRef }: PlayerAvatarProps) {
  const root = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const lastRecoil = useRef(0)
  const recoil = useRef(0)

  const equipped = useWorldStore((s) => s.equipped)
  const h = PLAYER.height

  const materials = useMemo(() => {
    const make = (color: string, roughness = 0.72, metalness = 0) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
      })
    return {
      skin: make(PLAYER.skin, 0.68),
      skinLight: make(PLAYER.skinLight, 0.7),
      skinShadow: make(PLAYER.skinShadow, 0.75),
      hair: make(PLAYER.hair, 0.85),
      eye: new THREE.MeshBasicMaterial({ color: COLORS.enemyEye }),
      cloth: make('#6A5A48', 0.9),
      leather: make('#4A3020', 0.82),
      wool: make('#C8C0B0', 0.88),
      tool: make('#6A6A68', 0.45, 0.35),
      wood: make('#6B4E3A', 0.8),
      gun: make(COLORS.gunMetal, 0.4, 0.45),
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
    if (!root.current) return
    root.current.rotation.y = yawRef.current

    const t = performance.now() * 0.001
    const walk = movingRef.current ? 1 : 0
    const swing = Math.sin(t * 9) * 0.55 * walk
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
    if (armL.current) armL.current.rotation.x = -swing * 0.7
    if (armR.current) {
      const aim = pitchRef.current * 0.85
      armR.current.rotation.x = aim - 0.55 + swing * 0.15 - recoil.current * 0.35
    }
    recoil.current = Math.max(0, recoil.current - delta * 6)
  })

  const hasTorso = !!equipped.torso
  const hasLegs = !!equipped.piernas
  const hasCapa = !!equipped.capa
  const hasBoots = !!equipped.pies
  const tool = equipped.mano

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* Pelvis / hips */}
      <mesh material={materials.skinShadow} position={[0, 0.92 * h, 0]} castShadow>
        <boxGeometry args={[0.34 * h, 0.22 * h, 0.2 * h]} />
      </mesh>

      {/* Torso */}
      <mesh material={materials.skin} position={[0, 1.22 * h, 0.02]} castShadow>
        <boxGeometry args={[0.38 * h, 0.42 * h, 0.22 * h]} />
      </mesh>
      <mesh material={materials.skinLight} position={[0, 1.38 * h, 0.04]} castShadow>
        <boxGeometry args={[0.4 * h, 0.18 * h, 0.2 * h]} />
      </mesh>

      {hasTorso && (
        <mesh material={materials.cloth} position={[0, 1.24 * h, 0.02]} castShadow>
          <boxGeometry args={[0.42 * h, 0.48 * h, 0.26 * h]} />
        </mesh>
      )}
      {hasCapa && (
        <mesh material={materials.wool} position={[0, 1.28 * h, 0.16]} castShadow>
          <boxGeometry args={[0.5 * h, 0.55 * h, 0.06 * h]} />
        </mesh>
      )}

      {/* Head */}
      <mesh material={materials.skin} position={[0, 1.62 * h, 0]} castShadow>
        <sphereGeometry args={[0.13 * h, 14, 12]} />
      </mesh>
      <mesh material={materials.hair} position={[0, 1.7 * h, 0.02]} castShadow>
        <sphereGeometry args={[0.135 * h, 12, 10]} />
      </mesh>
      <mesh material={materials.eye} position={[-0.045 * h, 1.64 * h, -0.1 * h]}>
        <sphereGeometry args={[0.018, 6, 6]} />
      </mesh>
      <mesh material={materials.eye} position={[0.045 * h, 1.64 * h, -0.1 * h]}>
        <sphereGeometry args={[0.018, 6, 6]} />
      </mesh>

      {/* Legs */}
      <group ref={legL} position={[-0.1 * h, 0.82 * h, 0]}>
        <mesh material={hasLegs ? materials.leather : materials.skin} position={[0, -0.28 * h, 0]} castShadow>
          <capsuleGeometry args={[0.07 * h, 0.38 * h, 4, 8]} />
        </mesh>
        <mesh
          material={hasBoots ? materials.leather : materials.skinShadow}
          position={[0, -0.55 * h, 0.02]}
          castShadow
        >
          <boxGeometry args={[0.1 * h, 0.08 * h, 0.16 * h]} />
        </mesh>
      </group>
      <group ref={legR} position={[0.1 * h, 0.82 * h, 0]}>
        <mesh material={hasLegs ? materials.leather : materials.skin} position={[0, -0.28 * h, 0]} castShadow>
          <capsuleGeometry args={[0.07 * h, 0.38 * h, 4, 8]} />
        </mesh>
        <mesh
          material={hasBoots ? materials.leather : materials.skinShadow}
          position={[0, -0.55 * h, 0.02]}
          castShadow
        >
          <boxGeometry args={[0.1 * h, 0.08 * h, 0.16 * h]} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={armL} position={[-0.24 * h, 1.4 * h, 0]}>
        <mesh material={materials.skin} position={[0, -0.22 * h, 0]} castShadow>
          <capsuleGeometry args={[0.055 * h, 0.32 * h, 4, 8]} />
        </mesh>
      </group>
      <group ref={armR} position={[0.24 * h, 1.4 * h, 0]}>
        <mesh material={materials.skin} position={[0, -0.22 * h, 0]} castShadow>
          <capsuleGeometry args={[0.055 * h, 0.32 * h, 4, 8]} />
        </mesh>

        {/* Held tool / hunting implement */}
        <group position={[0.02, -0.42 * h, -0.08]} rotation={[0.2, 0, 0]}>
          {tool === 'pala' ? (
            <>
              <mesh material={materials.wood} position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.02, 0.025, 0.55, 6]} />
              </mesh>
              <mesh material={materials.tool} position={[0, -0.18, -0.02]} rotation={[0.4, 0, 0]}>
                <boxGeometry args={[0.18, 0.04, 0.22]} />
              </mesh>
            </>
          ) : tool === 'herramienta' ? (
            <>
              <mesh material={materials.wood} position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
              </mesh>
              <mesh material={materials.tool} position={[0, -0.14, -0.04]} rotation={[0.6, 0, 0]}>
                <boxGeometry args={[0.08, 0.03, 0.16]} />
              </mesh>
            </>
          ) : (
            <>
              <mesh material={materials.grip} position={[0, 0.02, 0.02]}>
                <boxGeometry args={[0.04, 0.12, 0.05]} />
              </mesh>
              <mesh material={materials.gun} position={[0, -0.02, -0.12]}>
                <boxGeometry args={[0.035, 0.05, 0.28]} />
              </mesh>
            </>
          )}
          <group ref={muzzleRef} position={[0, -0.02, -0.28]} />
        </group>
      </group>
    </group>
  )
}
