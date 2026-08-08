import { PLAZA } from '../../map/proceduralLayout'
import { useGameStore } from '../../store/gameStore'

function CaptureFlag() {
  const poleH = 3.2
  return (
    <group position={[0, PLAZA.height, 0]}>
      <mesh position={[0, poleH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, poleH, 8]} />
        <meshStandardMaterial color={PLAZA.flagPoleColor} roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.08, 12]} />
        <meshStandardMaterial color="#2C2C2C" roughness={0.8} />
      </mesh>
      <mesh position={[0.42, poleH - 0.35, 0]} castShadow>
        <boxGeometry args={[0.85, 0.5, 0.04]} />
        <meshStandardMaterial color={PLAZA.flagColor} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0.78, poleH - 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.18, 0.28, 3]} />
        <meshStandardMaterial color={PLAZA.flagColor} roughness={0.7} metalness={0.05} />
      </mesh>
    </group>
  )
}

function CentralPlaza() {
  const plaza = useGameStore((s) => s.map.plaza)
  return (
    <group>
      <mesh position={[0, plaza.height * 0.5, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[plaza.radius, plaza.radius, plaza.height, 48]} />
        <meshStandardMaterial color={plaza.platformColor} roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh position={[0, plaza.height + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[plaza.radius - 0.55, plaza.radius - 0.05, 48]} />
        <meshStandardMaterial color={plaza.ringColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, plaza.height + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 28]} />
        <meshStandardMaterial color="#B7A486" roughness={0.92} />
      </mesh>
      <CaptureFlag />
    </group>
  )
}

function Buildings() {
  const solids = useGameStore((s) => s.map.solids)
  return (
    <group>
      {solids.map((b) => (
        <mesh
          key={b.id}
          position={[b.x, b.height * 0.5, b.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color={b.color} roughness={0.92} metalness={0.03} />
        </mesh>
      ))}
    </group>
  )
}

/** Procedural buildings + King-of-the-Hill plaza / flag at the origin. */
export function ProceduralMap() {
  return (
    <group>
      <CentralPlaza />
      <Buildings />
    </group>
  )
}
