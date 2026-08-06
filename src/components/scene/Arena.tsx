import { useMemo } from 'react'
import { COLORS, OBSTACLES } from '../../constants'
import { getGrassTexture } from '../../scene/textures'
import { WoodCrate } from './WoodCrate'
import { OpenWorld } from './OpenWorld'
import { WORLD } from '../../world/catalog'

/**
 * Open Chilean countryside — no closed arena walls.
 * A few foam crates remain near spawn as cover / landmarks.
 */
export function Arena() {
  const spawnGrass = useMemo(() => {
    const map = getGrassTexture().clone()
    map.needsUpdate = true
    map.repeat.set(8, 8)
    return map
  }, [])

  return (
    <group>
      <OpenWorld />

      {/* Brighter clearing around the pup's spawn */}
      <mesh position={[0, 0.01, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7, 32]} />
        <meshStandardMaterial map={spawnGrass} color="#B8E07A" roughness={0.82} metalness={0} />
      </mesh>

      {/* Soft rim markers so the open border is readable */}
      {[
        [0, WORLD.half - 1],
        [0, -(WORLD.half - 1)],
        [WORLD.half - 1, 0],
        [-(WORLD.half - 1), 0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.2, z]}>
          <cylinderGeometry args={[0.35, 0.45, 2.4, 6]} />
          <meshStandardMaterial color={COLORS.wallCap} roughness={0.8} metalness={0} />
        </mesh>
      ))}

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
