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
  const primaryLoot = def.loot[0]?.id
  const materials = useMemo(() => {
    return {
      body: new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.7,
        metalness: 0,
      }),
      alt: new THREE.MeshStandardMaterial({
        color: def.colorAlt,
        roughness: 0.65,
        metalness: 0,
      }),
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
    g.position.set(rt.x, 0, rt.z)
    g.rotation.y = rt.yaw

    if (!animal.alive) {
      const t = Math.min(1, (performance.now() - animal.diedAt) / 700)
      g.rotation.z = t * (Math.PI / 2) * 0.9
      g.position.y = -t * 0.2
      materials.body.opacity = 1 - t * 0.7
      materials.body.transparent = true
      return
    }

    materials.body.opacity = 1
    materials.body.transparent = false
    const bob = Math.sin(clock.elapsedTime * (rt.fleeing ? 10 : 5) + rt.phase) * 0.03
    g.position.y = bob
  })

  const h = def.height
  const marker =
    animal.alive && primaryLoot ? (
      <ResourceMarker resourceId={primaryLoot} y={h + 0.55} />
    ) : null

  if (animal.kind === 'caballo' || animal.kind === 'guanaco') {
    return (
      <group ref={root}>
        {marker}
        <mesh material={materials.body} position={[0, h * 0.45, 0]} castShadow scale={[0.7, 0.55, 1.1]}>
          <sphereGeometry args={[0.45, 10, 10]} />
        </mesh>
        <mesh material={materials.body} position={[0, h * 0.75, -0.45]} castShadow>
          <sphereGeometry args={[0.22, 10, 10]} />
        </mesh>
        <mesh material={materials.alt} position={[0, h * 0.72, -0.62]}>
          <sphereGeometry args={[0.1, 8, 8]} />
        </mesh>
        {[
          [-0.2, 0.22, 0.28],
          [0.2, 0.22, 0.28],
          [-0.2, 0.22, -0.28],
          [0.2, 0.22, -0.28],
        ].map((p, i) => (
          <mesh key={i} material={materials.body} position={p as [number, number, number]} castShadow>
            <capsuleGeometry args={[0.07, 0.28, 4, 6]} />
          </mesh>
        ))}
        <mesh material={materials.alt} position={[0, h * 0.55, 0.55]} rotation={[0.4, 0, 0]}>
          <capsuleGeometry args={[0.05, 0.35, 4, 6]} />
        </mesh>
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
        <mesh material={materials.eye} position={[-0.07, 0.74, -0.52]}>
          <sphereGeometry args={[0.03, 6, 6]} />
        </mesh>
        <mesh material={materials.eye} position={[0.07, 0.74, -0.52]}>
          <sphereGeometry args={[0.03, 6, 6]} />
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

  // Perro
  return (
    <group ref={root}>
      {marker}
      <mesh material={materials.body} position={[0, 0.4, 0]} castShadow scale={[0.7, 0.55, 1.15]}>
        <sphereGeometry args={[0.28, 10, 10]} />
      </mesh>
      <mesh material={materials.body} position={[0, 0.55, -0.32]} castShadow>
        <sphereGeometry args={[0.16, 10, 10]} />
      </mesh>
      <mesh material={materials.alt} position={[-0.1, 0.68, -0.3]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.04, 0.1, 4, 6]} />
      </mesh>
      <mesh material={materials.alt} position={[0.1, 0.68, -0.3]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.04, 0.1, 4, 6]} />
      </mesh>
      <mesh material={materials.eye} position={[-0.05, 0.58, -0.44]}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>
      <mesh material={materials.eye} position={[0.05, 0.58, -0.44]}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>
      {[
        [-0.12, 0.18, 0.18],
        [0.12, 0.18, 0.18],
        [-0.12, 0.18, -0.18],
        [0.12, 0.18, -0.18],
      ].map((p, i) => (
        <mesh key={i} material={materials.body} position={p as [number, number, number]} castShadow>
          <capsuleGeometry args={[0.05, 0.16, 4, 6]} />
        </mesh>
      ))}
      <mesh material={materials.alt} position={[0, 0.4, 0.35]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.18, 4, 6]} />
      </mesh>
    </group>
  )
}

/** Living Chilean countryside fauna with wander / flee AI. */
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
