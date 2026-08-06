import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, type Fragment } from '../../store/gameStore'

export function Explosions() {
  const explosions = useGameStore((s) => s.explosions)

  useFrame((_, delta) => {
    useGameStore.getState().updateExplosions(Math.min(delta, 0.05), performance.now())
  })

  return (
    <group>
      {explosions.map((boom) =>
        boom.fragments.map((f) => <FragmentMesh key={f.id} fragment={f} />),
      )}
    </group>
  )
}

function FragmentMesh({ fragment }: { fragment: Fragment }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += fragment.spin[0] * delta
    ref.current.rotation.y += fragment.spin[1] * delta
    ref.current.rotation.z += fragment.spin[2] * delta

    const age = (performance.now() - fragment.born) / 1000
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = Math.max(0, 1 - age / 0.85)
  })

  return (
    <mesh ref={ref} position={fragment.position}>
      <boxGeometry args={[fragment.size, fragment.size, fragment.size]} />
      <meshBasicMaterial color={fragment.color} wireframe transparent opacity={1} />
    </mesh>
  )
}
