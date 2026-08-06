import type { ReactElement } from 'react'
import { COLORS, ARENA, OBSTACLES } from '../../constants'

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

export function Arena() {
  const half = ARENA.size / 2
  const t = ARENA.wallThickness
  const h = ARENA.wallHeight
  const tiles: ReactElement[] = []

  const step = 2
  for (let x = -half + 1; x < half; x += step) {
    for (let z = -half + 1; z < half; z += step) {
      tiles.push(
        <WireBox
          key={`floor-${x}-${z}`}
          position={[x, -0.05, z]}
          args={[step * 0.98, 0.1, step * 0.98]}
          color={COLORS.neonGreen}
        />,
      )
    }
  }

  return (
    <group>
      {tiles}

      <WireBox position={[0, h / 2, -half]} args={[ARENA.size + t * 2, h, t]} color={COLORS.white} />
      <WireBox position={[0, h / 2, half]} args={[ARENA.size + t * 2, h, t]} color={COLORS.white} />
      <WireBox position={[-half, h / 2, 0]} args={[t, h, ARENA.size]} color={COLORS.white} />
      <WireBox position={[half, h / 2, 0]} args={[t, h, ARENA.size]} color={COLORS.white} />

      {OBSTACLES.map((o, i) => (
        <WireBox
          key={`obs-${i}`}
          position={[o.x, o.h / 2, o.z]}
          args={[o.w, o.h, o.d]}
          color={i % 2 === 0 ? COLORS.neonGreen : COLORS.white}
        />
      ))}
    </group>
  )
}
