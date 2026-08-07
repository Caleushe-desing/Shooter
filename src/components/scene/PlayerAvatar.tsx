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
  hips: THREE.Bone | null
  spine: THREE.Bone | null
  spine1: THREE.Bone | null
  leftUpLeg: THREE.Bone | null
  rightUpLeg: THREE.Bone | null
  leftLeg: THREE.Bone | null
  rightLeg: THREE.Bone | null
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
 * Working Mixamo idle/walk/run.
 * Crouch = same clips + knee/hip bend after the mixer.
 * Do NOT use sneak_pose — it tears this GLB's skin apart.
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
      const mesh = obj as THREE.Mesh
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

  useFrame((_, delta) => {
    if (!root.current || !modelRef.current) return
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouched = game.crouched
    const moving =
      movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    // Only the three clips that keep the body connected.
    let next: ClipName = 'idle'
    if (moving && sprint && !crouched) next = 'run'
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
      if (crouched && next === 'walk') action.setEffectiveTimeScale(0.7)
      else if (sprint && next === 'run') action.setEffectiveTimeScale(1.08)
      else action.setEffectiveTimeScale(1)
    }

    modelRef.current.rotation.y = Math.PI
    // Feet stay planted — never sink the whole model.
    modelRef.current.position.y = footOffset

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 10, delta)
  })

  // After mixer: bend into a squat. Mixer resets bones every frame, so this is safe.
  useFrame(() => {
    const c = crouchAmt.current
    const b = bonesRef.current
    if (!b || c < 0.001) return

    // Mild squat — enough to read as crouch, not enough to shear the skin.
    if (b.hips) b.hips.position.y += c * -0.06
    if (b.spine) b.spine.rotation.x += c * 0.35
    if (b.spine1) b.spine1.rotation.x += c * 0.18
    if (b.leftUpLeg) b.leftUpLeg.rotation.x += c * 0.95
    if (b.rightUpLeg) b.rightUpLeg.rotation.x += c * 0.95
    if (b.leftLeg) b.leftLeg.rotation.x += c * -1.4
    if (b.rightLeg) b.rightLeg.rotation.x += c * -1.4
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
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const crouchAmt = useRef(0)

  useFrame((_, delta) => {
    if (!root.current) return
    root.current.rotation.y = yawRef.current
    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouched = game.crouched
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05
    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 10, delta)
    const c = crouchAmt.current
    root.current.position.y = -c * 0.25
    const rate = crouched ? 6 : sprint ? 13 : 8.5
    const amp = (crouched ? 0.35 : sprint ? 0.65 : 0.45) * (moving ? 1 : 0)
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp
    if (legL.current) legL.current.rotation.x = swing + c * 0.9
    if (legR.current) legR.current.rotation.x = -swing + c * 0.9
  })

  return (
    <group ref={root}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 6, 12]} />
        <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.58, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
      </mesh>
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
