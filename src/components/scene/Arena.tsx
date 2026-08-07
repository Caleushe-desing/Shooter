import { useMemo } from 'react'
import { ARENA, COLORS } from '../../constants'
import { buildHavenInspiredMap } from '../../map/havenLayout'

/** Large Haven-inspired blockout: three plazas, mid lane, buildings, outer walls. */
export function Arena() {
  const { props } = useMemo(() => buildHavenInspiredMap(), [])
  const half = ARENA.size / 2
  const visible = props.filter((p) => !p.hidden)

  return (
    <group>
      {/* Base grass beyond plazas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA.size, ARENA.size]} />
        <meshStandardMaterial color={COLORS.grass} roughness={0.92} />
      </mesh>

      {/* Sand plazas — A / Mid / C / B */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-28, 0.02, 0]} receiveShadow>
        <planeGeometry args={[28, 36]} />
        <meshStandardMaterial color={COLORS.sand} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[28, 0.02, 0]} receiveShadow>
        <planeGeometry args={[28, 36]} />
        <meshStandardMaterial color={COLORS.sand} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2]} receiveShadow>
        <planeGeometry args={[18, 52]} />
        <meshStandardMaterial color={COLORS.sand} roughness={0.94} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 30]} receiveShadow>
        <planeGeometry args={[32, 22]} />
        <meshStandardMaterial color={COLORS.sand} roughness={0.95} />
      </mesh>

      {/* Soft edge ring so the outer wall reads against grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[half - 3.5, half - 0.2, 64]} />
        <meshStandardMaterial color={COLORS.stone} roughness={0.9} />
      </mesh>

      {visible.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} castShadow receiveShadow>
          <boxGeometry args={[p.w, p.h, p.d]} />
          <meshStandardMaterial
            color={p.color}
            roughness={p.roughness ?? 0.88}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  )
}
