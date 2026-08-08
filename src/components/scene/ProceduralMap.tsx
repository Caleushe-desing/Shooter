import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ARENA } from '../../constants'
import { MAT } from '../../map/materials'
import { useGameStore } from '../../store/gameStore'
import { GalaxySky } from './GalaxySky'
import { RubiksWall } from './RubiksWall'

function CaptureFlag() {
  const flag = useGameStore((s) => s.map.flag)
  const poleH = 3.4
  return (
    <group position={[flag.x, flag.y, flag.z]}>
      <mesh position={[0, poleH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, poleH, 8]} />
        <meshStandardMaterial color={MAT.flagPole} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.32, 0.1, 12]} />
        <meshStandardMaterial color={MAT.stoneDark} roughness={0.85} />
      </mesh>
      <mesh position={[0.45, poleH - 0.4, 0]} castShadow>
        <boxGeometry args={[0.9, 0.52, 0.04]} />
        <meshStandardMaterial color={MAT.flagRed} roughness={0.75} metalness={0.04} />
      </mesh>
      <mesh position={[0.82, poleH - 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.2, 0.3, 3]} />
        <meshStandardMaterial color={MAT.flagRed} roughness={0.75} metalness={0.04} />
      </mesh>
    </group>
  )
}

/** Visual-only circular arena ring (collision uses AABB solids from the layout). */
function ArenaAccent() {
  const arena = useGameStore((s) => s.map.arena)
  return (
    <group position={[arena.x, arena.floorY, arena.z]}>
      <mesh position={[0, 0.13, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[arena.radius, arena.radius, 0.22, 40]} />
        <meshStandardMaterial color={MAT.arenaSand} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[arena.radius - 0.35, arena.radius + 0.15, 40]} />
        <meshStandardMaterial color={MAT.arenaStone} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.42, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.2, 0.3, 24]} />
        <meshStandardMaterial color={MAT.stoneLight} roughness={0.86} />
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

    const geo = new THREE.ShapeGeometry(shape, 8)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [trenches])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={MAT.grass} roughness={0.97} metalness={0.01} />
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

/**
 * Merge solid boxes by color into few draw calls while keeping
 * per-solid AABBs in the store for precise collision.
 */
function MergedSolids() {
  const solids = useGameStore((s) => s.map.solids)
  const batches = useMemo(() => {
    const groups = new Map<string, THREE.BufferGeometry[]>()
    for (const s of solids) {
      // Rubik perimeter is drawn by InstancedMesh; keep AABBs for collision only.
      if (s.id.includes('rubik')) continue
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
          <meshStandardMaterial color={b.color} roughness={0.9} metalness={0.04} />
        </mesh>
      ))}
    </group>
  )
}

/** Fortified settlement + Rubik perimeter + galaxy sky. */
export function ProceduralMap() {
  return (
    <group>
      <GalaxySky />
      <GroundWithTrenches />
      <TrenchFloors />
      <MergedSolids />
      <RubiksWall />
      <ArenaAccent />
      <CaptureFlag />
    </group>
  )
}
