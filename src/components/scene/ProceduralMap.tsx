import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ARENA } from '../../constants'
import { FINISH, MAT, finishFor } from '../../map/materials'
import { ROOM_CEILING_Y } from '../../map/proceduralLayout'
import { useGameStore } from '../../store/gameStore'

function CaptureFlag() {
  const flag = useGameStore((s) => s.map.flag)
  const poleH = 2.4
  return (
    <group position={[flag.x, flag.y, flag.z]}>
      <mesh position={[0, poleH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, poleH, 10]} />
        <meshStandardMaterial
          color={MAT.flagPole}
          roughness={FINISH[MAT.flagPole].roughness}
          metalness={FINISH[MAT.flagPole].metalness}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.06, 12]} />
        <meshStandardMaterial
          color={MAT.woodDark}
          roughness={FINISH[MAT.woodDark].roughness}
          metalness={FINISH[MAT.woodDark].metalness}
        />
      </mesh>
      <mesh position={[0.38, poleH - 0.32, 0]} castShadow>
        <boxGeometry args={[0.78, 0.42, 0.035]} />
        <meshStandardMaterial
          color={MAT.accent}
          roughness={FINISH[MAT.accent].roughness}
          metalness={FINISH[MAT.accent].metalness}
        />
      </mesh>
    </group>
  )
}

/** Quiet capture ring flush on the tabletop. */
function ArenaAccent() {
  const arena = useGameStore((s) => s.map.arena)
  return (
    <group position={[arena.x, arena.floorY + 0.015, arena.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[arena.radius - 0.35, arena.radius, 56]} />
        <meshStandardMaterial
          color={MAT.accentSoft}
          roughness={0.75}
          metalness={0.06}
          transparent
          opacity={0.4}
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
      <meshStandardMaterial
        color={MAT.floor}
        roughness={FINISH[MAT.floor].roughness}
        metalness={FINISH[MAT.floor].metalness}
      />
    </mesh>
  )
}

function MergedSolids() {
  const solids = useGameStore((s) => s.map.solids)
  const batches = useMemo(() => {
    const groups = new Map<string, THREE.BufferGeometry[]>()
    for (const s of solids) {
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
      {batches.map((b) => {
        const finish = finishFor(b.color)
        return (
          <mesh key={b.color} geometry={b.geometry} castShadow receiveShadow>
            <meshStandardMaterial
              color={b.color}
              roughness={finish.roughness}
              metalness={finish.metalness}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function RoomCeiling() {
  const size = ARENA.size - 1
  return (
    <mesh position={[0, ROOM_CEILING_Y, 0]} receiveShadow>
      <boxGeometry args={[size, 0.3, size]} />
      <meshStandardMaterial
        color={MAT.ceiling}
        roughness={FINISH[MAT.ceiling].roughness}
        metalness={FINISH[MAT.ceiling].metalness}
      />
    </mesh>
  )
}

function TrenchFloors() {
  const trenches = useGameStore((s) => s.map.trenches)
  if (trenches.length === 0) return null
  return (
    <group>
      {trenches.map((t) => (
        <mesh
          key={t.id}
          position={[t.x, t.floorY + 0.01, t.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[t.width - 0.15, t.depth - 0.15]} />
          <meshStandardMaterial color={t.color} roughness={0.95} metalness={0.01} />
        </mesh>
      ))}
    </group>
  )
}

/** Giant house — furniture, aerial decks, tunnels, flag table. */
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
