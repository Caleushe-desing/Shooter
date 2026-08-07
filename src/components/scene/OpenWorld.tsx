import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getGrassTexture } from '../../scene/textures'
import { WORLD, FLORA, MINERALS, BUILDINGS, type LakeDef } from '../../world/catalog'
import { useWorldStore, type FloraState, type MineralState, type BuildingState } from '../../store/worldStore'
import { ResourceMarker } from './ResourceMarker'
import { getPlayerPosition } from '../../store/enemyRuntime'

function FantasyTree({ flora }: { flora: FloraState }) {
  const def = FLORA[flora.kind]
  const group = useRef<THREE.Group>(null)
  const h = def.height * flora.scale
  const sway = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock }) => {
    if (!group.current || !flora.alive) return
    const t = clock.elapsedTime
    group.current.rotation.z = Math.sin(t * 0.7 + sway) * 0.03
    group.current.rotation.x = Math.cos(t * 0.55 + sway) * 0.02
  })

  if (!flora.alive) return null

  const harvested = flora.harvested
  const isBush =
    flora.kind === 'arbusto_bayas' || flora.kind === 'hierba_fibra' || flora.kind === 'juncos'
  const isPine = flora.kind === 'pino'

  return (
    <group ref={group} position={[flora.x, 0, flora.z]} rotation={[0, flora.yaw, 0]}>
      {!harvested && <ResourceMarker resourceId={def.harvest} y={h + 0.45} />}

      {isBush ? (
        <>
          {flora.kind !== 'hierba_fibra' && flora.kind !== 'juncos' && (
            <mesh position={[0, h * 0.25, 0]}>
              <cylinderGeometry args={[0.04, 0.06, h * 0.4, 6]} />
              <meshStandardMaterial color={def.colorTrunk} roughness={0.9} />
            </mesh>
          )}
          <mesh position={[0, h * 0.55, 0]} castShadow scale={[1.1, 0.9, 1.1]}>
            <sphereGeometry args={[def.radius * (flora.kind === 'juncos' ? 0.9 : 1.4) * flora.scale, 10, 10]} />
            <meshStandardMaterial color={def.colorFoliage} roughness={0.8} />
          </mesh>
          {!harvested && def.colorAccent && (
            <>
              <mesh position={[0.12, h * 0.65, 0.1]}>
                <sphereGeometry args={[0.08 * flora.scale, 6, 6]} />
                <meshStandardMaterial color={def.colorAccent} roughness={0.5} />
              </mesh>
              <mesh position={[-0.1, h * 0.7, -0.08]}>
                <sphereGeometry args={[0.07 * flora.scale, 6, 6]} />
                <meshStandardMaterial color={def.colorAccent} roughness={0.5} />
              </mesh>
            </>
          )}
          {(flora.kind === 'hierba_fibra' || flora.kind === 'juncos') &&
            [0, 1, 2, 3].map((i) => (
              <mesh
                key={i}
                position={[(i % 2 ? 0.08 : -0.08) * flora.scale, h * 0.45, (i < 2 ? 0.06 : -0.06) * flora.scale]}
                rotation={[0.15, i, 0.1]}
              >
                <capsuleGeometry args={[0.03 * flora.scale, h * 0.55, 3, 4]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.85} />
              </mesh>
            ))}
        </>
      ) : (
        <>
          <mesh position={[0, h * 0.35, 0]} castShadow>
            <cylinderGeometry
              args={[def.radius * 0.3 * flora.scale, def.radius * 0.45 * flora.scale, h * 0.7, 8]}
            />
            <meshStandardMaterial color={def.colorTrunk} roughness={0.85} />
          </mesh>
          {isPine ? (
            [0.5, 0.68, 0.84].map((p, i) => (
              <mesh key={i} position={[0, h * p, 0]} castShadow>
                <coneGeometry args={[def.radius * (1.5 - i * 0.3) * flora.scale, h * 0.28, 7]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.75} />
              </mesh>
            ))
          ) : (
            <>
              <mesh position={[0, h * 0.75, 0]} castShadow>
                <sphereGeometry args={[def.radius * 1.7 * flora.scale, 12, 12]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.78} />
              </mesh>
              <mesh position={[0.3 * flora.scale, h * 0.7, -0.18 * flora.scale]} castShadow>
                <sphereGeometry args={[def.radius * 1.05 * flora.scale, 10, 10]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.78} />
              </mesh>
            </>
          )}
        </>
      )}
    </group>
  )
}

