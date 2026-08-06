import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCloudTexture, getSkyTexture } from '../../scene/textures'

const SKY_RADIUS = 320

type Puff = {
  position: [number, number, number]
  scale: number
  opacity: number
}

type CloudDef = {
  id: number
  origin: [number, number, number]
  drift: number
  puffs: Puff[]
}

function buildClouds(count: number): CloudDef[] {
  const clouds: CloudDef[] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const radius = 55 + Math.random() * 95
    const height = 26 + Math.random() * 26
    const puffCount = 4 + Math.floor(Math.random() * 4)
    const puffs: Puff[] = []

    for (let p = 0; p < puffCount; p++) {
      const spread = 9 + Math.random() * 7
      puffs.push({
        position: [
          (p - puffCount / 2) * spread * 0.8 + (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 8,
        ],
        scale: 14 + Math.random() * 16,
        opacity: 0.55 + Math.random() * 0.35,
      })
    }

    clouds.push({
      id: i,
      origin: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
      drift: 0.25 + Math.random() * 0.5,
      puffs,
    })
  }

  return clouds
}

/** Gradient sky dome with slow-drifting billboard clouds. */
export function Sky() {
  const skyMap = useMemo(() => getSkyTexture(), [])
  const cloudMap = useMemo(() => getCloudTexture(), [])
  const clouds = useMemo(() => buildClouds(14), [])
  const cloudGroup = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const group = cloudGroup.current
    if (!group) return
    // Gentle drift; wrap around so the sky never empties out.
    for (const child of group.children) {
      child.position.x += (child.userData.drift as number) * delta
      if (child.position.x > 170) child.position.x = -170
    }
  })

  return (
    <group>
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[SKY_RADIUS, 32, 20]} />
        <meshBasicMaterial map={skyMap} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>

      <group ref={cloudGroup}>
        {clouds.map((cloud) => (
          <group key={cloud.id} position={cloud.origin} userData={{ drift: cloud.drift }}>
            {cloud.puffs.map((puff, i) => (
              <sprite key={i} position={puff.position} scale={[puff.scale, puff.scale * 0.62, 1]}>
                <spriteMaterial
                  map={cloudMap}
                  transparent
                  opacity={puff.opacity}
                  depthWrite={false}
                  fog={false}
                />
              </sprite>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}
