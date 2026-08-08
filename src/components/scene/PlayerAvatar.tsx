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

type ClipName = 'idle' | 'walk' | 'run' | 'sneak_pose'

/**
 * Mixamo X-Bot — idle / walk / run / sneak_pose (crouch).
 * Model is never scaled for crouch; pose comes from the clip.
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
  const crouchAction = actions.sneak_pose

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

    const state = useGameStore.getState()
    const { moveX, moveZ } = state.input
    const { isCrouching, isSprinting } = state
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    let next: ClipName = 'idle'
    if (isCrouching && crouchAction) {
      next = 'sneak_pose'
    } else if (moving && isSprinting && runAction) {
      next = 'run'
    } else if (moving && walkAction) {
      next = 'walk'
    } else {
      next = 'idle'
    }

    if (next !== currentClip.current) {
      const prev = currentClip.current ? actions[currentClip.current] : null
      const action = actions[next]
      if (action) {
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.18).play()
        // sneak_pose is a held crouch pose; loop so mixer keeps it applied.
        action.setLoop(THREE.LoopRepeat, Infinity)
        prev?.fadeOut(0.18)
        currentClip.current = next
      }
    }

    const action = currentClip.current ? actions[currentClip.current] : null
    if (action) {
      if (currentClip.current === 'sneak_pose') {
        action.setEffectiveTimeScale(moving ? 0.35 : 0.05)
      } else {
        action.setEffectiveTimeScale(isSprinting && next === 'run' ? 1.08 : 1)
      }
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

/** Capsule fallback while the GLB loads — crouches by lowering the torso, not squashing. */
function FallbackHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const crouchBlend = useRef(0)

  useFrame((_, dt) => {
    if (!root.current || !torso.current) return
    root.current.rotation.y = yawRef.current
    const state = useGameStore.getState()
    const { moveX, moveZ } = state.input
    const { isCrouching, isSprinting } = state
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05
    const target = isCrouching ? 1 : 0
    crouchBlend.current = THREE.MathUtils.lerp(crouchBlend.current, target, 1 - Math.exp(-12 * dt))

    // Drop torso; feet stay planted — mirrors capsule top lowering.
    torso.current.position.y = THREE.MathUtils.lerp(0, -0.55, crouchBlend.current)
    torso.current.rotation.x = THREE.MathUtils.lerp(0, 0.35, crouchBlend.current)

    const rate = isSprinting ? 13 : 8.5
    const amp = (isSprinting ? 0.65 : 0.45) * (1 - crouchBlend.current * 0.5)
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp * (moving ? 1 : 0)
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
  })

  return (
    <group ref={root}>
      <group ref={torso}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <capsuleGeometry args={[0.18, 0.5, 6, 12]} />
          <meshStandardMaterial color={PLAYER.tunic} roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.58, 0]} castShadow>
          <sphereGeometry args={[0.13, 14, 12]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
      </group>
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
