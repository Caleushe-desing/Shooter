import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'

type Props = {
  yawRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

const MODEL_URL = '/models/human.glb'
const TARGET_HEIGHT = PLAYER.height

useGLTF.preload(MODEL_URL)

type ClipName = 'idle' | 'walk' | 'run'

/**
 * Mixamo X-Bot — idle / walk / run (rigged GLB).
 * Plain clothes only — no beret / scarf / partisan props.
 */
function MixamoHuman({ yawRef, movingRef }: Props) {
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
        if (n.includes('head') || n.includes('face') || n.includes('hand')) {
          std.color.set(PLAYER.skin)
        } else if (n.includes('leg') || n.includes('foot') || n.includes('boot')) {
          std.color.set(PLAYER.pants)
        } else {
          std.color.set(PLAYER.tunic)
        }
        std.metalness = 0.05
        std.roughness = 0.78
      }
    })
    return { clone: c, fitScale, footOffset }
  }, [scene])

  const { actions, mixer } = useAnimations(animations, clone)
  const idleAction = actions.idle
  const walkAction = actions.walk
  const runAction = actions.run

  useEffect(() => {
    if (!idleAction) return
    idleAction.reset().setEffectiveWeight(1).fadeIn(0.2).play()
    idleAction.setLoop(THREE.LoopRepeat, Infinity)
    currentClip.current = 'idle'
    return () => {
      mixer.stopAllAction()
      currentClip.current = null
    }
  }, [idleAction, mixer])

  useFrame(() => {
    if (!root.current || !modelRef.current) return
    root.current.rotation.y = yawRef.current

    const { moveX, moveZ } = useGameStore.getState().input
    const sprinting = useGameStore.getState().isSprinting
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    let next: ClipName = 'idle'
    if (moving && sprinting && runAction) next = 'run'
    else if (moving && walkAction) next = 'walk'
    else next = 'idle'

    if (next !== currentClip.current) {
      const prev = currentClip.current ? actions[currentClip.current] : null
      const action = actions[next]
      if (action) {
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.18).play()
        action.setLoop(THREE.LoopRepeat, Infinity)
        prev?.fadeOut(0.18)
        currentClip.current = next
      }
    }

    const action = currentClip.current ? actions[currentClip.current] : null
    if (action) {
      action.setEffectiveTimeScale(sprinting && next === 'run' ? 1.08 : 1)
    }

    // Mixamo faces +Z; flip so chase cam on +Z sees the back.
    modelRef.current.rotation.y = Math.PI
  })

  return (
    <group ref={root}>
      <group ref={modelRef} scale={fitScale} position={[0, footOffset, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  )
}

/** Capsule fallback while the GLB loads. */
function FallbackHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!root.current) return
    root.current.rotation.y = yawRef.current
    const { moveX, moveZ } = useGameStore.getState().input
    const sprinting = useGameStore.getState().isSprinting
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05
    const rate = sprinting ? 13 : 8.5
    const amp = sprinting ? 0.65 : 0.45
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp * (moving ? 1 : 0)
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
  })

  return (
    <group ref={root}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 6, 12]} />
        <meshStandardMaterial color={PLAYER.tunic} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.58, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
      </mesh>
      <group ref={legL} position={[-0.1, 0.82, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
          <meshStandardMaterial color={PLAYER.pants} roughness={0.75} />
        </mesh>
      </group>
      <group ref={legR} position={[0.1, 0.82, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
          <meshStandardMaterial color={PLAYER.pants} roughness={0.75} />
        </mesh>
      </group>
    </group>
  )
}

export function PlayerAvatar(props: Props) {
  return (
    <Suspense fallback={<FallbackHuman {...props} />}>
      <MixamoHuman {...props} />
    </Suspense>
  )
}
