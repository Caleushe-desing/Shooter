import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ResourceId } from '../../world/catalog'
import { getResourceTexture } from '../../world/resourceIcons'

/** Floating icon above harvestable / lootable world nodes. */
export function ResourceMarker({ resourceId, y }: { resourceId: ResourceId; y: number }) {
  const map = useMemo(() => getResourceTexture(resourceId), [resourceId])
  const bob = useRef(0)
  const sprite = useRef<THREE.Sprite>(null)

  useFrame(({ clock }) => {
    if (!sprite.current) return
    bob.current = Math.sin(clock.elapsedTime * 2.2 + y) * 0.08
    sprite.current.position.y = y + bob.current
  })

  return (
    <sprite ref={sprite} position={[0, y, 0]} scale={[0.55, 0.55, 0.55]} renderOrder={20}>
      <spriteMaterial map={map} transparent depthTest depthWrite={false} opacity={0.95} />
    </sprite>
  )
}
