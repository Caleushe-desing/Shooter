import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COMBAT } from '../../constants'
import { useGameStore, type PlateData } from '../../store/gameStore'
import { setLivePlatePosition, clearLivePlatePosition } from '../../store/platePositions'
import { registerPlateTarget, unregisterPlateTarget } from '../../store/plateTargets'

export function Plates() {
  const plates = useGameStore((s) => s.plates)

  useFrame(() => {
    useGameStore.getState().revealPlates(performance.now())
  })

  return (
    <group>
      {plates
        .filter((p) => p.visible)
        .map((p) => (
          <PlateMesh key={p.id} plate={p} />
        ))}
    </group>
  )
}

function PlateMesh({ plate }: { plate: PlateData }) {
  const ref = useRef<THREE.Group>(null)
  const baseY = plate.position[1]

  useEffect(() => {
    const g = ref.current
    if (!g) return
    g.userData.plateId = plate.id
    registerPlateTarget(plate.id, g)
    return () => {
      unregisterPlateTarget(plate.id)
      clearLivePlatePosition(plate.id)
    }
  }, [plate.id])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const y = baseY + Math.sin(t * 1.4 + plate.phase) * 0.28
    ref.current.position.y = y
    ref.current.rotation.y = t * 0.6 + plate.phase
    ref.current.rotation.x = Math.sin(t * 0.8 + plate.phase) * 0.15
    setLivePlatePosition(plate.id, plate.position[0], y, plate.position[2])
  })

  return (
    <group ref={ref} position={plate.position} userData={{ plateId: plate.id }}>
      {/* Solid hit volume (invisible) for reliable raycasting */}
      <mesh userData={{ plateId: plate.id }}>
        <sphereGeometry args={[COMBAT.plateRadius + COMBAT.plateHitPadding * 0.5, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} userData={{ plateId: plate.id }}>
        <cylinderGeometry
          args={[COMBAT.plateRadius, COMBAT.plateRadius, COMBAT.plateThickness, 16]}
        />
        <meshBasicMaterial color={plate.color} wireframe />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[COMBAT.plateRadius * 0.55, 0.02, 4, 16]} />
        <meshBasicMaterial color={plate.color} wireframe />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} userData={{ plateId: plate.id }}>
        <circleGeometry args={[COMBAT.plateRadius * 0.92, 16]} />
        <meshBasicMaterial
          color={plate.color}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
