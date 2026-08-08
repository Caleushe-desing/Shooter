import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ARENA } from '../../constants'
import { MAT } from '../../map/materials'
import { useGameStore } from '../../store/gameStore'

function CaptureFlag() {
  const flag = useGameStore((s) => s.map.flag)
  const poleH = 2.8
  return (
    <group position={[flag.x, flag.y, flag.z]}>
      <mesh position={[0, poleH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, poleH, 8]} />
        <meshStandardMaterial color={MAT.flagPole} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.08, 12]} />
        <meshStandardMaterial color={MAT.woodDark} roughness={0.85} />
      </mesh>
      <mesh position={[0.42, poleH - 0.35, 0]} castShadow>
        <boxGeometry args={[0.85, 0.48, 0.04]} />
        <meshStandardMaterial color={MAT.flagRed} roughness={0.75} metalness={0.04} />
      </mesh>
      <mesh position={[0.78, poleH - 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.18, 0.28, 3]} />
        <meshStandardMaterial color={MAT.flagRed} roughness={0.75} metalness={0.04} />
      </mesh>
    </group>
  )
}

/** Soft capture ring painted on the tabletop around the flag. */
function ArenaAccent() {
  const arena = useGameStore((s) => s.map.arena)
  return (
    <group position={[arena.x, arena.floorY + 0.02, arena.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[arena.radius - 0.45, arena.radius, 48]} />
        <meshStandardMaterial
          color={MAT.flagRed}
          roughness={0.7}
          metalness={0.05}
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  )
}

function RoomFloor() {
  const trenches = useGameStore((s) => s.map.trenches)
  const geometry = useMemo(() => {
    const half = ARENA.size * 0.5
    const shape = new THREE.Shape()
    shape.moveTo(-half, -half)
    shape.lineTo(half, -half)
    shape.lineTo(half, half)
    shape.lineTo(-half, half)
    shape.closePath()

    for (const t of trenches) {
      const hw = t.width * 0.5
      const hd = t.depth * 0.5
      const hole = new THREE.Path()
      hole.moveTo(t.x - hw, t.z - hd)
      hole.lineTo(t.x - hw, t.z + hd)
      hole.lineTo(t.x + hw, t.z + hd)
      hole.lineTo(t.x + hw, t.z - hd)
      hole.closePath()
      shape.holes.push(hole)
    }

    const geo = new THREE.ShapeGeometry(shape, 4)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [trenches])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={MAT.floor} roughness={0.92} metalness={0.02} />
    </mesh>
  )
}

function TrenchFloors() {
  const trenches = useGameStore((s) => s.map.trenches)
  return (
    <group>
      {trenches.map((t) => (
        <group key={t.id}>
          <mesh
            position={[t.x, t.floorY + 0.01, t.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[t.width - 0.2, t.depth - 0.2]} />
            <meshStandardMaterial color={t.color} roughness={0.96} />
          </mesh>
          {/* Soft rug border lip */}
          <mesh position={[t.x, 0.02, t.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                Math.min(t.width, t.depth) * 0.35,
                Math.min(t.width, t.depth) * 0.5,
                32,
              ]}
            />
            <meshStandardMaterial color={MAT.rugBorder} roughness={0.95} transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function MergedSolids() {
  const solids = useGameStore((s) => s.map.solids)
  const batches = useMemo(() => {
    const groups = new Map<string, THREE.BufferGeometry[]>()
    for (const s of solids) {
      // Ceiling is a large slab — draw as a separate simple plane for lighting feel.
      if (s.id === 'ceiling') continue
      const geo = new THREE.BoxGeometry(s.width, s.height, s.depth)
      geo.translate(s.x, s.y + s.height * 0.5, s.z)
      const list = groups.get(s.color) ?? []
      list.push(geo)
      groups.set(s.color, list)
    }

    const out: { color: string; geometry: THREE.BufferGeometry }[] = []
    for (const [color, geos] of groups) {
      const merged = mergeGeometries(geos, false)
      for (const g of geos) g.dispose()
      if (merged) out.push({ color, geometry: merged })
    }
    return out
  }, [solids])

  useEffect(() => {
    return () => {
      for (const b of batches) b.geometry.dispose()
    }
  }, [batches])

  return (
    <group>
      {batches.map((b) => (
        <mesh key={b.color} geometry={b.geometry} castShadow receiveShadow>
          <meshStandardMaterial color={b.color} roughness={0.82} metalness={0.04} />
        </mesh>
      ))}
    </group>
  )
}

function RoomCeiling() {
  const y = 16
  const size = ARENA.size - 1
  return (
    <mesh position={[0, y, 0]} receiveShadow>
      <boxGeometry args={[size, 0.35, size]} />
      <meshStandardMaterial color={MAT.ceiling} roughness={0.95} metalness={0.01} />
    </mesh>
  )
}

/** Giant house interior — furniture cover, flag on the dining table. */
export function ProceduralMap() {
  return (
    <group>
      <RoomFloor />
      <TrenchFloors />
      <MergedSolids />
      <RoomCeiling />
      <ArenaAccent />
      <CaptureFlag />
    </group>
  )
}
