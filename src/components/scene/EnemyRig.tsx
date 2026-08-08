import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { ENEMY } from '../../constants'
import type { Enemy } from '../../combat/enemies'

const MODEL_URL = '/models/human.glb'
const TARGET_HEIGHT = ENEMY.height

useGLTF.preload(MODEL_URL)

type ClipName = 'idle' | 'walk' | 'run'

type Props = {
  enemy: Enemy
}

/**
 * Mixamo-rigged hostile — same GLB as the player, dark kit tint.
 * Animations follow enemy.moving / chase mode.
 */
export function EnemyRig({ enemy }: Props) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
  const { scene, animations } = useGLTF(MODEL_URL)

  const { clone, fitScale, footOffset } = useMemo(() => {
    const c = cloneSkeleton(scene) as THREE.Group
    c.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const fitScale = size.y > 0.01 ? TARGET_HEIGHT / size.y : 1
    const footOffset = -box.min.y * fitScale

    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const n = (mesh.name || '').toLowerCase()
      const matName = (
        Array.isArray(mesh.material)
          ? mesh.material.map((m) => m.name).join(' ')
          : mesh.material?.name || ''
      ).toLowerCase()
      if (n.includes('joint') || matName.includes('joint')) {
        mesh.visible = false
        return
      }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial
        if (!std?.isMeshStandardMaterial) continue
        // Hostile kit: dark suit, warm skin accents on head/hands.
        if (n.includes('head') || n.includes('face') || n.includes('hand')) {
          std.color.set(ENEMY.skin)
        } else {
          std.color.set(ENEMY.suit)
        }
        std.metalness = 0.08
        std.roughness = 0.7
        std.emissive = new THREE.Color(ENEMY.accent)
        std.emissiveIntensity = 0.12
      }
    })
    return { clone: c, fitScale, footOffset }
  }, [scene])

  const { actions, mixer } = useAnimations(animations, clone)

  useEffect(() => {
    const idle = actions.idle
    if (!idle) return
    idle.reset().setEffectiveWeight(1).fadeIn(0.15).play()
    idle.setLoop(THREE.LoopRepeat, Infinity)
    currentClip.current = 'idle'
    return () => {
      mixer.stopAllAction()
      currentClip.current = null
    }
  }, [actions, mixer])

  useFrame(() => {
    if (!root.current || !modelRef.current || !enemy.alive) return
    root.current.position.set(enemy.x, enemy.y, enemy.z)
    root.current.rotation.y = enemy.yaw
    root.current.visible = enemy.alive

    const chasing = enemy.mode === 'chase' || enemy.mode === 'search'
    let next: ClipName = 'idle'
    if (enemy.moving && chasing && actions.run) next = 'run'
    else if (enemy.moving && actions.walk) next = 'walk'
    else next = 'idle'

    if (next !== currentClip.current) {
      const prev = currentClip.current ? actions[currentClip.current] : null
      const action = actions[next]
      if (action) {
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.14).play()
        action.setLoop(THREE.LoopRepeat, Infinity)
        prev?.fadeOut(0.14)
        currentClip.current = next
      }
    }

    // Hit / alert emissive pulse
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial
        if (!std?.isMeshStandardMaterial) continue
        if (enemy.hitFlash > 0) {
          std.emissive.set('#FFEEAA')
          std.emissiveIntensity = 0.9
        } else if (enemy.alert) {
          std.emissive.set(ENEMY.alertAccent)
          std.emissiveIntensity = 0.28
        } else {
          std.emissive.set(ENEMY.accent)
          std.emissiveIntensity = 0.12
        }
      }
    })

    // Mixamo faces +Z; flip so yaw forward matches player convention (-Z).
    modelRef.current.rotation.y = Math.PI
  })

  if (!enemy.alive) return null

  return (
    <group ref={root}>
      <group ref={modelRef} scale={fitScale} position={[0, footOffset + 0.02, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  )
}
