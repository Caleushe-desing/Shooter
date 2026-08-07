import { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

const TEX = {
  barkDiff: '/models/tree/textures/bark_diff.jpg',
  barkNor: '/models/tree/textures/bark_nor.jpg',
  barkArm: '/models/tree/textures/bark_arm.jpg',
  twigDiff: '/models/tree/textures/twig_diff.jpg',
  twigNor: '/models/tree/textures/twig_nor.jpg',
  twigAlpha: '/models/tree/textures/twig_alpha.png',
} as const

/** World placement — grass edge near mid, clear of spawn. */
export const HERO_TREE = {
  x: 11.5,
  z: 17.5,
  scale: 1,
  /** Trunk collision footprint. */
  trunkW: 0.85,
  trunkD: 0.85,
} as const

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

type LeafCard = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

/**
 * Hero fir inspired by Poly Haven fir_tree_01 (CC0 textures).
 * Game-ready: tapered trunk + branch shells + alpha-clipped needle cards.
 */
export function RealisticTree({
  position = [HERO_TREE.x, 0, HERO_TREE.z] as [number, number, number],
  scale = HERO_TREE.scale,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const group = useRef<THREE.Group>(null)
  const foliage = useRef<THREE.Group>(null)

  const [barkDiff, barkNor, barkArm, twigDiff, twigNor, twigAlpha] = useLoader(THREE.TextureLoader, [
    TEX.barkDiff,
    TEX.barkNor,
    TEX.barkArm,
    TEX.twigDiff,
    TEX.twigNor,
    TEX.twigAlpha,
  ])

  useMemo(() => {
    for (const t of [barkDiff, barkNor, barkArm]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(1, 3)
      t.colorSpace = t === barkDiff ? THREE.SRGBColorSpace : THREE.NoColorSpace
      t.anisotropy = 8
    }
    for (const t of [twigDiff, twigNor, twigAlpha]) {
      t.colorSpace = t === twigDiff ? THREE.SRGBColorSpace : THREE.NoColorSpace
      t.anisotropy = 4
    }
  }, [barkDiff, barkNor, barkArm, twigDiff, twigNor, twigAlpha])

  const barkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: barkDiff,
        normalMap: barkNor,
        normalScale: new THREE.Vector2(1.15, 1.15),
        roughnessMap: barkArm,
        roughness: 0.92,
        metalness: 0.03,
      }),
    [barkDiff, barkNor, barkArm],
  )

  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: twigDiff,
        normalMap: twigNor,
        alphaMap: twigAlpha,
        transparent: true,
        alphaTest: 0.42,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0,
        depthWrite: true,
      }),
    [twigDiff, twigNor, twigAlpha],
  )

  const leafCards = useMemo(() => {
    const rand = mulberry32(0x71ee01)
    const cards: LeafCard[] = []
    // Layered conical canopy of needle cards (cross-planes + slight tilt).
    const layers = 14
    for (let layer = 0; layer < layers; layer++) {
      const t = layer / (layers - 1)
      const y = 2.2 + t * 8.6
      const radius = 3.4 * (1 - t * 0.92) + 0.35
      const count = Math.max(6, Math.floor(18 * (1 - t * 0.55)))
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rand() * 0.35 + layer * 0.21
        const r = radius * (0.55 + rand() * 0.5)
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        const lean = 0.35 + rand() * 0.55
        const s = 0.85 + rand() * 0.75
        // Two crossed cards per cluster for volume.
        for (const yaw of [a, a + Math.PI / 2]) {
          cards.push({
            position: [x + (rand() - 0.5) * 0.15, y + (rand() - 0.5) * 0.25, z + (rand() - 0.5) * 0.15],
            rotation: [lean * 0.55, yaw, (rand() - 0.5) * 0.25],
            scale: [s * 1.15, s * 1.55, s],
          })
        }
      }
    }
    // Dense top tuft
    for (let i = 0; i < 24; i++) {
      const a = rand() * Math.PI * 2
      const r = rand() * 0.55
      cards.push({
        position: [Math.cos(a) * r, 10.6 + rand() * 0.7, Math.sin(a) * r],
        rotation: [0.2 + rand() * 0.5, a, 0],
        scale: [0.7, 1.1, 0.7],
      })
    }
    return cards
  }, [])

  const branches = useMemo(() => {
    const rand = mulberry32(0x51a7e)
    const out: { pos: [number, number, number]; rot: [number, number, number]; len: number; rad: number }[] = []
    for (let i = 0; i < 28; i++) {
      const y = 2.4 + rand() * 7.2
      const a = rand() * Math.PI * 2
      const len = 1.1 + rand() * 2.2 * (1 - (y - 2.4) / 8)
      const droop = 0.35 + rand() * 0.55
      out.push({
        pos: [Math.cos(a) * 0.22, y, Math.sin(a) * 0.22],
        rot: [droop, a, 0],
        len,
        rad: 0.045 + rand() * 0.04,
      })
    }
    return out
  }, [])

  useFrame(({ clock }) => {
    if (!foliage.current) return
    const t = clock.elapsedTime
    foliage.current.rotation.y = Math.sin(t * 0.35) * 0.012
    foliage.current.rotation.z = Math.sin(t * 0.27 + 1.2) * 0.008
  })

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Roots flare */}
      <mesh castShadow receiveShadow position={[0, 0.18, 0]} material={barkMat}>
        <cylinderGeometry args={[0.62, 0.95, 0.4, 12]} />
      </mesh>
      {/* Main trunk */}
      <mesh castShadow receiveShadow position={[0, 5.1, 0]} material={barkMat}>
        <cylinderGeometry args={[0.18, 0.52, 10.2, 16]} />
      </mesh>
      {/* Upper taper */}
      <mesh castShadow position={[0, 10.55, 0]} material={barkMat}>
        <cylinderGeometry args={[0.04, 0.18, 1.1, 10]} />
      </mesh>

      {branches.map((b, i) => {
        const dir = new THREE.Vector3(0, 1, 0)
          .applyEuler(new THREE.Euler(b.rot[0], b.rot[1], b.rot[2]))
          .multiplyScalar(b.len * 0.5)
        return (
          <mesh
            key={`br-${i}`}
            castShadow
            position={[b.pos[0] + dir.x, b.pos[1] + dir.y, b.pos[2] + dir.z]}
            rotation={b.rot}
            material={barkMat}
          >
            <cylinderGeometry args={[b.rad * 0.35, b.rad, b.len, 6]} />
          </mesh>
        )
      })}

      <group ref={foliage}>
        {leafCards.map((c, i) => (
          <mesh
            key={`lf-${i}`}
            position={c.position}
            rotation={c.rotation}
            scale={c.scale}
            material={leafMat}
            castShadow
          >
            <planeGeometry args={[1.15, 1.55]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Preload textures so Suspense resolves quickly. */
useLoader.preload(THREE.TextureLoader, [
  TEX.barkDiff,
  TEX.barkNor,
  TEX.barkArm,
  TEX.twigDiff,
  TEX.twigNor,
  TEX.twigAlpha,
])
