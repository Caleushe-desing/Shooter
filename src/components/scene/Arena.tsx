import { useMemo } from 'react'
import { ARENA, COLORS, OBSTACLES } from '../../constants'
import { getBrickTexture, getGrassTexture } from '../../scene/textures'
import { WoodCrate } from './WoodCrate'

/** Solid brick wall segment with a stone coping along the top. */
function BrickWall({
  position,
  args,
}: {
  position: [number, number, number]
  args: [number, number, number]
}) {
  const [w, h, d] = args
  const brick = useMemo(() => {
    const map = getBrickTexture().clone()
    map.needsUpdate = true
    // Keep brick size consistent regardless of how long the wall is.
    map.repeat.set(Math.max(w, d) / 2.6, h / 2.6)
    return map
  }, [w, h, d])

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={brick} roughness={0.95} metalness={0} />
      </mesh>

      {/* Concrete coping caps the wall so the top edge reads cleanly */}
      <mesh position={[0, h / 2 + 0.09, 0]}>
        <boxGeometry args={[w + 0.16, 0.18, d + 0.16]} />
        <meshStandardMaterial color={COLORS.wallCap} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  )
}

/** Grass field covering the play area. */
function GrassFloor() {
  const size = ARENA.size + ARENA.wallThickness * 2

  const grass = useMemo(() => {
    const map = getGrassTexture().clone()
    map.needsUpdate = true
    map.repeat.set(size / 2.2, size / 2.2)
    return map
  }, [size])

  const outerGrass = useMemo(() => {
    const map = getGrassTexture().clone()
    map.needsUpdate = true
    map.repeat.set(60, 60)
    return map
  }, [])

  return (
    <group>
      {/* Ground that continues past the walls so the horizon isn't empty */}
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[320, 320]} />
        <meshStandardMaterial map={outerGrass} roughness={1} metalness={0} />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={grass} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}

export function Arena() {
  const half = ARENA.size / 2
  const t = ARENA.wallThickness
  const h = ARENA.wallHeight

  return (
    <group>
      <GrassFloor />

      {/* Brick perimeter — solid map bounds */}
      <BrickWall position={[0, h / 2, -half]} args={[ARENA.size + t * 2, h, t]} />
      <BrickWall position={[0, h / 2, half]} args={[ARENA.size + t * 2, h, t]} />
      <BrickWall position={[-half, h / 2, 0]} args={[t, h, ARENA.size]} />
      <BrickWall position={[half, h / 2, 0]} args={[t, h, ARENA.size]} />

      {OBSTACLES.map((o, i) => (
        <WoodCrate
          key={`crate-${i}`}
          position={[o.x, o.h / 2, o.z]}
          args={[o.w, o.h, o.d]}
        />
      ))}
    </group>
  )
}
