import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, COMBAT } from '../../constants'
import { useGameStore } from '../../store/gameStore'

export function Tracers() {
  const tracers = useGameStore((s) => s.tracers)

  useFrame((_, delta) => {
    const now = performance.now()
    useGameStore.getState().updateTracers(Math.min(delta, 0.05), now)
  })

  return (
    <group>
      {tracers.map((t) => (
        <TracerMesh key={t.id} {...t} />
      ))}
    </group>
  )
}

function TracerMesh({
  origin,
  direction,
  distance,
}: {
  origin: [number, number, number]
  direction: [number, number, number]
  distance: number
}) {
  const quat = useMemo(() => {
    const dir = new THREE.Vector3(...direction)
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    return q
  }, [direction])

  const pos = useMemo(() => {
    return [
      origin[0] + direction[0] * distance,
      origin[1] + direction[1] * distance,
      origin[2] + direction[2] * distance,
    ] as [number, number, number]
  }, [origin, direction, distance])

  return (
    <group position={pos} quaternion={quat}>
      {/* Bright core */}
      <mesh>
        <cylinderGeometry args={[COMBAT.tracerRadius * 0.45, COMBAT.tracerRadius * 0.35, COMBAT.tracerLength, 6]} />
        <meshBasicMaterial color={COLORS.tracer} />
      </mesh>
      {/* Wireframe glow shell */}
      <mesh>
        <cylinderGeometry args={[COMBAT.tracerRadius, COMBAT.tracerRadius * 0.8, COMBAT.tracerLength * 1.05, 6]} />
        <meshBasicMaterial color={COLORS.tracer} wireframe transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
