import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildRubikCubes } from '../../map/rubiksWall'

/** Instanced colorful Rubik cubes around the arena perimeter. */
export function RubiksWall() {
  const cubes = useMemo(() => buildRubikCubes(), [])
  const groups = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number; size: number }[]>()
    for (const c of cubes) {
      const list = map.get(c.color) ?? []
      list.push({ x: c.x, y: c.y, z: c.z, size: c.size })
      map.set(c.color, list)
    }
    return Array.from(map.entries())
  }, [cubes])

  return (
    <group>
      {groups.map(([color, items]) => (
        <RubikBatch key={color} color={color} items={items} />
      ))}
    </group>
  )
}

function RubikBatch({
  color,
  items,
}: {
  color: string
  items: { x: number; y: number; z: number; size: number }[]
}) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const size = items[0]?.size ?? 2.4

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < items.length; i++) {
      const it = items[i]!
      dummy.position.set(it.x, it.y, it.z)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [dummy, items])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        roughness={0.42}
        metalness={0.18}
        emissive={color}
        emissiveIntensity={0.06}
      />
    </instancedMesh>
  )
}
