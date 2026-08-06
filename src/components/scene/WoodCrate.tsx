import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '../../constants'

type WoodCrateProps = {
  position: [number, number, number]
  args: [number, number, number]
}

function makeCrateLines(w: number, h: number, d: number): Float32Array {
  const hw = w / 2
  const hh = h / 2
  const hd = d / 2
  const pts: number[] = []

  const push = (a: number[], b: number[]) => {
    pts.push(a[0], a[1], a[2], b[0], b[1], b[2])
  }

  // Outer box edges
  const c = [
    [-hw, -hh, -hd],
    [hw, -hh, -hd],
    [hw, -hh, hd],
    [-hw, -hh, hd],
    [-hw, hh, -hd],
    [hw, hh, -hd],
    [hw, hh, hd],
    [-hw, hh, hd],
  ] as number[][]

  // Bottom
  push(c[0], c[1]); push(c[1], c[2]); push(c[2], c[3]); push(c[3], c[0])
  // Top
  push(c[4], c[5]); push(c[5], c[6]); push(c[6], c[7]); push(c[7], c[4])
  // Verticals
  push(c[0], c[4]); push(c[1], c[5]); push(c[2], c[6]); push(c[3], c[7])

  // Mid reinforcement bands (horizontal)
  push([-hw, 0, -hd], [hw, 0, -hd])
  push([-hw, 0, hd], [hw, 0, hd])
  push([-hw, 0, -hd], [-hw, 0, hd])
  push([hw, 0, -hd], [hw, 0, hd])

  // Vertical mid bands
  push([0, -hh, -hd], [0, hh, -hd])
  push([0, -hh, hd], [0, hh, hd])
  push([-hw, -hh, 0], [-hw, hh, 0])
  push([hw, -hh, 0], [hw, hh, 0])

  // Classic X braces on each face
  // Front (+Z)
  push([-hw, -hh, hd], [hw, hh, hd])
  push([-hw, hh, hd], [hw, -hh, hd])
  // Back (-Z)
  push([-hw, -hh, -hd], [hw, hh, -hd])
  push([-hw, hh, -hd], [hw, -hh, -hd])
  // Left (-X)
  push([-hw, -hh, -hd], [-hw, hh, hd])
  push([-hw, hh, -hd], [-hw, -hh, hd])
  // Right (+X)
  push([hw, -hh, -hd], [hw, hh, hd])
  push([hw, hh, -hd], [hw, -hh, hd])
  // Top (+Y)
  push([-hw, hh, -hd], [hw, hh, hd])
  push([-hw, hh, hd], [hw, hh, -hd])
  // Bottom (-Y)
  push([-hw, -hh, -hd], [hw, -hh, hd])
  push([-hw, -hh, hd], [hw, -hh, -hd])

  return new Float32Array(pts)
}

/**
 * Wireframe wooden shipping crate with crossed face braces and banding.
 */
export function WoodCrate({ position, args }: WoodCrateProps) {
  const [w, h, d] = args

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(makeCrateLines(w, h, d), 3))
    return geo
  }, [w, h, d])

  return (
    <group position={position}>
      {/* Soft fill so crates read as solid volumes */}
      <mesh>
        <boxGeometry args={[w * 0.98, h * 0.98, d * 0.98]} />
        <meshBasicMaterial color={COLORS.wood} transparent opacity={0.08} />
      </mesh>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={COLORS.wood} />
      </lineSegments>
      {/* Slightly darker outline box for depth */}
      <mesh>
        <boxGeometry args={args} />
        <meshBasicMaterial color={COLORS.woodDark} wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  )
}
