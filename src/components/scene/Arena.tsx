import type { ReactElement } from 'react'
import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, ARENA, OBSTACLES } from '../../constants'
import { WoodCrate } from './WoodCrate'

function WireBox({
  position,
  args,
  color = COLORS.neonGreen,
}: {
  position: [number, number, number]
  args: [number, number, number]
  color?: string
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={color} wireframe />
    </mesh>
  )
}

function SolidFloor() {
  const half = ARENA.size / 2
  const step = 2
  const tiles: ReactElement[] = []

  for (let x = -half + 1; x < half; x += step) {
    for (let z = -half + 1; z < half; z += step) {
      const alt = ((x + half) / step + (z + half) / step) % 2 === 0
      tiles.push(
        <mesh key={`tile-${x}-${z}`} position={[x, -0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[step * 0.98, step * 0.98]} />
          <meshBasicMaterial color={alt ? COLORS.floor : COLORS.floorAlt} />
        </mesh>,
      )
    }
  }

  const grid = useMemo(() => {
    const pts: number[] = []
    for (let i = -half; i <= half; i += step) {
      pts.push(-half, 0.002, i, half, 0.002, i)
      pts.push(i, 0.002, -half, i, 0.002, half)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return geo
  }, [half, step])

  return (
    <group>
      {/* Deep opaque base slab */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ARENA.size + 1, ARENA.size + 1]} />
        <meshBasicMaterial color={COLORS.floor} />
      </mesh>

      {tiles}

      {/* Subtle neon grid overlay */}
      <lineSegments geometry={grid} position={[0, 0, 0]}>
        <lineBasicMaterial color={COLORS.floorGrid} transparent opacity={0.22} />
      </lineSegments>
    </group>
  )
}

export function Arena() {
  const half = ARENA.size / 2
  const t = ARENA.wallThickness
  const h = ARENA.wallHeight

  return (
    <group>
      <SolidFloor />

      <WireBox position={[0, h / 2, -half]} args={[ARENA.size + t * 2, h, t]} color={COLORS.white} />
      <WireBox position={[0, h / 2, half]} args={[ARENA.size + t * 2, h, t]} color={COLORS.white} />
      <WireBox position={[-half, h / 2, 0]} args={[t, h, ARENA.size]} color={COLORS.white} />
      <WireBox position={[half, h / 2, 0]} args={[t, h, ARENA.size]} color={COLORS.white} />

      {OBSTACLES.map((o, i) => (
        <WoodCrate
          key={`crate-${i}`}
          position={[o.x, o.h / 2, o.z]}
          args={[o.w, o.h, o.d]}
        />
      ))}
    </group>
  )
}
