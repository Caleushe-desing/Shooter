import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getGrassTexture } from '../../scene/textures'
import {
  WORLD,
  FLORA,
  MINERALS,
  MINES,
  BUILDINGS,
  type LakeDef,
} from '../../world/catalog'
import { sampleHeight } from '../../world/heightmap'
import {
  useWorldStore,
  type FloraState,
  type MineralState,
  type BuildingState,
} from '../../store/worldStore'
import { ResourceMarker } from './ResourceMarker'
import { getPlayerPosition } from '../../store/enemyRuntime'
import type { MineInstance, OrchardZone } from '../../world/generate'

function TerrainMesh() {
  const geo = useMemo(() => {
    const segments = 160
    const g = new THREE.PlaneGeometry(WORLD.size, WORLD.size, segments, segments)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = sampleHeight(x, z)
      pos.setY(i, h)
      // Height-tinted earth tones.
      const t = Math.min(1, h / 40)
      const r = 0.28 + t * 0.25
      const gC = 0.38 - t * 0.12
      const b = 0.18 + t * 0.08
      colors[i * 3] = r
      colors[i * 3 + 1] = gC + (1 - t) * 0.12
      colors[i * 3 + 2] = b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  const grass = useMemo(() => {
    const map = getGrassTexture().clone()
    map.needsUpdate = true
    map.repeat.set(WORLD.size / 18, WORLD.size / 18)
    return map
  }, [])

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial
        map={grass}
        vertexColors
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  )
}

function FantasyTree({ flora }: { flora: FloraState }) {
  const def = FLORA[flora.kind]
  const group = useRef<THREE.Group>(null)
  const h = def.height * flora.scale
  const sway = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock }) => {
    if (!group.current || !flora.alive) return
    const t = clock.elapsedTime
    group.current.rotation.z = Math.sin(t * 0.7 + sway) * 0.025
    group.current.rotation.x = Math.cos(t * 0.55 + sway) * 0.015
  })

  if (!flora.alive) return null
  const harvested = flora.harvested
  const crop =
    flora.kind === 'trigo' ||
    flora.kind === 'maiz' ||
    flora.kind === 'tomatera' ||
    flora.kind === 'hierba_fibra' ||
    flora.kind === 'juncos' ||
    flora.kind === 'arbusto_bayas'
  const conifer = flora.kind === 'pino' || flora.kind === 'abeto'
  const giant = flora.kind === 'secuoya'

  return (
    <group ref={group} position={[flora.x, flora.y, flora.z]} rotation={[0, flora.yaw, 0]}>
      {!harvested && <ResourceMarker resourceId={def.harvest} y={h + 0.45} />}

      {crop ? (
        <>
          {(flora.kind === 'trigo' || flora.kind === 'maiz') &&
            [0, 1, 2, 3, 4].map((i) => (
              <mesh
                key={i}
                position={[(i % 2 ? 0.1 : -0.08) * flora.scale, h * 0.45, (i - 2) * 0.08]}
                rotation={[0.1, i, 0]}
              >
                <capsuleGeometry args={[0.035 * flora.scale, h * 0.7, 3, 4]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.88} />
              </mesh>
            ))}
          {flora.kind === 'tomatera' || flora.kind === 'arbusto_bayas' ? (
            <>
              <mesh position={[0, h * 0.45, 0]} castShadow>
                <sphereGeometry args={[def.radius * 1.3 * flora.scale, 10, 10]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.82} />
              </mesh>
              {!harvested && def.colorAccent && (
                <>
                  <mesh position={[0.12, h * 0.55, 0.08]}>
                    <sphereGeometry args={[0.08 * flora.scale, 6, 6]} />
                    <meshStandardMaterial color={def.colorAccent} roughness={0.5} />
                  </mesh>
                  <mesh position={[-0.1, h * 0.6, -0.06]}>
                    <sphereGeometry args={[0.07 * flora.scale, 6, 6]} />
                    <meshStandardMaterial color={def.colorAccent} roughness={0.5} />
                  </mesh>
                </>
              )}
            </>
          ) : null}
          {(flora.kind === 'hierba_fibra' || flora.kind === 'juncos') &&
            [0, 1, 2, 3].map((i) => (
              <mesh
                key={i}
                position={[(i % 2 ? 0.08 : -0.08) * flora.scale, h * 0.45, (i < 2 ? 0.06 : -0.06)]}
              >
                <capsuleGeometry args={[0.03 * flora.scale, h * 0.55, 3, 4]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.85} />
              </mesh>
            ))}
          {flora.kind === 'trigo' && !harvested && (
            <mesh position={[0, h * 0.85, 0]}>
              <sphereGeometry args={[0.12 * flora.scale, 6, 6]} />
              <meshStandardMaterial color={def.colorTrunk} roughness={0.7} />
            </mesh>
          )}
          {flora.kind === 'maiz' && !harvested && def.colorAccent && (
            <mesh position={[0.05, h * 0.7, 0]}>
              <capsuleGeometry args={[0.05 * flora.scale, 0.25 * flora.scale, 3, 4]} />
              <meshStandardMaterial color={def.colorAccent} roughness={0.6} />
            </mesh>
          )}
        </>
      ) : (
        <>
          <mesh position={[0, h * (giant ? 0.4 : 0.35), 0]} castShadow>
            <cylinderGeometry
              args={[
                def.radius * (giant ? 0.55 : 0.28) * flora.scale,
                def.radius * (giant ? 0.75 : 0.42) * flora.scale,
                h * 0.75,
                giant ? 10 : 8,
              ]}
            />
            <meshStandardMaterial color={def.colorTrunk} roughness={0.9} />
          </mesh>
          {conifer ? (
            [0.42, 0.58, 0.72, 0.86].map((p, i) => (
              <mesh key={i} position={[0, h * p, 0]} castShadow>
                <coneGeometry
                  args={[def.radius * (1.7 - i * 0.28) * flora.scale, h * 0.26, 8]}
                />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.78} />
              </mesh>
            ))
          ) : flora.kind === 'sauce' ? (
            <>
              <mesh position={[0, h * 0.72, 0]} castShadow>
                <sphereGeometry args={[def.radius * 1.6 * flora.scale, 12, 12]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.8} />
              </mesh>
              {[-0.4, -0.1, 0.2, 0.45].map((dx, i) => (
                <mesh key={i} position={[dx * flora.scale, h * 0.35, 0.15]} castShadow>
                  <capsuleGeometry args={[0.04, h * 0.45, 3, 4]} />
                  <meshStandardMaterial color={def.colorFoliage} roughness={0.85} />
                </mesh>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, h * 0.78, 0]} castShadow>
                <sphereGeometry args={[def.radius * (flora.kind === 'olivo' ? 1.5 : 1.75) * flora.scale, 14, 12]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.8} />
              </mesh>
              <mesh position={[0.28 * flora.scale, h * 0.7, -0.15 * flora.scale]} castShadow>
                <sphereGeometry args={[def.radius * 1.05 * flora.scale, 12, 10]} />
                <meshStandardMaterial color={def.colorFoliage} roughness={0.8} />
              </mesh>
              {!harvested && def.colorAccent && (
                <>
                  <mesh position={[0.2, h * 0.65, 0.2]}>
                    <sphereGeometry args={[0.1 * flora.scale, 6, 6]} />
                    <meshStandardMaterial color={def.colorAccent} roughness={0.55} />
                  </mesh>
                  <mesh position={[-0.15, h * 0.72, -0.1]}>
                    <sphereGeometry args={[0.09 * flora.scale, 6, 6]} />
                    <meshStandardMaterial color={def.colorAccent} roughness={0.55} />
                  </mesh>
                </>
              )}
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
    <group position={[mineral.x, mineral.y, mineral.z]} rotation={[0, mineral.yaw, 0]}>
      <ResourceMarker resourceId={def.yield} y={def.height * s + 0.7} />
      <mesh position={[0, def.height * 0.45 * s, 0]} castShadow>
        <dodecahedronGeometry args={[def.radius * s, 0]} />
        <meshStandardMaterial
          color={def.color}
          roughness={mineral.kind === 'diamante' ? 0.25 : 0.9}
          metalness={mineral.kind === 'diamante' ? 0.65 : 0.12}
        />
      </mesh>
      <mesh position={[0.12 * s, def.height * 0.55 * s, 0.08 * s]}>
        <boxGeometry args={[0.18 * s, 0.12 * s, 0.18 * s]} />
        <meshStandardMaterial color={def.colorVein} roughness={0.45} metalness={0.4} />
      </mesh>
    </group>
  )
}

function LakeMesh({ lake }: { lake: LakeDef }) {
  const y = sampleHeight(lake.x, lake.z) + 0.15
  return (
    <group position={[lake.x, y, lake.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[lake.radius, 48]} />
        <meshStandardMaterial color="#2A6A98" roughness={0.12} metalness={0.4} transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[lake.radius * 0.92, lake.radius * 1.1, 48]} />
        <meshStandardMaterial color="#4A7A48" roughness={0.92} />
      </mesh>
      <ResourceMarker resourceId="agua" y={1.1} />
    </group>
  )
}

function OrchardFence({ zone }: { zone: OrchardZone }) {
  const y = sampleHeight(zone.x, zone.z)
  return (
    <group position={[zone.x, y, zone.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[zone.radius * 0.92, zone.radius, 40]} />
        <meshStandardMaterial color="#6A5A38" roughness={0.9} />
      </mesh>
      <ResourceMarker resourceId="manzana" y={2.2} />
    </group>
  )
}

function MineSite({ mine }: { mine: MineInstance }) {
  const def = MINES[mine.kind]
  const y = mine.y
  if (def.openPit) {
    return (
      <group position={[mine.x, y, mine.z]} rotation={[0, mine.yaw, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[def.radius, 36]} />
          <meshStandardMaterial color={def.color} roughness={0.95} />
        </mesh>
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[def.radius * 0.55, def.radius * 0.95, 2.4, 24]} />
          <meshStandardMaterial color="#5A4A30" roughness={0.96} />
        </mesh>
        <ResourceMarker resourceId="cobre" y={2.5} />
      </group>
    )
  }
  // Underground entrance: timber portal + dark mouth
  return (
    <group position={[mine.x, y, mine.z]} rotation={[0, mine.yaw, 0]}>
      <mesh position={[0, 1.4, 0.2]} castShadow>
        <boxGeometry args={[3.2, 2.8, 1.2]} />
        <meshStandardMaterial color="#3A2A1A" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0.85]}>
        <boxGeometry args={[1.6, 2.0, 0.3]} />
        <meshStandardMaterial color="#0A0A0C" roughness={1} />
      </mesh>
      <mesh position={[-1.3, 1.5, 0.5]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 3, 6]} />
        <meshStandardMaterial color="#5A4030" roughness={0.85} />
      </mesh>
      <mesh position={[1.3, 1.5, 0.5]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 3, 6]} />
        <meshStandardMaterial color="#5A4030" roughness={0.85} />
      </mesh>
      <ResourceMarker
        resourceId={mine.kind.includes('diamante') ? 'diamante' : mine.kind.includes('carbon') ? 'carbon' : 'cobre'}
        y={3.2}
      />
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
  const y = sampleHeight(x, z)
  if (kind === 'tramo_calle') {
    return (
      <mesh position={[x, y + 0.06, z]} rotation={[-Math.PI / 2, 0, yaw]} receiveShadow>
        <planeGeometry args={[def.width, def.depth]} />
        <meshStandardMaterial color={def.color} roughness={0.95} />
      </mesh>
    )
  }
  if (kind === 'hoguera') {
    return (
      <group position={[x, y, z]} rotation={[0, yaw, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 0.25, 10]} />
          <meshStandardMaterial color="#5A4030" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <coneGeometry args={[0.25, 0.55, 6]} />
          <meshStandardMaterial color="#FF8A3A" emissive="#FF6020" emissiveIntensity={0.55} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
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

function ScanRing() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    const p = getPlayerPosition()
    ref.current.position.set(p.x, sampleHeight(p.x, p.z) + 0.08, p.z)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2, WORLD.scanRange, 48]} />
      <meshBasicMaterial color="#8FBF6A" transparent opacity={0.16} depthWrite={false} />
    </mesh>
  )
}

/** Fantasy wilderness with heightmap terrain, mines, orchards and forests. */
export function OpenWorld() {
  const flora = useWorldStore((s) => s.flora)
  const minerals = useWorldStore((s) => s.minerals)
  const lakes = useWorldStore((s) => s.lakes)
  const orchards = useWorldStore((s) => s.orchards)
  const mines = useWorldStore((s) => s.mines)
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

  const scanPulse = scanActive && performance.now() - scanPulseAt < 1200

  return (
    <group>
      <TerrainMesh />

      {lakes.map((lake) => (
        <LakeMesh key={lake.id} lake={lake} />
      ))}
      {orchards.map((o) => (
        <OrchardFence key={o.id} zone={o} />
      ))}
      {mines.map((m) => (
        <MineSite key={m.id} mine={m} />
      ))}

      {flora.map((f) => (
        <FantasyTree key={f.id} flora={f} />
      ))}
      {minerals.map((m) => (
        <MineralNode key={m.id} mineral={m} />
      ))}

      <Buildings />
      {scanPulse && <ScanRing />}
    </group>
  )
}
