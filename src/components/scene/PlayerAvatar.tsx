import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'

type Props = {
  /** Root / hips facing — walk direction when strafing. */
  yawRef: MutableRefObject<number>
  /** Camera look yaw — upper body aims back toward this. */
  lookYawRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

const MODEL_URL = '/models/human.glb'
const TARGET_HEIGHT = PLAYER.height

/** Max look offset vs body (radians). Keeps skinning stable. */
const LOOK_YAW_MAX = 1.05
/** Slerp speed for the procedural look quaternion. */
const LOOK_SLERP = 12
/**
 * Weights must sum to 1. Spread across upper chain so no single bone
 * takes the full twist (avoids neck/mesh pinching).
 */
const LOOK_WEIGHTS = {
  spine2: 0.2,
  neck: 0.35,
  head: 0.45,
} as const

const _worldUp = new THREE.Vector3(0, 1, 0)
const _targetLookQ = new THREE.Quaternion()
const _worldYawQ = new THREE.Quaternion()
const _worldQ = new THREE.Quaternion()
const _parentQ = new THREE.Quaternion()

useGLTF.preload(MODEL_URL)

type ClipName = 'idle' | 'walk' | 'run'

function shortestAngle(from: number, to: number) {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

function findBone(root: THREE.Object3D, name: string): THREE.Bone | null {
  let found: THREE.Bone | null = null
  root.traverse((obj) => {
    if (found) return
    if (obj.name === name && (obj as THREE.Bone).isBone) {
      found = obj as THREE.Bone
    }
  })
  return found
}

/**
 * Add a world-space Y rotation on top of the mixer pose.
 * Converts through the parent world quaternion so skinning stays valid
 * under the avatar's Math.PI model flip and root yaw.
 */
function applyWorldYaw(bone: THREE.Bone, radians: number) {
  if (Math.abs(radians) < 1e-6) return
  bone.updateWorldMatrix(true, false)
  _worldYawQ.setFromAxisAngle(_worldUp, radians)
  bone.getWorldQuaternion(_worldQ)
  _worldQ.premultiply(_worldYawQ)
  if (bone.parent) {
    bone.parent.getWorldQuaternion(_parentQ).invert()
    bone.quaternion.copy(_parentQ).multiply(_worldQ)
  } else {
    bone.quaternion.copy(_worldQ)
  }
}

/**
 * Mixamo X-Bot — idle / walk / run (clips untouched).
 *
 * Architecture:
 * 1. Root yaw = body facing (from controller).
 * 2. AnimationMixer writes full-body quaternions as usual.
 * 3. After mixer (priority 1): procedural world-Y look on Spine2 → Neck → Head
 *    via a slerped yaw quaternion, applied with rotateOnWorldAxis.
 *    Never writes Euler .rotation on skinned bones.
 */
function MixamoHuman({ yawRef, lookYawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
  const spine2 = useRef<THREE.Bone | null>(null)
  const neck = useRef<THREE.Bone | null>(null)
  const head = useRef<THREE.Bone | null>(null)
  const skins = useRef<THREE.SkinnedMesh[]>([])
  /** Smoothed look offset (pure world-Y quaternion). */
  const lookQ = useRef(new THREE.Quaternion())
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
        std.color.set(PLAYER.skin)
        std.metalness = 0.02
        std.roughness = 0.72
      }
    })
    return { clone: c, fitScale, footOffset }
  }, [scene])

  const { actions, mixer } = useAnimations(animations, modelRef)

  useEffect(() => {
    spine2.current = findBone(clone, 'mixamorigSpine2')
    neck.current = findBone(clone, 'mixamorigNeck')
    head.current = findBone(clone, 'mixamorigHead')
    const list: THREE.SkinnedMesh[] = []
    clone.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
        list.push(obj as THREE.SkinnedMesh)
      }
    })
    skins.current = list
  }, [clone])

  useEffect(() => {
    const idle = actions.idle
    if (!idle) return
    idle.reset().fadeIn(0.2).play()
    idle.setLoop(THREE.LoopRepeat, Infinity)
    currentClip.current = 'idle'
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, mixer])

  // Layer 1: root facing + clip selection. Does not touch bone local poses.
  useFrame(() => {
    if (!root.current || !modelRef.current) return
    root.current.rotation.y = yawRef.current

    const { moveX, moveZ, sprint } = useGameStore.getState().input
    const moving =
      movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    let next: ClipName = 'idle'
    if (moving && sprint) next = 'run'
    else if (moving) next = 'walk'

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
      action.setEffectiveTimeScale(sprint && next === 'run' ? 1.08 : 1)
    }

    // Mixamo faces +Z; flip so chase cam on +Z sees the back.
    modelRef.current.rotation.y = Math.PI
  })

  // Layer 2: procedural look AFTER AnimationMixer (drei updates at priority 0).
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    let targetYaw = shortestAngle(yawRef.current, lookYawRef.current)
    targetYaw = THREE.MathUtils.clamp(targetYaw, -LOOK_YAW_MAX, LOOK_YAW_MAX)

    _targetLookQ.setFromAxisAngle(_worldUp, targetYaw)
    lookQ.current.slerp(_targetLookQ, 1 - Math.exp(-LOOK_SLERP * dt))

    // Signed angle from pure-Y quaternion (0, sin(a/2), 0, cos(a/2)).
    const q = lookQ.current
    const yaw = 2 * Math.atan2(q.y, q.w)
    if (Math.abs(yaw) < 1e-5) return

    // Additive world-Y on upper chain only — legs/hips keep mixer pose.
    // Apply parent→child so each bone sees updated parent matrices.
    if (spine2.current) applyWorldYaw(spine2.current, yaw * LOOK_WEIGHTS.spine2)
    if (neck.current) applyWorldYaw(neck.current, yaw * LOOK_WEIGHTS.neck)
    if (head.current) applyWorldYaw(head.current, yaw * LOOK_WEIGHTS.head)

    for (const mesh of skins.current) {
      mesh.skeleton.update()
    }
  }, 1)

  return (
    <group ref={root}>
      <group ref={modelRef} scale={fitScale} position={[0, footOffset, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  )
}

/** Simple capsule while the GLB loads — also animates so movement is obvious. */
function FallbackHuman({ yawRef, lookYawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const lookY = useRef(0)

  useFrame((_, delta) => {
    if (!root.current) return
    root.current.rotation.y = yawRef.current
    const { moveX, moveZ, sprint } = useGameStore.getState().input
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05
    const rate = sprint ? 13 : 8.5
    const amp = sprint ? 0.65 : 0.45
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp * (moving ? 1 : 0)
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing

    const target = THREE.MathUtils.clamp(
      shortestAngle(yawRef.current, lookYawRef.current),
      -LOOK_YAW_MAX,
      LOOK_YAW_MAX,
    )
    lookY.current += (target - lookY.current) * (1 - Math.exp(-LOOK_SLERP * Math.min(delta, 0.05)))
    if (head.current) head.current.rotation.y = lookY.current
  })

  const h = 1
  return (
    <group ref={root}>
      <mesh position={[0, 1.15 * h, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 6, 12]} />
        <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
      </mesh>
      <group ref={head} position={[0, 1.58 * h, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 14, 12]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
      </group>
      <group ref={legL} position={[-0.1, 0.82, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
      </group>
      <group ref={legR} position={[0.1, 0.82, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
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
