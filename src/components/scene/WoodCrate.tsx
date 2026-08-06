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
  thickness = 0.06,
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
      <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
    </mesh>
  )
}

/**
 * Soft styrofoam / plumavit crate — cream cardboard Sims look, pierceable.
 * Still blocks player movement (collision), but shots punch straight through.
 */
export function WoodCrate({ position, args }: WoodCrateProps) {
  const [w, h, d] = args
  const hw = w / 2
  const hh = h / 2
  const hd = d / 2
  const inset = 0.02

  const faces: [[number, number, number], [number, number, number]][] = [
    [[-hw, -hh, hd], [hw, hh, hd]],
    [[-hw, hh, hd], [hw, -hh, hd]],
    [[-hw, -hh, -hd], [hw, hh, -hd]],
    [[-hw, hh, -hd], [hw, -hh, -hd]],
    [[-hw, -hh, -hd], [-hw, hh, hd]],
    [[-hw, hh, -hd], [-hw, -hh, hd]],
    [[hw, -hh, -hd], [hw, hh, hd]],
    [[hw, hh, -hd], [hw, -hh, hd]],
    [[-hw, hh, -hd], [hw, hh, hd]],
    [[-hw, hh, hd], [hw, hh, -hd]],
  ]

  const bands: [[number, number, number], [number, number, number]][] = [
    [[-hw, 0, -hd], [hw, 0, -hd]],
    [[-hw, 0, hd], [hw, 0, hd]],
    [[-hw, 0, -hd], [-hw, 0, hd]],
    [[hw, 0, -hd], [hw, 0, hd]],
    [[0, -hh, -hd], [0, hh, -hd]],
    [[0, -hh, hd], [0, hh, hd]],
    [[-hw, -hh, 0], [-hw, hh, 0]],
    [[hw, -hh, 0], [hw, hh, 0]],
  ]

  return (
    <group position={position}>
      {/* Soft foam body — lit plastic cardboard */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w - inset, h - inset, d - inset]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.72} metalness={0} />
      </mesh>

      {/* Slightly brighter top */}
      <mesh position={[0, hh - inset * 0.5, 0]}>
        <boxGeometry args={[w - inset * 2, inset, d - inset * 2]} />
        <meshStandardMaterial color={COLORS.woodLight} roughness={0.68} metalness={0} />
      </mesh>

      {/* Soft edge outline */}
      <mesh>
        <boxGeometry args={args} />
        <meshStandardMaterial
          color={COLORS.woodEdge}
          roughness={0.85}
          metalness={0}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Foam seam braces */}
      {faces.map(([from, to], i) => (
        <Brace key={`x-${i}`} from={from} to={to} color={COLORS.woodDark} thickness={0.045} />
      ))}

      {bands.map(([from, to], i) => (
        <Brace key={`b-${i}`} from={from} to={to} color={COLORS.woodDark} thickness={0.04} />
      ))}
    </group>
  )
}
