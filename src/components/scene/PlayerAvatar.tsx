import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { COLORS, PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setMuzzleObject } from '../../store/muzzle'

type PlayerAvatarProps = {
  yawRef: MutableRefObject<number>
  pitchRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

const MODEL_URL = '/models/human.glb'

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

/** Simple nude placeholder so the back is always visible while the GLB loads. */
function FallbackHuman({ yawRef }: { yawRef: MutableRefObject<number> }) {
  const root = useRef<THREE.Group>(null)
  useFrame(() => {
    if (root.current) root.current.rotation.y = yawRef.current
  })
  const h = PLAYER.height
  return (
    <group ref={root}>
      <mesh position={[0, 0.95 * h, 0]} castShadow>
        <capsuleGeometry args={[0.16 * h, 0.55 * h, 6, 10]} />
        <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55 * h, 0]} castShadow>
        <sphereGeometry args={[0.14 * h, 12, 10]} />
        <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.62 * h, 0.05]} castShadow>
        <sphereGeometry args={[0.145 * h, 10, 8]} />
        <meshStandardMaterial color={PLAYER.hair} roughness={0.85} />
      </mesh>
    </group>
  )
}

function MixamoHuman({ yawRef, movingRef }: PlayerAvatarProps) {
  const root = useRef<THREE.Group>(null)
  const stanceRef = useRef<THREE.Group>(null)
  const animRoot = useRef<THREE.Group>(null)
  const propRef = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
  const bonesRef = useRef<BoneMap | null>(null)
  const crouchAmt = useRef(0)
  const jumpAmt = useRef(0)
  const proneAmt = useRef(0)
  const modelScale = useRef(1)
  const { scene, animations } = useGLTF(MODEL_URL)

  const clone = useMemo(() => {
    const c = cloneSkeleton(scene) as THREE.Group
    // Normalize height to ~1.7m so the boom always frames the back.
    const box = new THREE.Box3().setFromObject(c)
    const size = new THREE.Vector3()
    box.getSize(size)
    const targetH = 1.7
    modelScale.current = size.y > 0.1 ? targetH / size.y : 1
    c.scale.setScalar(modelScale.current)
    // Plant feet on y=0
    const box2 = new THREE.Box3().setFromObject(c)
    c.position.y -= box2.min.y

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
    return c
  }, [scene])

  const hand = useMemo(
    () => findBone(clone, ['mixamorig:RightHand', 'mixamorigRightHand']),
    [clone],
  )

  useLayoutEffect(() => {
    bonesRef.current = {
      hips: findBone(clone, ['mixamorig:Hips', 'mixamorigHips']),
      spine: findBone(clone, ['mixamorig:Spine', 'mixamorigSpine']),
      spine1: findBone(clone, ['mixamorig:Spine1', 'mixamorigSpine1']),
      leftUpLeg: findBone(clone, ['mixamorig:LeftUpLeg', 'mixamorigLeftUpLeg']),
      rightUpLeg: findBone(clone, ['mixamorig:RightUpLeg', 'mixamorigRightUpLeg']),
      leftLeg: findBone(clone, ['mixamorig:LeftLeg', 'mixamorigLeftLeg']),
      rightLeg: findBone(clone, ['mixamorig:RightLeg', 'mixamorigRightLeg']),
      leftArm: findBone(clone, ['mixamorig:LeftArm', 'mixamorigLeftArm']),
      rightArm: findBone(clone, ['mixamorig:RightArm', 'mixamorigRightArm']),
      leftShoulder: findBone(clone, ['mixamorig:LeftShoulder', 'mixamorigLeftShoulder']),
      rightShoulder: findBone(clone, ['mixamorig:RightShoulder', 'mixamorigRightShoulder']),
    }
  }, [clone])

  const { actions, mixer } = useAnimations(animations, animRoot)

  useLayoutEffect(() => {
    setMuzzleObject(muzzleRef.current)
    return () => setMuzzleObject(null)
  }, [])

  useLayoutEffect(() => {
    const prop = propRef.current
    if (!hand || !prop) return
    hand.add(prop)
    return () => {
      hand.remove(prop)
    }
  }, [hand])

  useEffect(() => {
    const idle = actions.idle
    if (idle) {
      idle.reset().fadeIn(0.25).play()
      idle.setLoop(THREE.LoopRepeat, Infinity)
      currentClip.current = 'idle'
    }
    return () => {
      mixer?.stopAllAction()
    }
  }, [actions, mixer])

  useFrame((_, delta) => {
    if (!root.current || !stanceRef.current) return
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const stance = game.stance
    const sprint = game.input.sprint && stance === 'stand'
    const slow = game.input.slow
    const airborne = game.airborne
    const moving = movingRef.current

    let next: ClipName = 'idle'
    if (stance === 'prone') next = 'idle'
    else if (airborne) next = 'idle'
    else if (moving && sprint && stance === 'stand') next = 'run'
    else if (moving) next = 'walk'
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
      if (stance === 'crouch' && next === 'walk') action.setEffectiveTimeScale(0.72)
      else if (slow && next === 'walk') action.setEffectiveTimeScale(0.58)
      else if (sprint && next === 'run') action.setEffectiveTimeScale(1.05)
      else if (stance === 'prone') action.setEffectiveTimeScale(0.25)
      else action.setEffectiveTimeScale(1)
    }

    const crouchTarget = stance === 'crouch' ? 1 : 0
    const jumpTarget = airborne && stance !== 'prone' ? 1 : 0
    const proneTarget = stance === 'prone' ? 1 : 0
    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouchTarget, 12, delta)
    jumpAmt.current = THREE.MathUtils.damp(jumpAmt.current, jumpTarget, 10, delta)
    proneAmt.current = THREE.MathUtils.damp(proneAmt.current, proneTarget, 10, delta)

    const c = crouchAmt.current
    const j = jumpAmt.current
    const p = proneAmt.current

    // Prone de guata: pitch negativo (barriga al piso, espalda a la cámara).
    const stanceY = c * -0.42 + p * 0.28 + j * 0.04
    const stancePitch = p * -1.42
    stanceRef.current.position.y = THREE.MathUtils.damp(stanceRef.current.position.y, stanceY, 14, delta)
    stanceRef.current.rotation.x = THREE.MathUtils.damp(
      stanceRef.current.rotation.x,
      stancePitch,
      12,
      delta,
    )

    const b = bonesRef.current
    if (!b) return

    if (b.hips) b.hips.position.y += c * -0.12 + j * 0.02
    if (b.spine) b.spine.rotation.x += c * 0.35 + j * 0.1
    if (b.spine1) b.spine1.rotation.x += c * 0.2

    const thigh = c * 1.05 + j * 0.85
    const shin = c * -1.55 + j * -1.25
    if (b.leftUpLeg) b.leftUpLeg.rotation.x += thigh
    if (b.rightUpLeg) b.rightUpLeg.rotation.x += thigh
    if (b.leftLeg) b.leftLeg.rotation.x += shin
    if (b.rightLeg) b.rightLeg.rotation.x += shin

    const armUp = j * -2.4 + c * -0.45
    const shoulderLift = j * 0.55
    if (b.leftArm) b.leftArm.rotation.x += armUp
    if (b.rightArm) b.rightArm.rotation.x += armUp
    if (b.leftShoulder) b.leftShoulder.rotation.y += shoulderLift
    if (b.rightShoulder) b.rightShoulder.rotation.y -= shoulderLift
    if (b.leftArm) b.leftArm.rotation.z += p * 0.35
    if (b.rightArm) b.rightArm.rotation.z += p * -0.35
  }, 1)

  return (
    <group ref={root}>
      <group ref={stanceRef}>
        <group rotation={[0, Math.PI, 0]}>
          <group ref={animRoot}>
            <primitive object={clone} />
          </group>
        </group>
      </group>
      <group ref={propRef} position={[0, 0.03, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, -0.08]}>
          <boxGeometry args={[0.035, 0.045, 0.2]} />
          <meshStandardMaterial color={COLORS.gunMetal} roughness={0.4} metalness={0.45} />
        </mesh>
        <group ref={muzzleRef} position={[0, 0, -0.2]} />
      </group>
    </group>
  )
}

/**
 * Nude Mixamo human with walk/crouch/jump/prone poses.
 * Fallback body shows immediately so the camera always has a back to frame.
 */
export function PlayerAvatar(props: PlayerAvatarProps) {
  return (
    <Suspense fallback={<FallbackHuman yawRef={props.yawRef} />}>
      <MixamoHuman {...props} />
    </Suspense>
  )
}
