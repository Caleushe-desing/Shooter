import { ARENA, COLORS } from '../../constants'

/** Open patio floor — no walls. */
export function Arena() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA.size, ARENA.size]} />
        <meshStandardMaterial color={COLORS.grass} roughness={0.92} />
      </mesh>
    </group>
  )
}
