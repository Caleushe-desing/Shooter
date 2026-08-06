import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getGrassTexture } from '../../scene/textures'
import { WORLD, FLORA, MINERALS } from '../../world/catalog'
import { useWorldStore, type FloraState, type MineralState } from '../../store/worldStore'

function ChileanTree({ flora }: { flora: FloraState }) {
  const def = FLORA[flora.kind]
  const group = useRef<THREE.Group>(null)
  const h = def.height * flora.scale
  const sway = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock }) => {
    if (!group.current || !flora.alive) return
    // Soft living sway — Chilean canopy breathing in the wind.
    const t = clock.elapsedTime
    group.current.rotation.z = Math.sin(t * 0.7 + sway) * 0.03
    group.current.rotation.x = Math.cos(t * 0.55 + sway) * 0.02
  })

  if (!flora.alive) return null

  const harvested = flora.harvested
  const isBush = flora.kind === 'maqui' || flora.kind === 'copihue' || flora.kind === 'espino'
  const isAraucaria = flora.kind === 'araucaria'

  return (
    <group ref={group} position={[flora.x, 0, flora.z]} rotation={[0, flora.yaw, 0]}>
      <mesh position={[0, h * 0.35, 0]} castShadow>
        <cylinderGeometry args={[def.radius * 0.35 * flora.scale, def.radius * 0.5 * flora.scale, h * 0.7, 8]} />
        <meshStandardMaterial color={def.colorTrunk} roughness={0.85} metalness={0} />
      </mesh>

      {isAraucaria ? (
        <>
          {[0.45, 0.62, 0.78, 0.92].map((p, i) => (
            <mesh key={i} position={[0, h * p, 0]} castShadow>
              <coneGeometry args={[def.radius * (1.6 - i * 0.25) * flora.scale, h * 0.22, 7]} />
              <meshStandardMaterial color={def.colorFoliage} roughness={0.75} metalness={0} />
            </mesh>
          ))}
          {!harvested && def.colorAccent && (
            <mesh position={[0.25 * flora.scale, h * 0.55, 0.1]}>
              <sphereGeometry args={[0.12 * flora.scale, 8, 8]} />
              <meshStandardMaterial color={def.colorAccent} roughness={0.55} metalness={0} />
            </mesh>
          )}
        </>
      ) : isBush ? (
        <>
          <mesh position={[0, h * 0.55, 0]} castShadow scale={[1.1, 0.9, 1.1]}>
            <sphereGeometry args={[def.radius * 1.4 * flora.scale, 10, 10]} />
            <meshStandardMaterial color={def.colorFoliage} roughness={0.8} metalness={0} />
          </mesh>
          {!harvested && def.colorAccent && (
            <>
              <mesh position={[0.15, h * 0.65, 0.12]}>
                <sphereGeometry args={[0.08 * flora.scale, 6, 6]} />
                <meshStandardMaterial color={def.colorAccent} roughness={0.5} metalness={0} />
              </mesh>
              <mesh position={[-0.12, h * 0.7, -0.08]}>
                <sphereGeometry args={[0.07 * flora.scale, 6, 6]} />
                <meshStandardMaterial color={def.colorAccent} roughness={0.5} metalness={0} />
              </mesh>
              {flora.kind === 'copihue' && (
                <mesh position={[0.05, h * 0.85, 0.05]} rotation={[0.4, 0, 0.2]}>
                  <coneGeometry args={[0.1 * flora.scale, 0.22 * flora.scale, 6]} />
                  <meshStandardMaterial color={def.colorAccent} roughness={0.45} metalness={0} />
                </mesh>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <mesh position={[0, h * 0.75, 0]} castShadow>
            <sphereGeometry args={[def.radius * 1.8 * flora.scale, 12, 12]} />
            <meshStandardMaterial color={def.colorFoliage} roughness={0.78} metalness={0} />
          </mesh>
          <mesh position={[0.35 * flora.scale, h * 0.7, -0.2 * flora.scale]} castShadow>
            <sphereGeometry args={[def.radius * 1.1 * flora.scale, 10, 10]} />
            <meshStandardMaterial color={def.colorFoliage} roughness={0.78} metalness={0} />
          </mesh>
          {!harvested && (
            <mesh position={[0.2, h * 0.55, 0.25]}>
              <sphereGeometry args={[0.1 * flora.scale, 6, 6]} />
              <meshStandardMaterial color={def.colorAccent ?? '#C45A4A'} roughness={0.55} metalness={0} />
            </mesh>
          )}
        </>
      )}
    </group>
  )
}

function MineralNode({ mineral }: { mineral: MineralState }) {
  const def = MINERALS[mineral.kind]
  if (!mineral.alive) return null
  const s = mineral.scale
  return (
    <group position={[mineral.x, 0, mineral.z]} rotation={[0, mineral.yaw, 0]}>
      <mesh position={[0, def.height * 0.45 * s, 0]} castShadow>
        <dodecahedronGeometry args={[def.radius * s, 0]} />
        <meshStandardMaterial color={def.color} roughness={0.9} metalness={0.15} />
      </mesh>
      <mesh position={[0.12 * s, def.height * 0.55 * s, 0.08 * s]}>
        <boxGeometry args={[0.18 * s, 0.12 * s, 0.18 * s]} />
        <meshStandardMaterial color={def.colorVein} roughness={0.55} metalness={0.35} />
      </mesh>
    </group>
  )
}

/** Open Chilean countryside: endless grass, native flora and mineral nodes. */
export function OpenWorld() {
  const flora = useWorldStore((s) => s.flora)
  const minerals = useWorldStore((s) => s.minerals)
  const initWorld = useWorldStore((s) => s.initWorld)
  const tickRegen = useWorldStore((s) => s.tickRegen)

  useEffect(() => {
    initWorld()
  }, [initWorld])

  useFrame(() => {
    tickRegen(performance.now())
  })

  const grass = useMemo(() => {
    const map = getGrassTexture().clone()
    map.needsUpdate = true
    map.repeat.set(WORLD.size / 2.4, WORLD.size / 2.4)
    return map
  }, [])

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD.size, WORLD.size]} />
        <meshStandardMaterial map={grass} roughness={0.88} metalness={0} />
      </mesh>

      {/* Soft hills on the horizon so the open world doesn't feel flat forever */}
      {[
        [55, 0, -60, 18],
        [-50, 0, -45, 14],
        [40, 0, 55, 16],
        [-60, 0, 40, 12],
      ].map(([x, , z, r], i) => (
        <mesh key={i} position={[x, -0.5, z]} castShadow>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color={i % 2 ? '#6B9A55' : '#5A8A48'} roughness={0.95} metalness={0} />
        </mesh>
      ))}

      {flora.map((f) => (
        <ChileanTree key={f.id} flora={f} />
      ))}
      {minerals.map((m) => (
        <MineralNode key={m.id} mineral={m} />
      ))}
    </group>
  )
}
