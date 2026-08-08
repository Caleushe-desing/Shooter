import { useMemo } from 'react'
import { ARENA } from '../../constants'
import { MAT } from '../../map/materials'

const CEILING_Y = 22
const PANEL_GAP = 14

/** Closed hangar roof with LED panels and even artificial fill lighting. */
export function HangarCeiling() {
  const size = ARENA.size + 6
  const panels = useMemo(() => {
    const half = size * 0.5 - 8
    const list: { x: number; z: number }[] = []
    for (let x = -half; x <= half + 0.01; x += PANEL_GAP) {
      for (let z = -half; z <= half + 0.01; z += PANEL_GAP) {
        list.push({ x, z })
      }
    }
    return list
  }, [size])

  return (
    <group>
      <mesh position={[0, CEILING_Y, 0]} receiveShadow>
        <boxGeometry args={[size, 0.55, size]} />
        <meshStandardMaterial color={MAT.hangar} roughness={0.72} metalness={0.1} />
      </mesh>

      {[-20, 0, 20].map((z) => (
        <mesh key={`bz${z}`} position={[0, CEILING_Y - 0.4, z]}>
          <boxGeometry args={[size - 4, 0.4, 0.5]} />
          <meshStandardMaterial color={MAT.hangarBeam} roughness={0.6} metalness={0.18} />
        </mesh>
      ))}
      {[-20, 0, 20].map((x) => (
        <mesh key={`bx${x}`} position={[x, CEILING_Y - 0.4, 0]}>
          <boxGeometry args={[0.5, 0.4, size - 4]} />
          <meshStandardMaterial color={MAT.hangarBeam} roughness={0.6} metalness={0.18} />
        </mesh>
      ))}

      {panels.map((p, i) => (
        <group key={`led-${i}`} position={[p.x, CEILING_Y - 0.5, p.z]}>
          <mesh>
            <boxGeometry args={[4.2, 0.1, 2.4]} />
            <meshStandardMaterial
              color={MAT.led}
              emissive="#eef6ff"
              emissiveIntensity={1.6}
              roughness={0.3}
              metalness={0.04}
            />
          </mesh>
          <pointLight intensity={22} distance={32} decay={2} color="#fff8ee" />
        </group>
      ))}
    </group>
  )
}
