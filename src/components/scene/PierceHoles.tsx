import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, COMBAT } from '../../constants'
import { useGameStore, type PierceHole } from '../../store/gameStore'

const UP = new THREE.Vector3(0, 0, 1)

/**
 * Bullet holes punched through styrofoam crates. They stay on the crate for
 * the whole round (cleared only on round reset).
 */
export function PierceHoles() {
  const holes = useGameStore((s) => s.pierceHoles)

  const geometries = useMemo(() => {
    const r = COMBAT.pierceHoleRadius
    return {
      hole: new THREE.CircleGeometry(r, 10),
      crater: new THREE.RingGeometry(r, r * 1.75, 10),
    }
  }, [])

  const materials = useMemo(
    () => ({
      hole: new THREE.MeshBasicMaterial({
        color: COLORS.foamHole,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      }),
      crater: new THREE.MeshBasicMaterial({
        color: COLORS.foamChip,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
    }),
    [],
  )

  return (
    <group>
      {holes.map((h) => (
        <HoleDecal key={h.id} hole={h} geometries={geometries} materials={materials} />
      ))}
    </group>
  )
}

function HoleDecal({
  hole,
  geometries,
  materials,
}: {
  hole: PierceHole
  geometries: { hole: THREE.CircleGeometry; crater: THREE.RingGeometry }
  materials: { hole: THREE.MeshBasicMaterial; crater: THREE.MeshBasicMaterial }
}) {
  const quat = useMemo(() => {
    const n = new THREE.Vector3(...hole.normal)
    if (n.lengthSq() < 1e-6) n.set(0, 0, 1)
    else n.normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(UP, n)
    // Roll around the surface normal so repeated hits don't look stamped.
    q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, hole.spin))
    return q
  }, [hole.normal, hole.spin])

  return (
    <group position={hole.position} quaternion={quat} scale={hole.scale}>
      {/* Torn foam rim */}
      <mesh geometry={geometries.crater} material={materials.crater} />
      {/* Dark punched-through core */}
      <mesh geometry={geometries.hole} material={materials.hole} position={[0, 0, 0.001]} />
    </group>
  )
}