function MineralNode({ mineral }: { mineral: MineralState }) {
  const def = MINERALS[mineral.kind]
  if (!mineral.alive || !mineral.revealed) return null
  const s = mineral.scale
  return (
    <group position={[mineral.x, 0, mineral.z]} rotation={[0, mineral.yaw, 0]}>
      <ResourceMarker resourceId={def.yield} y={def.height * s + 0.7} />
      <mesh position={[0, def.height * 0.45 * s, 0]} castShadow>
        <dodecahedronGeometry args={[def.radius * s, 0]} />
        <meshStandardMaterial color={def.color} roughness={0.9} metalness={0.12} />
      </mesh>
      <mesh position={[0.12 * s, def.height * 0.55 * s, 0.08 * s]}>
        <boxGeometry args={[0.18 * s, 0.12 * s, 0.18 * s]} />
        <meshStandardMaterial color={def.colorVein} roughness={0.55} metalness={0.35} />
      </mesh>
    </group>
  )
}

function LakeMesh({ lake }: { lake: LakeDef }) {
  return (
    <group position={[lake.x, 0.02, lake.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[lake.radius, 48]} />
        <meshStandardMaterial
          color="#3A8EC8"
          roughness={0.15}
          metalness={0.35}
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[lake.radius * 0.92, lake.radius * 1.08, 48]} />
        <meshStandardMaterial color="#6BA86A" roughness={0.9} />
      </mesh>
      <ResourceMarker resourceId="agua" y={1.2} />
    </group>
  )
}

function Buildings() {
  const buildings = useWorldStore((s) => s.buildings)
  return (
    <group>
      {buildings.map((b) => (
        <BuiltNode key={b.id} building={b} />
      ))}
    </group>
  )
}

function BuiltNode({ building }: { building: BuildingState }) {
  const { kind, x, z, yaw } = building
  const def = BUILDINGS[kind]
  if (kind === 'tramo_calle') {
    return (
      <mesh position={[x, 0.06, z]} rotation={[-Math.PI / 2, 0, yaw]} receiveShadow>
        <planeGeometry args={[def.width, def.depth]} />
        <meshStandardMaterial color={def.color} roughness={0.95} />
      </mesh>
    )
  }
  if (kind === 'hoguera') {
    return (
      <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 0.25, 10]} />
          <meshStandardMaterial color="#5A4030" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <coneGeometry args={[0.25, 0.55, 6]} />
          <meshStandardMaterial color="#FF8A3A" emissive="#FF6020" emissiveIntensity={0.6} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, def.height * 0.45, 0]} castShadow>
        <boxGeometry args={[def.width, def.height * 0.9, def.depth]} />
        <meshStandardMaterial color={def.color} roughness={0.85} />
      </mesh>
      <mesh position={[0, def.height * 0.95, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[def.width * 0.72, def.height * 0.45, 4]} />
        <meshStandardMaterial color="#6B4030" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Fantasy wilderness: grass, lakes, forests, meadows, mineral hills. */
export function OpenWorld() {
  const flora = useWorldStore((s) => s.flora)
  const minerals = useWorldStore((s) => s.minerals)
  const lakes = useWorldStore((s) => s.lakes)
  const initWorld = useWorldStore((s) => s.initWorld)
  const tickRegen = useWorldStore((s) => s.tickRegen)
  const scanActive = useWorldStore((s) => s.scanActive)
  const scanPulseAt = useWorldStore((s) => s.scanPulseAt)

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

  const scanPulse = scanActive && performance.now() - scanPulseAt < 1200

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD.size, WORLD.size]} />
        <meshStandardMaterial map={grass} roughness={0.88} metalness={0} />
      </mesh>

      {/* Distant ridges */}
      {[
        [320, 0, -380, 70],
        [-350, 0, -260, 55],
        [280, 0, 360, 60],
        [-400, 0, 220, 48],
        [150, 0, -450, 42],
        [-180, 0, 420, 50],
        [480, 0, 80, 65],
        [-500, 0, -100, 58],
      ].map(([x, , z, r], i) => (
        <mesh key={i} position={[x, -2.5, z]} castShadow>
          <sphereGeometry args={[r, 18, 14]} />
          <meshStandardMaterial
            color={i % 2 ? '#5A7A48' : '#6A6A60'}
            roughness={0.96}
            metalness={0}
          />
        </mesh>
      ))}

      {lakes.map((lake) => (
        <LakeMesh key={lake.id} lake={lake} />
      ))}

      {flora.map((f) => (
        <FantasyTree key={f.id} flora={f} />
      ))}
      {minerals.map((m) => (
        <MineralNode key={m.id} mineral={m} />
      ))}

      <Buildings />

      {scanPulse && (
        <ScanRing />
      )}
    </group>
  )
}

function ScanRing() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    const p = getPlayerPosition()
    ref.current.position.set(p.x, 0.05, p.z)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2, WORLD.scanRange, 48]} />
      <meshBasicMaterial color="#6FE04A" transparent opacity={0.18} depthWrite={false} />
    </mesh>
  )
}
