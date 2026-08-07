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
 * Same Mixamo wiring that worked for walk/run (clone + modelRef + clips),
 * plus a squat crouch layered on the bones after the mixer.
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
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.12).play()
        action.setLoop(THREE.LoopRepeat, Infinity)
        prev?.fadeOut(0.12)
        currentClip.current = next
      }
    }

    const action = currentClip.current ? actions[currentClip.current] : null
    if (action) {
      if (crouched && next === 'walk') action.setEffectiveTimeScale(0.68)
      else if (sprint && next === 'run') action.setEffectiveTimeScale(1.08)
      else action.setEffectiveTimeScale(1)
    }

    modelRef.current.rotation.y = Math.PI
    modelRef.current.rotation.x = 0

    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 11, delta)
    const c = crouchAmt.current
    modelRef.current.position.y = footOffset + c * -0.2

    const b = bonesRef.current
    if (!b || c < 0.001) return

    if (b.hips) b.hips.position.y += c * -0.12
    if (b.spine) b.spine.rotation.x += c * 0.5
    if (b.spine1) b.spine1.rotation.x += c * 0.28
    if (b.leftUpLeg) b.leftUpLeg.rotation.x += c * 1.2
    if (b.rightUpLeg) b.rightUpLeg.rotation.x += c * 1.2
    if (b.leftLeg) b.leftLeg.rotation.x += c * -1.8
    if (b.rightLeg) b.rightLeg.rotation.x += c * -1.8
    if (b.leftArm) b.leftArm.rotation.z += c * 0.45
    if (b.rightArm) b.rightArm.rotation.z -= c * 0.45
  }, 1)

  return (
    <group ref={root}>
      <group ref={modelRef} scale={fitScale} position={[0, footOffset, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  )
}

function LoadingMark() {
  useEffect(() => {
    useGameStore.getState().setAvatarStatus('loading')
  }, [])
  return null
}

export function PlayerAvatar(props: Props) {
  return (
    <Suspense fallback={<LoadingMark />}>
      <MixamoHuman {...props} />
    </Suspense>
  )
}
