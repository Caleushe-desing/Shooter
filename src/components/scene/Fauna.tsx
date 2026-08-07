import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FAUNA } from '../../world/catalog'
import { useWorldStore, type FaunaState } from '../../store/worldStore'
import {
  clearFaunaRuntimes,
  ensureFaunaRuntime,
  getFaunaRuntime,
  stepFauna,
} from '../../store/faunaRuntime'
import { ResourceMarker } from './ResourceMarker'

function AnimalBody({ animal }: { animal: FaunaState }) {
  const root = useRef<THREE.Group>(null)
  const def = FAUNA[animal.kind]
  const primaryLoot = def.loot.find((l) => l.amount > 0)?.id
  const materials = useMemo(() => {
    return {
      body: new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7, metalness: 0 }),
      alt: new THREE.MeshStandardMaterial({ color: def.colorAlt, roughness: 0.65, metalness: 0 }),
      eye: new THREE.MeshBasicMaterial({ color: '#1A1A1A' }),
    }
  }, [def.color, def.colorAlt])

  useEffect(() => {
    ensureFaunaRuntime(animal.id, animal.kind, animal.x, animal.z, animal.yaw)
    return () => {
      materials.body.dispose()
      materials.alt.dispose()
      materials.eye.dispose()
    }
  }, [animal.id, animal.kind, animal.x, animal.z, animal.yaw, materials])

  useFrame(({ clock }) => {
    const g = root.current
    if (!g) return
    const rt = getFaunaRuntime(animal.id)
    if (!rt) {
      g.visible = false
      return
    }
    g.visible = true
    g.position.set(rt.x, rt.y, rt.z)
    g.rotation.y = rt.yaw

    if (!animal.alive) {
      const t = Math.min(1, (performance.now() - animal.diedAt) / 700)
      g.rotation.z = t * (Math.PI / 2) * 0.9
      g.position.y = rt.y - t * 0.2
      materials.body.opacity = 1 - t * 0.7
      materials.body.transparent = true
      return
    }

    materials.body.opacity = 1
    materials.body.transparent = false
    const bob = Math.sin(clock.elapsedTime * (rt.fleeing ? 10 : 5) + rt.phase) * 0.03
    g.position.y = rt.y + bob
  })

  const h = def.height
  const marker =
    animal.alive && primaryLoot ? <ResourceMarker resourceId={primaryLoot} y={h + 0.5} /> : null

  // Shared quadruped / small critter shapes by kind.
  if (animal.kind === 'ciervo') {
    return (
      <group ref={root}>
        {marker}
        <mesh material={materials.body} position={[0, h * 0.45, 0]} castShadow scale={[0.65, 0.55, 1.15]}>
          <sphereGeometry args={[0.42, 10, 10]} />
        </mesh>
        <mesh material={materials.body} position={[0, h * 0.72, -0.42]} castShadow>
          <sphereGeometry args={[0.2, 10, 10]} />
        </mesh>
        <mesh material={materials.alt} position={[-0.08, h * 0.95, -0.38]} rotation={[0.2, 0, 0.3]}>
          <capsuleGeometry args={[0.025, 0.28, 3, 4]} />
        </mesh>
        <mesh material={materials.alt} position={[0.08, h * 0.95, -0.38]} rotation={[0.2, 0, -0.3]}>
          <capsuleGeometry args={[0.025, 0.28, 3, 4]} />
        </mesh>
        {[
          [-0.18, 0.22, 0.28],
          [0.18, 0.22, 0.28],
          [-0.18, 0.22, -0.28],
          [0.18, 0.22, -0.28],
        ].map((p, i) => (
          <mesh key={i} material={materials.body} position={p as [number, number, number]} castShadow>
            <capsuleGeometry args={[0.06, 0.3, 4, 6]} />
          </mesh>
        ))}
      </group>
    )
  }

  if (animal.kind === 'oveja') {
    return (
      <group ref={root}>
        {marker}
        <mesh material={materials.body} position={[0, 0.55, 0]} castShadow scale={[1, 0.85, 1.2]}>
          <sphereGeometry args={[0.38, 12, 12]} />
        </mesh>
        <mesh material={materials.alt} position={[0, 0.7, -0.38]} castShadow>
          <sphereGeometry args={[0.18, 10, 10]} />
        </mesh>
        {[
          [-0.16, 0.2, 0.2],
          [0.16, 0.2, 0.2],
          [-0.16, 0.2, -0.2],
          [0.16, 0.2, -0.2],
        ].map((p, i) => (
          <mesh key={i} material={materials.alt} position={p as [number, number, number]} castShadow>
            <capsuleGeometry args={[0.06, 0.18, 4, 6]} />
          </mesh>
        ))}
      </group>
    )
  }

  if (animal.kind === 'pato') {
    return (
      <group ref={root}>
        {marker}
        <mesh material={materials.body} position={[0, 0.28, 0]} castShadow scale={[0.8, 0.65, 1.1]}>
          <sphereGeometry args={[0.22, 10, 10]} />
        </mesh>
        <mesh material={materials.body} position={[0, 0.4, -0.22]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>
        <mesh material={materials.alt} position={[0, 0.38, -0.34]}>
          <coneGeometry args={[0.04, 0.12, 5]} />
        </mesh>
      </group>
    )
  }

  // conejo
  return (
    <group ref={root}>
      {marker}
      <mesh material={materials.body} position={[0, 0.22, 0]} castShadow scale={[0.75, 0.65, 1]}>
        <sphereGeometry args={[0.16, 10, 10]} />
      </mesh>
      <mesh material={materials.body} position={[0, 0.32, -0.14]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
      </mesh>
      <mesh material={materials.alt} position={[-0.05, 0.42, -0.12]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.025, 0.1, 3, 4]} />
      </mesh>
      <mesh material={materials.alt} position={[0.05, 0.42, -0.12]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.025, 0.1, 3, 4]} />
      </mesh>
    </group>
  )
}

/** Living fantasy fauna with wander / flee AI per biome. */
export function Fauna() {
  const fauna = useWorldStore((s) => s.fauna)
  const initWorld = useWorldStore((s) => s.initWorld)

  useEffect(() => {
    initWorld()
    return () => clearFaunaRuntimes()
  }, [initWorld])

  useFrame((_, delta) => {
    const colliders = useWorldStore.getState().getTreeColliders()
    stepFauna(Math.min(delta, 0.05), colliders)
  })

  return (
    <group>
      {fauna.map((a) => (
        <AnimalBody key={a.id} animal={a} />
      ))}
    </group>
  )
}
