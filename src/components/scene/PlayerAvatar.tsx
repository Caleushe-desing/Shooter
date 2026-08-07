import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'

type Props = {
  /** Lower body / root facing (walk direction). */
  yawRef: MutableRefObject<number>
  /** Camera look yaw (upper body aims toward this). */
  lookYawRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

const MODEL_URL = '/models/human.glb'
const TARGET_HEIGHT = PLAYER.height

/** ±60° — anatomical limit for the upper-chain twist. */
const LOOK_YAW_MAX = Math.PI / 3
/** Slerp rate for the procedural look offset. */
const LOOK_SLERP = 12
/** Weights must sum to 1 — spread twist so no single bone pinches the mesh. */
const LOOK_WEIGHTS = { spine2: 0.2, neck: 0.35, head: 0.45 } as const

const _worldUp = new THREE.Vector3(0, 1, 0)
const _targetLookQ = new THREE.Quaternion()
const _worldYawQ = new THREE.Quaternion()
const _worldQ = new THREE.Quaternion()
const _parentQ = new THREE.Quaternion()
const _targetLocalQ = new THREE.Quaternion()

useGLTF.preload(MODEL_URL)

type ClipName = 'idle' | 'walk' | 'run'

type UpperBones = {
  spine2: THREE.Bone | null
  neck: THREE.Bone | null
  head: THREE.Bone | null
}

function shortestAngle(from: number, to: number) {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

function findBone(root: THREE.Object3D, names: string[]): THREE.Bone | null {
  let found: THREE.Bone | null = null
  root.traverse((obj) => {
    if (found) return
    if (names.includes(obj.name) && (obj as THREE.Bone).isBone) {
      found = obj as THREE.Bone
    }
  })
  return found
}

/**
 * Apply a world-Y yaw on top of the mixer pose.
 * World → local via parent world quaternion inverse (safe for skinned bones
 * under root yaw + the model's Math.PI facing flip).
 * Does NOT call skeleton.update — caller must refresh matrixWorld first.
 */
function applyWorldYaw(bone: THREE.Bone, radians: number) {
  if (Math.abs(radians) < 1e-7) return
  // Parents must be current so getWorldQuaternion is correct.
  bone.updateWorldMatrix(true, false)

  _worldYawQ.setFromAxisAngle(_worldUp, radians)
  bone.getWorldQuaternion(_worldQ)
  // world' = worldYaw ⊗ world  (rotate in world space about Y)
  _worldQ.premultiply(_worldYawQ)

  if (bone.parent) {
    bone.parent.getWorldQuaternion(_parentQ).invert()
    _targetLocalQ.copy(_parentQ).multiply(_worldQ)
  } else {
    _targetLocalQ.copy(_worldQ)
  }

  if (
    !Number.isFinite(_targetLocalQ.x) ||
    !Number.isFinite(_targetLocalQ.y) ||
    !Number.isFinite(_targetLocalQ.z) ||
    !Number.isFinite(_targetLocalQ.w)
  ) {
    return
  }

  // Mixer already wrote the animated local quat into bone.quaternion.
  bone.quaternion.copy(_targetLocalQ)
}

/**
 * Mixamo X-Bot — idle / walk / run clips untouched.
 *
 * Layers:
 * 1) Root yaw = body facing (lower body walks with the clip).
 * 2) AnimationMixer writes full-body quaternions as usual.
 * 3) Post-mixer (priority 1): procedural world-Y look on Spine2 → Neck → Head.
 */
function MixamoHuman({ yawRef, lookYawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
  const bones = useRef<UpperBones>({ spine2: null, neck: null, head: null })
  const skins = useRef<THREE.SkinnedMesh[]>([])
  /** Smoothed pure world-Y look offset (bodyYaw → lookYaw). */
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

  // Resolve critical upper-chain bones once the clone is ready.
  useEffect(() => {
    bones.current = {
      spine2: findBone(clone, ['mixamorigSpine2', 'mixamorig:Spine2']),
      neck: findBone(clone, ['mixamorigNeck', 'mixamorig:Neck']),
      head: findBone(clone, ['mixamorigHead', 'mixamorig:Head']),
    }
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

  // Layer 1: root facing + clip selection. Bones left to the mixer.
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

  // Layer 2: AFTER AnimationMixer (drei runs mixer.update at priority 0).
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const { spine2, neck, head } = bones.current
    if (!spine2 && !neck && !head) return

    try {
      let targetYaw = shortestAngle(yawRef.current, lookYawRef.current)
      targetYaw = THREE.MathUtils.clamp(targetYaw, -LOOK_YAW_MAX, LOOK_YAW_MAX)

      // Slerp a pure world-Y quaternion toward the clamped look offset.
      _targetLookQ.setFromAxisAngle(_worldUp, targetYaw)
      lookQ.current.slerp(_targetLookQ, 1 - Math.exp(-LOOK_SLERP * dt))

      // Signed angle from (0, sin(a/2), 0, cos(a/2)).
      const yaw = 2 * Math.atan2(lookQ.current.y, lookQ.current.w)

      if (Math.abs(yaw) >= 1e-5) {
        // Parent → child so each bone sees updated parent matrices.
        if (spine2) applyWorldYaw(spine2, yaw * LOOK_WEIGHTS.spine2)
        if (neck) applyWorldYaw(neck, yaw * LOOK_WEIGHTS.neck)
        if (head) applyWorldYaw(head, yaw * LOOK_WEIGHTS.head)
      }

      // skeleton.update reads bone.matrixWorld — refresh after quat writes.
      const rootBone = spine2 ?? neck ?? head
      if (rootBone) rootBone.updateWorldMatrix(true, true)

      for (const mesh of skins.current) {
        mesh.skeleton.update()
      }
    } catch {
      // Never let look overlay kill the R3F frame loop / skinned mesh.
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
