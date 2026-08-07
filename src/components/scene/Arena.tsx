import { useMemo } from 'react'
import { ARENA, COLORS, OBSTACLES } from '../../constants'
import { getGrassTexture, getBrickTexture } from '../../scene/textures'
import { WoodCrate } from './WoodCrate'

/**
 * Small boxed patio: flat floor, 4 walls, wooden crates in varied spots.
 */
export function Arena() {
  const half = ARENA.size / 2
  const t = ARENA.wallThickness
  const h = ARENA.wallHeight

  const floorMap = useMemo(() => {
    const map = getGrassTexture().clone()
    map.needsUpdate = true
    map.repeat.set(10, 10)
    return map
  }, [])

  const brickMap = useMemo(() => {
    const map = getBrickTexture().clone()
    map.needsUpdate = true
    map.repeat.set(6, 2)
    return map
  }, [])

  const walls = [
    { pos: [0, h / 2, -half - t / 2] as [number, number, number], size: [ARENA.size + t * 2, h, t] as [number, number, number] },
    { pos: [0, h / 2, half + t / 2] as [number, number, number], size: [ARENA.size + t * 2, h, t] as [number, number, number] },
    { pos: [-half - t / 2, h / 2, 0] as [number, number, number], size: [t, h, ARENA.size] as [number, number, number] },
    { pos: [half + t / 2, h / 2, 0] as [number, number, number], size: [t, h, ARENA.size] as [number, number, number] },
  ]

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA.size, ARENA.size]} />
        <meshStandardMaterial map={floorMap} color="#8FBF6A" roughness={0.92} metalness={0} />
      </mesh>

      {/* Soft inner patio rug near spawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4]} receiveShadow>
        <circleGeometry args={[3.2, 28]} />
        <meshStandardMaterial color="#C8E090" roughness={0.88} metalness={0} />
      </mesh>

      {/* Four walls */}
      {walls.map((w, i) => (
        <mesh key={`wall-${i}`} position={w.pos} castShadow receiveShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial map={brickMap} color={COLORS.brick} roughness={0.88} metalness={0} />
        </mesh>
      ))}

      {/* Wall caps */}
      {walls.map((w, i) => (
        <mesh key={`cap-${i}`} position={[w.pos[0], h + 0.08, w.pos[2]]}>
          <boxGeometry args={[w.size[0] + 0.08, 0.16, w.size[2] + 0.08]} />
          <meshStandardMaterial color={COLORS.wallCap} roughness={0.75} metalness={0} />
        </mesh>
      ))}

      {/* Wooden crates */}
      {OBSTACLES.map((o, i) => (
        <WoodCrate
          key={`crate-${i}`}
          position={[o.x, o.h / 2, o.z]}
          args={[o.w, o.h, o.d]}
        />
      ))}

      {/* Loose lumber planks on the ground */}
      {[
        { x: -2.2, z: -4.5, yaw: 0.4 },
        { x: 3.5, z: 3.8, yaw: -0.7 },
        { x: -4.0, z: 5.5, yaw: 1.1 },
      ].map((p, i) => (
        <mesh
          key={`plank-${i}`}
          position={[p.x, 0.06, p.z]}
          rotation={[-0.05, p.yaw, 0.02]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.8, 0.1, 0.35]} />
          <meshStandardMaterial color={COLORS.wood} roughness={0.85} metalness={0} />
        </mesh>
      ))}
    </group>
  )
}
