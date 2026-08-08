import { useMemo } from 'react'
import * as THREE from 'three'
import { ARENA } from '../../constants'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import { surfaceMaterial, surfaceFromColor } from '../../materials/surfaces'

type StreetPad = { x: number; z: number; w: number; d: number }

const STREET_PADS: StreetPad[] = [
  { x: -28, z: 0, w: 28, d: 36 },
  { x: 28, z: 0, w: 28, d: 36 },
  { x: 0, z: 2, w: 18, d: 52 },
  { x: 0, z: 30, w: 32, d: 22 },
]

/** Lightweight grass blade clumps along cobble edges. */
function GrassTufts() {
  const mesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.22, 0.42)
    geo.translate(0, 0.21, 0)
    const mat = new THREE.MeshStandardMaterial({
      color: '#6B9A48',
      roughness: 0.95,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    })
    const count = 220
    const inst = new THREE.InstancedMesh(geo, mat, count)
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const e = new THREE.Euler()
    let i = 0
    for (const pad of STREET_PADS) {
      const perPad = Math.floor(count / STREET_PADS.length)
      for (let n = 0; n < perPad && i < count; n++, i++) {
        const edge = n % 4
        let x = pad.x
        let z = pad.z
        if (edge === 0) {
          x = pad.x - pad.w * 0.5 - 0.35 + (Math.random() - 0.5) * 0.5
          z = pad.z + (Math.random() - 0.5) * pad.d
        } else if (edge === 1) {
          x = pad.x + pad.w * 0.5 + 0.35 + (Math.random() - 0.5) * 0.5
          z = pad.z + (Math.random() - 0.5) * pad.d
        } else if (edge === 2) {
          z = pad.z - pad.d * 0.5 - 0.35 + (Math.random() - 0.5) * 0.5
          x = pad.x + (Math.random() - 0.5) * pad.w
        } else {
          z = pad.z + pad.d * 0.5 + 0.35 + (Math.random() - 0.5) * 0.5
          x = pad.x + (Math.random() - 0.5) * pad.w
        }
        p.set(x, 0, z)
        e.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.25)
        q.setFromEuler(e)
        const sc = 0.7 + Math.random() * 0.7
        s.set(sc, sc * (0.85 + Math.random() * 0.4), sc)
        m.compose(p, q, s)
        inst.setMatrixAt(i, m)
      }
    }
    inst.instanceMatrix.needsUpdate = true
    inst.frustumCulled = false
    return inst
  }, [])

  return <primitive object={mesh} />
}

/** Large Haven-inspired arena with cobble streets, grass, and textured builds. */
export function Arena() {
  const half = ARENA.size / 2

  const { visible, propMats, grassMat, streetMats, ringMat } = useMemo(() => {
    const { props } = buildHavenInspiredMap()
    const visible = props.filter((p) => !p.hidden)
    const propMats = visible.map((p) => {
      const kind = p.surface ?? surfaceFromColor(p.color)
      const u = Math.max(p.w, p.d)
      const v = Math.max(p.h, Math.min(p.w, p.d))
      return surfaceMaterial(kind, u, v)
    })
    return {
      visible,
      propMats,
      grassMat: surfaceMaterial('grass', ARENA.size, ARENA.size),
      streetMats: STREET_PADS.map((p) => surfaceMaterial('cobble', p.w, p.d)),
      ringMat: surfaceMaterial('stone', ARENA.size * 0.35, 3),
    }
  }, [])

  return (
    <group>
      {/* Base grass field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA.size, ARENA.size]} />
        <primitive attach="material" object={grassMat} />
      </mesh>

      {/* Cobblestone streets / plazas */}
      {STREET_PADS.map((p, i) => (
        <mesh
          key={`street-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[p.x, 0.02, p.z]}
          receiveShadow
        >
          <planeGeometry args={[p.w, p.d]} />
          <primitive attach="material" object={streetMats[i]} />
        </mesh>
      ))}

      {/* Soft stone ring at outer wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[half - 3.5, half - 0.2, 64]} />
        <primitive attach="material" object={ringMat} />
      </mesh>

      <GrassTufts />

      {visible.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} castShadow receiveShadow>
          <boxGeometry args={[p.w, p.h, p.d]} />
          <primitive attach="material" object={propMats[i]} />
        </mesh>
      ))}
    </group>
  )
}
