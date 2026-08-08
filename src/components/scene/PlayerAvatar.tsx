import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { CAMERA, PLAYER } from '../../constants'
import { avatarPose } from '../../input/avatarPose'
import { useGameStore } from '../../store/gameStore'

type Props = {
  yawRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

const MODEL_URL = '/models/human.glb'
const TARGET_HEIGHT = PLAYER.height
const FADE = 0.2
const CROUCH_FADE = 0.18

useGLTF.preload(MODEL_URL)

type ClipKind = 'idle' | 'walk' | 'run' | 'crouchIdle' | 'crouchWalk'

function findHeadBone(root: THREE.Object3D): THREE.Bone | null {
  let found: THREE.Bone | null = null
  root.traverse((obj) => {
    if (found || !(obj as THREE.Bone).isBone) return
    const n = obj.name.toLowerCase()
    if (n === 'mixamorig:head' || n.endsWith(':head') || n === 'head') {
      found = obj as THREE.Bone
    }
  })
  if (found) return found
  root.traverse((obj) => {
    if (found || !(obj as THREE.Bone).isBone) return
    const n = obj.name.toLowerCase()
    if (n.includes('headtop') || n.includes('head_top')) {
      found = obj as THREE.Bone
    }
  })
  return found
}

/**
 * Mixamo X-Bot — idle / walk / run + tactical crouch.
 * Never scales the model for crouch; pose comes from sneak_pose / crouch clips.
 * Publishes head-bone height so the TPS camera tracks the eyes.
 */
function MixamoHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipKind | null>(null)
  const headBone = useRef<THREE.Bone | null>(null)
  const worldPos = useMemo(() => new THREE.Vector3(), [])
  const localPos = useMemo(() => new THREE.Vector3(), [])
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

  const clipNames = useMemo(() => {
    const names = animations.map((a) => a.name)
    const has = (n: string) => names.includes(n)
    return {
      idle: has('idle') ? 'idle' : names.find((n) => /idle/i.test(n)) ?? null,
      walk: has('walk') ? 'walk' : names.find((n) => /walk/i.test(n)) ?? null,
      run: has('run') ? 'run' : names.find((n) => /run|sprint/i.test(n)) ?? null,
      crouchIdle:
        names.find((n) => /crouch_idle|crouchidle/i.test(n)) ??
        (has('sneak_pose') ? 'sneak_pose' : names.find((n) => /sneak|crouch/i.test(n)) ?? null),
      crouchWalk:
        names.find((n) => /crouch_walk|crouchwalk|sneak_walk/i.test(n)) ?? null,
    }
  }, [animations])

  const { actions, mixer } = useAnimations(animations, clone)

  useEffect(() => {
    headBone.current = findHeadBone(clone)
    avatarPose.ready = !!headBone.current

    const idle = clipNames.idle ? actions[clipNames.idle] : null
    if (!idle) return
    idle.reset().setEffectiveWeight(1).fadeIn(FADE).play()
    idle.setLoop(THREE.LoopRepeat, Infinity)
    currentClip.current = 'idle'
    return () => {
      mixer.stopAllAction()
      currentClip.current = null
      avatarPose.ready = false
    }
  }, [actions, clipNames.idle, clone, mixer])

  useFrame((_, dt) => {
    if (!root.current || !modelRef.current) return
    root.current.rotation.y = yawRef.current

    const state = useGameStore.getState()
    const { moveX, moveZ } = state.input
    const { isCrouching, isSprinting } = state
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    let next: ClipKind = 'idle'
    if (isCrouching) {
      next = moving ? 'crouchWalk' : 'crouchIdle'
    } else if (moving && isSprinting) {
      next = 'run'
    } else if (moving) {
      next = 'walk'
    }

    const idleA = clipNames.idle ? actions[clipNames.idle] : null
    const walkA = clipNames.walk ? actions[clipNames.walk] : null
    const runA = clipNames.run ? actions[clipNames.run] : null
    const crouchIdleA = clipNames.crouchIdle ? actions[clipNames.crouchIdle] : null
    const crouchWalkA = clipNames.crouchWalk ? actions[clipNames.crouchWalk] : null

    if (next !== currentClip.current) {
      const prev = currentClip.current
      currentClip.current = next

      const fadeOutStand = () => {
        idleA?.fadeOut(FADE)
        walkA?.fadeOut(FADE)
        runA?.fadeOut(FADE)
      }
      const fadeOutCrouch = () => {
        crouchIdleA?.fadeOut(CROUCH_FADE)
        crouchWalkA?.fadeOut(CROUCH_FADE)
        // Layered walk used as crouch_walk substitute
        if (!crouchWalkA && prev === 'crouchWalk') walkA?.fadeOut(CROUCH_FADE)
      }

      if (next === 'idle' && idleA) {
        fadeOutCrouch()
        walkA?.fadeOut(FADE)
        runA?.fadeOut(FADE)
        idleA.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(FADE).play()
        idleA.setLoop(THREE.LoopRepeat, Infinity)
      } else if (next === 'walk' && walkA) {
        fadeOutCrouch()
        idleA?.fadeOut(FADE)
        runA?.fadeOut(FADE)
        walkA.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(FADE).play()
        walkA.setLoop(THREE.LoopRepeat, Infinity)
      } else if (next === 'run' && runA) {
        fadeOutCrouch()
        idleA?.fadeOut(FADE)
        walkA?.fadeOut(FADE)
        runA.reset().setEffectiveTimeScale(1.08).setEffectiveWeight(1).fadeIn(FADE).play()
        runA.setLoop(THREE.LoopRepeat, Infinity)
      } else if (next === 'crouchIdle') {
        fadeOutStand()
        crouchWalkA?.fadeOut(CROUCH_FADE)
        if (!crouchWalkA && prev === 'crouchWalk') walkA?.fadeOut(CROUCH_FADE)
        if (crouchIdleA) {
          crouchIdleA.reset().setEffectiveTimeScale(0.05).setEffectiveWeight(1).fadeIn(FADE).play()
          crouchIdleA.setLoop(THREE.LoopRepeat, Infinity)
        }
      } else if (next === 'crouchWalk') {
        fadeOutStand()
        if (crouchWalkA) {
          crouchIdleA?.fadeOut(CROUCH_FADE)
          crouchWalkA
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(CROUCH_FADE)
            .play()
          crouchWalkA.setLoop(THREE.LoopRepeat, Infinity)
        } else if (crouchIdleA && walkA) {
          // No dedicated crouch_walk in the GLB — layer sneak_pose + walk.
          crouchIdleA
            .reset()
            .setEffectiveTimeScale(0.35)
            .setEffectiveWeight(0.75)
            .fadeIn(CROUCH_FADE)
            .play()
          crouchIdleA.setLoop(THREE.LoopRepeat, Infinity)
          walkA
            .reset()
            .setEffectiveTimeScale(0.7)
            .setEffectiveWeight(0.5)
            .fadeIn(CROUCH_FADE)
            .play()
          walkA.setLoop(THREE.LoopRepeat, Infinity)
        } else if (crouchIdleA) {
          crouchIdleA.reset().setEffectiveTimeScale(0.35).setEffectiveWeight(1).fadeIn(FADE).play()
          crouchIdleA.setLoop(THREE.LoopRepeat, Infinity)
        }
      }
    } else if (next === 'crouchIdle' && crouchIdleA) {
      crouchIdleA.setEffectiveTimeScale(0.05)
    } else if (next === 'crouchWalk') {
      if (crouchWalkA) {
        crouchWalkA.setEffectiveTimeScale(1)
      } else {
        crouchIdleA?.setEffectiveWeight(0.75)
        crouchIdleA?.setEffectiveTimeScale(0.35)
        walkA?.setEffectiveWeight(0.5)
        walkA?.setEffectiveTimeScale(0.7)
      }
    } else if (next === 'run' && runA) {
      runA.setEffectiveTimeScale(1.08)
    }

    // Head bone → local height above feet (after this frame's pose).
    // Mixer is updated by useAnimations; sample after animation weights settle.
    if (root.current && headBone.current) {
      headBone.current.updateWorldMatrix(true, false)
      headBone.current.getWorldPosition(worldPos)
      root.current.worldToLocal(localPos.copy(worldPos))
      const eye = localPos.y + CAMERA.headEyeOffset
      const smoothed = THREE.MathUtils.damp(avatarPose.headHeight, eye, CAMERA.headFollow, dt)
      avatarPose.headHeight = THREE.MathUtils.clamp(smoothed, 0.55, PLAYER.height + 0.2)
      const standH = CAMERA.height
      const crouchH = PLAYER.crouchHeight * 0.95
      avatarPose.crouchBlend = THREE.MathUtils.clamp(
        (standH - avatarPose.headHeight) / Math.max(0.01, standH - crouchH),
        0,
        1,
      )
      avatarPose.ready = true
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

/** Capsule fallback while the GLB loads — drops torso, never squashes. */
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

    torso.current.position.y = THREE.MathUtils.lerp(0, -0.55, crouchBlend.current)
    torso.current.rotation.x = THREE.MathUtils.lerp(0, 0.35, crouchBlend.current)

    const rate = isSprinting ? 13 : 8.5
    const amp = (isSprinting ? 0.65 : 0.45) * (1 - crouchBlend.current * 0.5)
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp * (moving ? 1 : 0)
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing

    const headY = THREE.MathUtils.lerp(1.58, 1.03, crouchBlend.current)
    avatarPose.headHeight = THREE.MathUtils.damp(
      avatarPose.headHeight,
      headY,
      CAMERA.headFollow,
      dt,
    )
    avatarPose.crouchBlend = crouchBlend.current
    avatarPose.ready = true
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
