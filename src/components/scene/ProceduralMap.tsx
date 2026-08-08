import { useMemo } from 'react'
import * as THREE from 'three'
import { ARENA, COLORS } from '../../constants'
import { useGameStore } from '../../store/gameStore'

const FLAG_POLE = '#3A3A3A'
const FLAG_COLOR = '#D94A3D'

function CaptureFlag() {
  const flag = useGameStore((s) => s.map.flag)
  const poleH = 3.2
  return (
    <group position={[flag.x, flag.y, flag.z]}>
      <mesh position={[0, poleH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, poleH, 8]} />
        <meshStandardMaterial color={FLAG_POLE} roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.08, 12]} />
        <meshStandardMaterial color="#2C2C2C" roughness={0.8} />
      </mesh>
      <mesh position={[0.42, poleH - 0.35, 0]} castShadow>
        <boxGeometry args={[0.85, 0.5, 0.04]} />
        <meshStandardMaterial color={FLAG_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0.78, poleH - 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.18, 0.28, 3]} />
        <meshStandardMaterial color={FLAG_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Rooftop capture pad accent */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.7, 36]} />
        <meshStandardMaterial color="#C4A574" roughness={0.85} />
      </mesh>
    </group>
  )
}

function GroundWithTrenches() {
  const trenches = useGameStore((s) => s.map.trenches)
  const geometry = useMemo(() => {
    const half = ARENA.size * 0.5
    const shape = new THREE.Shape()
    shape.moveTo(-half, -half)
    shape.lineTo(half, -half)
    shape.lineTo(half, half)
    shape.lineTo(-half, half)
    shape.lineTo(-half, -half)

    for (const t of trenches) {
      const hw = t.width * 0.5
      const hd = t.depth * 0.5
      // Opposite winding to the outer shape so ShapeGeometry cuts a hole.
      const hole = new THREE.Path()
      hole.moveTo(t.x - hw, t.z - hd)
      hole.lineTo(t.x - hw, t.z + hd)
      hole.lineTo(t.x + hw, t.z + hd)
      hole.lineTo(t.x + hw, t.z - hd)
      hole.lineTo(t.x - hw, t.z - hd)
      shape.holes.push(hole)
    }

    const geo = new THREE.ShapeGeometry(shape, 12)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [trenches])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={COLORS.ground} roughness={0.95} metalness={0.02} />
    </mesh>
  )
}

function TrenchFloors() {
  const trenches = useGameStore((s) => s.map.trenches)
  return (
    <group>
      {trenches.map((t) => (
        <mesh
          key={t.id}
          position={[t.x, t.floorY + 0.01, t.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[t.width - 0.5, t.depth - 0.5]} />
          <meshStandardMaterial color={t.color} roughness={0.98} />
        </mesh>
      ))}
    </group>
  )
}

function Solids() {
  const solids = useGameStore((s) => s.map.solids)
  return (
    <group>
      {solids.map((b) => (
        <mesh
          key={b.id}
          position={[b.x, b.y + b.height * 0.5, b.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color={b.color} roughness={0.9} metalness={0.03} />
        </mesh>
      ))}
    </group>
  )
}

/** Vertical training field: trenches, crates, HQ tower, rooftop flag. */
export function ProceduralMap() {
  return (
    <group>
      <GroundWithTrenches />
      <TrenchFloors />
      <Solids />
      <CaptureFlag />
    </group>
  )
}
