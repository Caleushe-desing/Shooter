import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PORTAL } from '../../constants'
import { useGameStore } from '../../store/gameStore'

/**
 * Stone jail cell at map center with a prisoner to rescue.
 * Enemy reinforcements still emerge from the doorway (PORTAL coords).
 */
export function PrisonCell() {
  const prisoner = useRef<THREE.Group>(null)
  const doorRef = useRef<THREE.Mesh>(null)
  const doorOpen = useRef(false)
  const rescued = useGameStore((s) => s.prisonerRescued)

  const barMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2A2A2E',
        metalness: 0.75,
        roughness: 0.35,
      }),
    [],
  )
  const stoneMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6A6560',
        roughness: 0.92,
        metalness: 0.05,
      }),
    [],
  )

  useFrame((_, dt) => {
    const game = useGameStore.getState()

    if (!game.prisonerRescued && game.status === 'playing') {
      const dx = game.playerX - PORTAL.x
      const dz = game.playerZ - (PORTAL.z + PORTAL.radius * 0.55)
      if (Math.hypot(dx, dz) < 2.4) game.rescuePrisoner()
    }

    if (game.prisonerRescued) doorOpen.current = true
    if (doorRef.current && doorOpen.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(
        doorRef.current.rotation.y,
        -1.35,
        4,
        dt,
      )
    }

    if (!prisoner.current) return
    if (game.prisonerRescued) {
      const tx = game.playerX - PORTAL.x
      const tz = game.playerZ - PORTAL.z + 1.15
      prisoner.current.position.x = THREE.MathUtils.damp(prisoner.current.position.x, tx, 2.2, dt)
      prisoner.current.position.z = THREE.MathUtils.damp(prisoner.current.position.z, tz, 2.2, dt)
      prisoner.current.position.y = 0.9
    } else {
      prisoner.current.position.set(0, 0.9 + Math.sin(performance.now() * 0.002) * 0.03, -0.35)
    }
  })

  const R = PORTAL.radius
  const wallH = 3.2
  const wallT = 0.35

  return (
    <group position={[PORTAL.x, 0, PORTAL.z]}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[R * 2.2, 0.08, R * 2.2]} />
        <meshStandardMaterial color="#4A4540" roughness={0.95} />
      </mesh>

      <mesh position={[0, wallH / 2, -R]} castShadow material={stoneMat}>
        <boxGeometry args={[R * 2.1, wallH, wallT]} />
      </mesh>
      <mesh position={[-R, wallH / 2, 0]} castShadow material={stoneMat}>
        <boxGeometry args={[wallT, wallH, R * 2.1]} />
      </mesh>
      <mesh position={[R, wallH / 2, 0]} castShadow material={stoneMat}>
        <boxGeometry args={[wallT, wallH, R * 2.1]} />
      </mesh>

      <mesh position={[-R * 0.55, wallH / 2, R]} castShadow material={stoneMat}>
        <boxGeometry args={[R * 0.9, wallH, wallT]} />
      </mesh>
      <mesh position={[R * 0.55, wallH / 2, R]} castShadow material={stoneMat}>
        <boxGeometry args={[R * 0.9, wallH, wallT]} />
      </mesh>
      <mesh position={[0, wallH - 0.35, R]} castShadow material={stoneMat}>
        <boxGeometry args={[R * 1.15, 0.7, wallT]} />
      </mesh>

      <mesh ref={doorRef} position={[-0.55, wallH * 0.45, R + 0.05]} castShadow material={barMat}>
        <boxGeometry args={[1.1, wallH * 0.85, 0.08]} />
      </mesh>

      {[-0.9, -0.55, 0.55, 0.9].map((x, i) => (
        <mesh key={i} position={[x, wallH * 0.45, R + 0.02]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, wallH * 0.9, 6]} />
          <meshStandardMaterial color="#222226" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      <mesh position={[0, wallH + 0.12, 0]} castShadow>
        <boxGeometry args={[R * 2.25, 0.25, R * 2.25]} />
        <meshStandardMaterial color="#3A3530" roughness={0.9} />
      </mesh>

      <pointLight
        color="#E8C070"
        intensity={rescued ? 1.35 : 0.7}
        distance={8}
        position={[0, 2.4, 0]}
      />

      <group ref={prisoner} position={[0, 0.9, -0.35]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.22, 0.55, 4, 8]} />
          <meshStandardMaterial color="#5A4A68" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshStandardMaterial color="#D2A88A" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow>
          <sphereGeometry args={[0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#2A2220" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.35, 0]} castShadow>
          <coneGeometry args={[0.38, 0.55, 10]} />
          <meshStandardMaterial color="#4A3A58" roughness={0.88} />
        </mesh>
      </group>

      {!rescued && (
        <mesh position={[0, wallH + 0.55, R + 0.2]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#F2E08A" />
        </mesh>
      )}
    </group>
  )
}
