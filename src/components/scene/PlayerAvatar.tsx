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
 * Mixamo walk/run (working path) + real squat crouch:
 * bend hips/knees in place — never shove the whole mesh into the floor.
 */
function MixamoHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
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
      const mesh = obj as THREE.SkinnedMesh
      if (!mesh.isMesh) return
      mesh.frustumCulled = false
      mesh.castShadow = true
      mesh.receiveShadow = true
      const n = (mesh.name || '').toLowerCase()
      if (n === 'beta_joints' || n.endsWith('_joints')) {
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
        std.side = THREE.FrontSide
        std.transparent = false
        std.opacity = 1
        std.needsUpdate = true
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
    }
  }, [clone])

  const { actions, mixer } = useAnimations(animations, modelRef)

  useEffect(() => {
    useGameStore.getState().setAvatarStatus('ready')
    const idle = actions.idle
    if (!idle) return
    idle.reset().setEffectiveWeight(1).play()
    idle.setLoop(THREE.LoopRepeat, Infinity)
    currentClip.current = 'idle'
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, mixer])

  useFrame((_, delta) => {
    if (!root.current || !modelRef.current) return
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
      if (crouched && next === 'walk') action.setEffectiveTimeScale(0.65)
      else if (sprint && next === 'run') action.setEffectiveTimeScale(1.08)
      else action.setEffectiveTimeScale(1)
    }

    // Back to camera. Feet stay planted — do NOT sink the whole model.
    modelRef.current.rotation.y = Math.PI
    modelRef.current.rotation.x = 0
    modelRef.current.position.y = footOffset

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 10, delta)
  })

  // After mixer: fold into a squat so the mesh stays connected and feet stay on the floor.
  useFrame(() => {
    const c = crouchAmt.current
    const b = bonesRef.current
    if (!b || c < 0.001) return

    // Hip drop in bone space (small) + thigh/shin fold = standing squat.
    if (b.hips) b.hips.position.y += c * -0.08
    if (b.spine) b.spine.rotation.x += c * 0.4
    if (b.spine1) b.spine1.rotation.x += c * 0.22

    if (b.leftUpLeg) b.leftUpLeg.rotation.x += c * 1.05
    if (b.rightUpLeg) b.rightUpLeg.rotation.x += c * 1.05
    if (b.leftLeg) b.leftLeg.rotation.x += c * -1.55
    if (b.rightLeg) b.rightLeg.rotation.x += c * -1.55

    // Arms rest closer to thighs while crouched.
    if (b.leftArm) b.leftArm.rotation.z += c * 0.35
    if (b.rightArm) b.rightArm.rotation.z -= c * 0.35
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
  const hip = useRef<THREE.Group>(null)
  const thighL = useRef<THREE.Group>(null)
  const thighR = useRef<THREE.Group>(null)
  const shinL = useRef<THREE.Group>(null)
  const shinR = useRef<THREE.Group>(null)
  const crouchAmt = useRef(0)

  useEffect(() => {
    useGameStore.getState().setAvatarStatus('loading')
  }, [])

  useFrame((_, delta) => {
    if (!root.current || !hip.current) return
    root.current.rotation.y = yawRef.current
    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouched = game.crouched
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 10, delta)
    const c = crouchAmt.current

    // Procedural squat: hips down, thighs/shins fold — feet stay near y=0.
    hip.current.position.y = 0.95 - c * 0.38
    if (thighL.current) thighL.current.rotation.x = c * 1.1
    if (thighR.current) thighR.current.rotation.x = c * 1.1
    if (shinL.current) shinL.current.rotation.x = c * -1.5
    if (shinR.current) shinR.current.rotation.x = c * -1.5

    const rate = crouched ? 6 : sprint ? 13 : 8.5
    const amp = (crouched ? 0.25 : sprint ? 0.65 : 0.45) * (moving ? 1 : 0)
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp
    if (thighL.current) thighL.current.rotation.x += swing
    if (thighR.current) thighR.current.rotation.x -= swing
  })

  return (
    <group ref={root}>
      <group ref={hip}>
        <mesh position={[0, 0.28, 0]}>
          <capsuleGeometry args={[0.18, 0.42, 6, 12]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <sphereGeometry args={[0.13, 14, 12]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
        <mesh position={[-0.24, 0.3, 0]}>
          <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
        <mesh position={[0.24, 0.3, 0]}>
          <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
        <group ref={thighL} position={[-0.1, 0, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
            <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
          </mesh>
          <group ref={shinL} position={[0, -0.36, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
              <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
            </mesh>
          </group>
        </group>
        <group ref={thighR} position={[0.1, 0, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
            <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
          </mesh>
          <group ref={shinR} position={[0, -0.36, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
              <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
            </mesh>
          </group>
        </group>
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
