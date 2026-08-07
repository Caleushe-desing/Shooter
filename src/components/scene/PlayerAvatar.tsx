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
  spine2: THREE.Object3D | null
  leftUpLeg: THREE.Object3D | null
  rightUpLeg: THREE.Object3D | null
  leftLeg: THREE.Object3D | null
  rightLeg: THREE.Object3D | null
  leftArm: THREE.Object3D | null
  rightArm: THREE.Object3D | null
  leftForeArm: THREE.Object3D | null
  rightForeArm: THREE.Object3D | null
  leftShoulder: THREE.Object3D | null
  rightShoulder: THREE.Object3D | null
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
 * Mixamo X-Bot — idle / walk / run clips, plus additive human crouch & jump
 * poses layered on the skeleton after the mixer (knees, hips, spine, arms).
 */
function MixamoHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
  const bonesRef = useRef<BoneMap | null>(null)
  const crouchAmt = useRef(0)
  const jumpAmt = useRef(0)
  const landAmt = useRef(0)
  const prevAir = useRef(false)
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
      spine2: findBone(clone, ['mixamorigSpine2', 'mixamorig:Spine2']),
      leftUpLeg: findBone(clone, ['mixamorigLeftUpLeg', 'mixamorig:LeftUpLeg']),
      rightUpLeg: findBone(clone, ['mixamorigRightUpLeg', 'mixamorig:RightUpLeg']),
      leftLeg: findBone(clone, ['mixamorigLeftLeg', 'mixamorig:LeftLeg']),
      rightLeg: findBone(clone, ['mixamorigRightLeg', 'mixamorig:RightLeg']),
      leftArm: findBone(clone, ['mixamorigLeftArm', 'mixamorig:LeftArm']),
      rightArm: findBone(clone, ['mixamorigRightArm', 'mixamorig:RightArm']),
      leftForeArm: findBone(clone, ['mixamorigLeftForeArm', 'mixamorig:LeftForeArm']),
      rightForeArm: findBone(clone, ['mixamorigRightForeArm', 'mixamorig:RightForeArm']),
      leftShoulder: findBone(clone, ['mixamorigLeftShoulder', 'mixamorig:LeftShoulder']),
      rightShoulder: findBone(clone, ['mixamorigRightShoulder', 'mixamorig:RightShoulder']),
    }
  }, [clone])

  const { actions, mixer } = useAnimations(animations, modelRef)

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

  // Priority 1 = after mixer (0), so overlays sit on top of the clip.
  useFrame((_, delta) => {
    if (!root.current || !modelRef.current) return
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouch = game.stance === 'crouch'
    const airborne = game.airborne
    const moving =
      movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    // Keep locomotion clips — never switch to sneak_pose (it froze the body).
    let next: ClipName = 'idle'
    if (airborne) next = 'idle'
    else if (moving && sprint && !crouch) next = 'run'
    else if (moving) next = 'walk'

    if (next !== currentClip.current) {
      const prev = currentClip.current ? actions[currentClip.current] : null
      const action = actions[next]
      if (action) {
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.16).play()
        action.setLoop(THREE.LoopRepeat, Infinity)
        prev?.fadeOut(0.16)
        currentClip.current = next
      }
    }

    const action = currentClip.current ? actions[currentClip.current] : null
    if (action) {
      if (crouch && next === 'walk') action.setEffectiveTimeScale(0.7)
      else if (sprint && next === 'run') action.setEffectiveTimeScale(1.08)
      else action.setEffectiveTimeScale(1)
    }

    // Landing squash pulse
    if (prevAir.current && !airborne) landAmt.current = 1
    prevAir.current = airborne
    landAmt.current = THREE.MathUtils.damp(landAmt.current, 0, 8, delta)

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouch ? 1 : 0, 12, delta)
    jumpAmt.current = THREE.MathUtils.damp(jumpAmt.current, airborne ? 1 : 0, 10, delta)

    const c = crouchAmt.current
    const j = jumpAmt.current
    const land = landAmt.current

    // Root settle: crouch lowers, jump lifts slightly, land compresses.
    const yOff = c * -0.28 + j * 0.06 - land * 0.1
    modelRef.current.position.y = THREE.MathUtils.damp(
      modelRef.current.position.y,
      footOffset + yOff,
      14,
      delta,
    )
    // Mixamo faces +Z; flip so chase cam on +Z sees the back.
    modelRef.current.rotation.y = Math.PI
    modelRef.current.rotation.x = THREE.MathUtils.damp(
      modelRef.current.rotation.x,
      c * 0.12 + j * -0.06,
      12,
      delta,
    )

    const b = bonesRef.current
    if (!b) return

    // —— Human crouch: hips drop, spine rounds, knees fold ——
    if (b.hips) b.hips.position.y += c * -0.12 + land * -0.04
    if (b.spine) b.spine.rotation.x += c * 0.42 + j * 0.08 + land * 0.2
    if (b.spine1) b.spine1.rotation.x += c * 0.28 + land * 0.12
    if (b.spine2) b.spine2.rotation.x += c * 0.12

    const thigh = c * 1.15 + j * 0.55 + land * 0.7
    const shin = c * -1.65 + j * -0.95 + land * -1.1
    if (b.leftUpLeg) b.leftUpLeg.rotation.x += thigh
    if (b.rightUpLeg) b.rightUpLeg.rotation.x += thigh
    if (b.leftLeg) b.leftLeg.rotation.x += shin
    if (b.rightLeg) b.rightLeg.rotation.x += shin

    // —— Jump: arms up for balance, shoulders open ——
    const armUp = j * -2.2 + c * -0.35
    if (b.leftArm) b.leftArm.rotation.x += armUp
    if (b.rightArm) b.rightArm.rotation.x += armUp
    if (b.leftForeArm) b.leftForeArm.rotation.x += j * -0.35
    if (b.rightForeArm) b.rightForeArm.rotation.x += j * -0.35
    if (b.leftShoulder) b.leftShoulder.rotation.y += j * 0.45 + c * 0.15
    if (b.rightShoulder) b.rightShoulder.rotation.y -= j * 0.45 + c * 0.15
  }, 1)

  return (
    <group ref={root}>
      <group ref={modelRef} scale={fitScale} position={[0, footOffset, 0]}>
        <primitive object={clone} />
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
  const jumpAmt = useRef(0)

  useFrame((_, delta) => {
    if (!root.current || !torso.current) return
    root.current.rotation.y = yawRef.current
    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05
    const crouch = game.stance === 'crouch'
    const airborne = game.airborne

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouch ? 1 : 0, 12, delta)
    jumpAmt.current = THREE.MathUtils.damp(jumpAmt.current, airborne ? 1 : 0, 10, delta)
    const c = crouchAmt.current
    const j = jumpAmt.current

    torso.current.position.y = 1.15 - c * 0.35 + j * 0.08
    torso.current.rotation.x = c * 0.25

    const rate = sprint && !crouch ? 13 : crouch ? 6 : 8.5
    const amp = (sprint ? 0.65 : crouch ? 0.35 : 0.45) * (moving && !airborne ? 1 : 0)
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp
    if (legL.current) legL.current.rotation.x = swing + c * 0.9 + j * 0.5
    if (legR.current) legR.current.rotation.x = -swing + c * 0.9 + j * 0.5
    if (armL.current) armL.current.rotation.x = -swing * 0.7 - j * 1.8 - c * 0.3
    if (armR.current) armR.current.rotation.x = swing * 0.7 - j * 1.8 - c * 0.3
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
        <group ref={armL} position={[-0.26, 0.2, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
            <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
          </mesh>
        </group>
        <group ref={armR} position={[0.26, 0.2, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
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
