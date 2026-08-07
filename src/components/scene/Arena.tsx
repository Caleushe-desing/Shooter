import { ARENA, COLORS } from '../../constants'

/** Small patio: floor + 4 walls. */
export function Arena() {
  const half = ARENA.size / 2
  const t = ARENA.wallThickness
  const h = ARENA.wallHeight

  const walls = [
    { pos: [0, h / 2, -half - t / 2] as const, size: [ARENA.size + t * 2, h, t] as const },
    { pos: [0, h / 2, half + t / 2] as const, size: [ARENA.size + t * 2, h, t] as const },
    { pos: [-half - t / 2, h / 2, 0] as const, size: [t, h, ARENA.size] as const },
    { pos: [half + t / 2, h / 2, 0] as const, size: [t, h, ARENA.size] as const },
  ]

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA.size, ARENA.size]} />
        <meshStandardMaterial color={COLORS.grass} roughness={0.92} />
      </mesh>

      {walls.map((w, i) => (
        <mesh key={i} position={[...w.pos]} castShadow receiveShadow>
          <boxGeometry args={[...w.size]} />
          <meshStandardMaterial color={COLORS.wall} roughness={0.88} />
        </mesh>
      ))}

      {walls.map((w, i) => (
        <mesh key={`cap-${i}`} position={[w.pos[0], h + 0.08, w.pos[2]]}>
          <boxGeometry args={[w.size[0] + 0.08, 0.16, w.size[2] + 0.08]} />
          <meshStandardMaterial color={COLORS.wallCap} roughness={0.75} />
        </mesh>
      ))}
    </group>
  )
}
