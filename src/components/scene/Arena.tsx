import type { ReactElement } from 'react'
import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, ARENA, OBSTACLES } from '../../constants'
import { WoodCrate } from './WoodCrate'

/**
 * Opaque solid wall box — fully opaque faces, optional neon edge silhouette.
 * No wireframe / transparency on the solid volume.
 */
function SolidWall({
  position,
  args,
  color = COLORS.wall,
  edgeColor = COLORS.wallEdge,
}: {
  position: [number, number, number]
  args: [number, number, number]
  color?: string
  edgeColor?: string
}) {
  const [w, h, d] = args
  const edges = useMemo(() => {
    const geo = new THREE.BoxGeometry(w, h, d)
    const edgeGeo = new THREE.EdgesGeometry(geo, 15)
    geo.dispose()
    return edgeGeo
  }, [w, h, d])

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={edgeColor} toneMapped={false} />
      </lineSegments>
    </group>
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
          <meshBasicMaterial color={alt ? COLORS.floor : COLORS.floorAlt} toneMapped={false} />
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
      {/* Deep opaque base slab — solid map delimiter */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ARENA.size + 1, ARENA.size + 1]} />
        <meshBasicMaterial color={COLORS.floor} toneMapped={false} />
      </mesh>

      {tiles}

      {/* Subtle neon grid overlay (arcade accent only; floor faces stay opaque) */}
      <lineSegments geometry={grid} position={[0, 0, 0]}>
        <lineBasicMaterial color={COLORS.floorGrid} transparent opacity={0.22} toneMapped={false} />
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

      {/* Opaque perimeter walls — solid map bounds */}
      <SolidWall
        position={[0, h / 2, -half]}
        args={[ARENA.size + t * 2, h, t]}
        color={COLORS.wall}
      />
      <SolidWall
        position={[0, h / 2, half]}
        args={[ARENA.size + t * 2, h, t]}
        color={COLORS.wallAlt}
      />
      <SolidWall
        position={[-half, h / 2, 0]}
        args={[t, h, ARENA.size]}
        color={COLORS.wall}
      />
      <SolidWall
        position={[half, h / 2, 0]}
        args={[t, h, ARENA.size]}
        color={COLORS.wallAlt}
      />

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
