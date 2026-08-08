import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ARENA } from '../../constants'
import { FINISH, MAT, finishFor } from '../../map/materials'
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
  const size = ARENA.size - 0.2
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
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
  const y = 14
  const size = ARENA.size - 1
  return (
    <mesh position={[0, y, 0]} receiveShadow>
      <boxGeometry args={[size, 0.3, size]} />
      <meshStandardMaterial
        color={MAT.ceiling}
        roughness={FINISH[MAT.ceiling].roughness}
        metalness={FINISH[MAT.ceiling].metalness}
      />
    </mesh>
  )
}

/** Giant house — table, sofa, bookshelf only. */
export function ProceduralMap() {
  return (
    <group>
      <RoomFloor />
      <MergedSolids />
      <RoomCeiling />
      <ArenaAccent />
      <CaptureFlag />
    </group>
  )
}
