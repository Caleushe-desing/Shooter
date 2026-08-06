import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../../constants'
import { useGameStore, type PierceHole } from '../../store/gameStore'

/**
 * Persistent (soft) bullet holes on styrofoam crates after a pierce.
 */
export function PierceHoles() {
  const holes = useGameStore((s) => s.pierceHoles)

  useFrame(() => {
    useGameStore.getState().prunePierceHoles(performance.now())
  })

  return (
    <group>
      {holes.map((h) => (
        <HoleDecal key={h.id} hole={h} />
      ))}
    </group>
  )
}

function HoleDecal({ hole }: { hole: PierceHole }) {
  const ref = useRef<THREE.Mesh>(null)
  const quat = useMemo(() => {
    const n = new THREE.Vector3(...hole.normal)
    if (n.lengthSq() < 1e-6) n.set(0, 0, 1)
    else n.normalize()
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)
    return q
  }, [hole.normal])

  useFrame(() => {
    if (!ref.current) return
    const age = (performance.now() - hole.born) / 1000
    const mat = ref.current.material as THREE.MeshBasicMaterial
    // Stay solid for a while, then soft fade.
    mat.opacity = age < 8 ? 0.95 : Math.max(0, 0.95 * (1 - (age - 8) / 4))
  })

  return (
    <mesh ref={ref} position={hole.position} quaternion={quat}>
      <circleGeometry args={[0.07, 12]} />
      <meshBasicMaterial
        color={COLORS.foamHole}
        transparent
        opacity={0.95}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
