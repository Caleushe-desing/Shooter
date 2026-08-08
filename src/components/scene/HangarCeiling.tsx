import { useMemo } from 'react'
import { HANGAR } from '../../map/hangar'
import { MAT } from '../../map/materials'
import { rubikOuterHalf } from '../../map/rubiksWall'

const PANEL_GAP = 14

/** Closed hangar roof that fully covers past the Rubik perimeter — no edge gap. */
export function HangarCeiling() {
  const outer = rubikOuterHalf()
  // Overhang past the outer cube faces so the wall butts into / under the slab.
  const size = outer * 2 + 2
  const ceilingY = HANGAR.ceilingY

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
      <mesh position={[0, ceilingY, 0]} receiveShadow>
        <boxGeometry args={[size, HANGAR.thickness, size]} />
        <meshStandardMaterial color={MAT.hangar} roughness={0.72} metalness={0.1} />
      </mesh>

      {/* Edge skirt under the ceiling rim — seals any remaining seam against the wall. */}
      {(
        [
          [0, outer - 0.2, size, 0.9],
          [0, -(outer - 0.2), size, 0.9],
          [outer - 0.2, 0, 0.9, size - 1.6],
          [-(outer - 0.2), 0, 0.9, size - 1.6],
        ] as const
      ).map(([x, z, w, d], i) => (
        <mesh key={`skirt-${i}`} position={[x, ceilingY - HANGAR.thickness * 0.5 - 0.35, z]}>
          <boxGeometry args={[w, 0.9, d]} />
          <meshStandardMaterial color={MAT.hangarBeam} roughness={0.65} metalness={0.15} />
        </mesh>
      ))}

      {[-20, 0, 20].map((z) => (
        <mesh key={`bz${z}`} position={[0, ceilingY - 0.4, z]}>
          <boxGeometry args={[size - 6, 0.4, 0.5]} />
          <meshStandardMaterial color={MAT.hangarBeam} roughness={0.6} metalness={0.18} />
        </mesh>
      ))}
      {[-20, 0, 20].map((x) => (
        <mesh key={`bx${x}`} position={[x, ceilingY - 0.4, 0]}>
          <boxGeometry args={[0.5, 0.4, size - 6]} />
          <meshStandardMaterial color={MAT.hangarBeam} roughness={0.6} metalness={0.18} />
        </mesh>
      ))}

      {panels.map((p, i) => (
        <group key={`led-${i}`} position={[p.x, ceilingY - 0.5, p.z]}>
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
