import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '../../constants'

type WoodCrateProps = {
  position: [number, number, number]
  args: [number, number, number]
}

function Brace({
  from,
  to,
  color,
  thickness = 0.045,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
  thickness?: number
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = new THREE.Vector3().subVectors(b, a)
    const length = dir.length()
    const position = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    )
    return { position, quaternion, length }
  }, [from, to])

  return (
    <mesh position={position} quaternion={quaternion}>
      <boxGeometry args={[thickness, length, thickness]} />
      <meshBasicMaterial color={color} wireframe />
    </mesh>
  )
}

/**
 * Wireframe wooden shipping crate with crossed face braces and banding.
 */
export function WoodCrate({ position, args }: WoodCrateProps) {
  const [w, h, d] = args
  const hw = w / 2
  const hh = h / 2
  const hd = d / 2
  const wood = COLORS.wood
  const dark = COLORS.woodDark

  const faces: [ [number, number, number], [number, number, number] ][] = [
    // Front (+Z) X
    [[-hw, -hh, hd], [hw, hh, hd]],
    [[-hw, hh, hd], [hw, -hh, hd]],
    // Back (-Z) X
    [[-hw, -hh, -hd], [hw, hh, -hd]],
    [[-hw, hh, -hd], [hw, -hh, -hd]],
    // Left (-X) X
    [[-hw, -hh, -hd], [-hw, hh, hd]],
    [[-hw, hh, -hd], [-hw, -hh, hd]],
    // Right (+X) X
    [[hw, -hh, -hd], [hw, hh, hd]],
    [[hw, hh, -hd], [hw, -hh, hd]],
    // Top X
    [[-hw, hh, -hd], [hw, hh, hd]],
    [[-hw, hh, hd], [hw, hh, -hd]],
  ]

  const bands: [ [number, number, number], [number, number, number] ][] = [
    // Horizontal mid bands
    [[-hw, 0, -hd], [hw, 0, -hd]],
    [[-hw, 0, hd], [hw, 0, hd]],
    [[-hw, 0, -hd], [-hw, 0, hd]],
    [[hw, 0, -hd], [hw, 0, hd]],
    // Vertical mid bands
    [[0, -hh, -hd], [0, hh, -hd]],
    [[0, -hh, hd], [0, hh, hd]],
    [[-hw, -hh, 0], [-hw, hh, 0]],
    [[hw, -hh, 0], [hw, hh, 0]],
  ]

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w * 0.97, h * 0.97, d * 0.97]} />
        <meshBasicMaterial color={wood} transparent opacity={0.1} />
      </mesh>

      <mesh>
        <boxGeometry args={args} />
        <meshBasicMaterial color={dark} wireframe />
      </mesh>

      {faces.map(([from, to], i) => (
        <Brace key={`x-${i}`} from={from} to={to} color={wood} thickness={0.05} />
      ))}

      {bands.map(([from, to], i) => (
        <Brace key={`b-${i}`} from={from} to={to} color={dark} thickness={0.04} />
      ))}
    </group>
  )
}
