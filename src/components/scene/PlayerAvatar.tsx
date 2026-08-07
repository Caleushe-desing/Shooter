import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react'
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

type BoneMap = {
  hips: THREE.Object3D | null
  spine: THREE.Object3D | null
  spine1: THREE.Object3D | null
  leftUpLeg: THREE.Object3D | null
  rightUpLeg: THREE.Object3D | null
  leftLeg: THREE.Object3D | null
  rightLeg: THREE.Object3D | null
  leftArm: THREE.Object3D | null
  rightArm: THREE.Object3D | null
  leftForeArm: THREE.Object3D | null
  rightForeArm: THREE.Object3D | null
}

function findBone(root: THREE.Object3D, names: string[]): THREE.Object3D | null {
  let found: THREE.Object3D | null = null
  root.traverse((obj) => {
    if (found) return
    if (names.includes(obj.name)) found = obj
  })
  return found
}

/**
 * Mixamo human: idle/walk/run clips + real squat crouch (knees/hips),
 * not a whole-body tip backward.
 */
function MixamoHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const dipRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
  const bonesRef = useRef<BoneMap | null>(null)
  const crouchAmt = useRef(0)
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

  useLayoutEffect(() => {
    bonesRef.current = {
      hips: findBone(clone, ['mixamorigHips', 'mixamorig:Hips']),
      spine: findBone(clone, ['mixamorigSpine', 'mixamorig:Spine']),
      spine1: findBone(clone, ['mixamorigSpine1', 'mixamorig:Spine1']),
      leftUpLeg: findBone(clone, ['mixamorigLeftUpLeg', 'mixamorig:LeftUpLeg']),
      rightUpLeg: findBone(clone, ['mixamorigRightUpLeg', 'mixamorig:RightUpLeg']),
      leftLeg: findBone(clone, ['mixamorigLeftLeg', 'mixamorig:LeftLeg']),
      rightLeg: findBone(clone, ['mixamorigRightLeg', 'mixamorig:RightLeg']),
      leftArm: findBone(clone, ['mixamorigLeftArm', 'mixamorig:LeftArm']),
      rightArm: findBone(clone, ['mixamorigRightArm', 'mixamorig:RightArm']),
      leftForeArm: findBone(clone, ['mixamorigLeftForeArm', 'mixamorig:LeftForeArm']),
      rightForeArm: findBone(clone, ['mixamorigRightForeArm', 'mixamorig:RightForeArm']),
    }
  }, [clone])

  // Bind mixer to the cloned skeleton itself so idle/walk actually drive the limbs.
  const { actions, mixer } = useAnimations(animations, clone)

  useEffect(() => {
    const idle = actions.idle
    if (!idle) return
    idle.reset().setEffectiveWeight(1).fadeIn(0.15).play()
    idle.setLoop(THREE.LoopRepeat, Infinity)
    currentClip.current = 'idle'
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, mixer])

  // After mixer (priority 1): additive human squat — hips/knees/spine, arms in.
  useFrame((_, delta) => {
    if (!root.current || !dipRef.current) return
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouched = game.crouched
    const moving =
      movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    let next: ClipName = 'idle'
    if (moving && sprint && !crouched) next = 'run'
    else if (moving) next = 'walk'

    if (next !== currentClip.current) {
      const prev = currentClip.current ? actions[currentClip.current] : null
      const action = actions[next]
      if (action) {
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.15).play()
        action.setLoop(THREE.LoopRepeat, Infinity)
        prev?.fadeOut(0.15)
        currentClip.current = next
      }
    }

    const action = currentClip.current ? actions[currentClip.current] : null
    if (action) {
      if (crouched && next === 'walk') action.setEffectiveTimeScale(0.68)
      else if (sprint && next === 'run') action.setEffectiveTimeScale(1.08)
      else action.setEffectiveTimeScale(1)
      // Keep clip weight solid so we never fall back to T-pose arms.
      if (action.getEffectiveWeight() < 0.95) action.setEffectiveWeight(1)
    }

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 11, delta)
    const c = crouchAmt.current

    // Small vertical settle only — NO whole-body tip (that looked like falling back).
    dipRef.current.position.y = c * -0.18
    dipRef.current.rotation.x = 0

    const b = bonesRef.current
    if (!b || c < 0.001) return

    // Human squat: drop hips, bend thighs + shins, slight forward spine curl.
    if (b.hips) b.hips.position.y += c * -0.14
    if (b.spine) b.spine.rotation.x += c * 0.55
    if (b.spine1) b.spine1.rotation.x += c * 0.35

    const thigh = c * 1.25
    const shin = c * -1.85
    if (b.leftUpLeg) b.leftUpLeg.rotation.x += thigh
    if (b.rightUpLeg) b.rightUpLeg.rotation.x += thigh
    if (b.leftLeg) b.leftLeg.rotation.x += shin
    if (b.rightLeg) b.rightLeg.rotation.x += shin

    // Arms closer to the torso while crouched (not open).
    if (b.leftArm) {
      b.leftArm.rotation.x += c * 0.45
      b.leftArm.rotation.z += c * 0.55
    }
    if (b.rightArm) {
      b.rightArm.rotation.x += c * 0.45
      b.rightArm.rotation.z -= c * 0.55
    }
    if (b.leftForeArm) b.leftForeArm.rotation.x += c * 0.4
    if (b.rightForeArm) b.rightForeArm.rotation.x += c * 0.4
  }, 1)

  return (
    <group ref={root}>
      <group ref={dipRef}>
        {/* Face −Z so chase cam on +Z sees the back. Scale/plant outside mixer root. */}
        <group rotation={[0, Math.PI, 0]} scale={fitScale} position={[0, footOffset, 0]}>
          <primitive object={clone} />
        </group>
      </group>
    </group>
  )
}

function FallbackHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const crouchAmt = useRef(0)

  useFrame((_, delta) => {
    if (!root.current || !torso.current) return
    root.current.rotation.y = yawRef.current
    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouched = game.crouched
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 11, delta)
    const c = crouchAmt.current

    torso.current.position.y = 1.15 - c * 0.4
    // Arms hang down by default; tuck a bit more when crouched.
    if (armL.current) armL.current.rotation.z = 0.15 + c * 0.2
    if (armR.current) armR.current.rotation.z = -0.15 - c * 0.2

    const rate = crouched ? 6 : sprint ? 13 : 8.5
    const amp = (crouched ? 0.3 : sprint ? 0.65 : 0.45) * (moving ? 1 : 0)
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp
    if (legL.current) legL.current.rotation.x = swing + c * 1.1
    if (legR.current) legR.current.rotation.x = -swing + c * 1.1
    if (armL.current) armL.current.rotation.x = -swing * 0.6 + 0.15
    if (armR.current) armR.current.rotation.x = swing * 0.6 + 0.15
  })

  return (
    <group ref={root}>
      <group ref={torso}>
        <mesh castShadow>
          <capsuleGeometry args={[0.18, 0.5, 6, 12]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.43, 0]} castShadow>
          <sphereGeometry args={[0.13, 14, 12]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
        <group ref={armL} position={[-0.22, 0.22, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
            <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
          </mesh>
        </group>
        <group ref={armR} position={[0.22, 0.22, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
            <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
          </mesh>
        </group>
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
