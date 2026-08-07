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

type ClipName = 'idle' | 'walk' | 'run'

/**
 * Mixamo X-Bot nude human — idle / walk / run.
 * Restored from the working clip setup (modelRef + real clip names).
 */
function MixamoHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const crouchRoot = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
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
    if (!root.current || !modelRef.current || !crouchRoot.current) return
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouched = game.crouched
    const moving =
      movingRef.current || Math.hypot(moveX, moveZ) > 0.05

    // Same clip logic as the working walk demo — no run while crouched.
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

    // Crouch is a parent transform only — does not touch Mixamo bones/clips.
    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 12, delta)
    const c = crouchAmt.current
    crouchRoot.current.position.y = c * -0.42
    crouchRoot.current.rotation.x = c * 0.35

    // Mixamo faces +Z; flip so chase cam on +Z sees the back.
    modelRef.current.rotation.y = Math.PI
  })

  return (
    <group ref={root}>
      <group ref={crouchRoot}>
        <group ref={modelRef} scale={fitScale} position={[0, footOffset, 0]}>
          <primitive object={clone} />
        </group>
      </group>
    </group>
  )
}

/** Simple capsule while the GLB loads — also animates so movement is obvious. */
function FallbackHuman({ yawRef, movingRef }: Props) {
  const root = useRef<THREE.Group>(null)
  const crouchRoot = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const crouchAmt = useRef(0)

  useFrame((_, delta) => {
    if (!root.current || !crouchRoot.current) return
    root.current.rotation.y = yawRef.current
    const game = useGameStore.getState()
    const { moveX, moveZ, sprint } = game.input
    const crouched = game.crouched
    const moving = movingRef.current || Math.hypot(moveX, moveZ) > 0.05
    crouchAmt.current = THREE.MathUtils.damp(crouchAmt.current, crouched ? 1 : 0, 12, delta)
    crouchRoot.current.position.y = crouchAmt.current * -0.35
    crouchRoot.current.rotation.x = crouchAmt.current * 0.3
    const rate = crouched ? 6 : sprint ? 13 : 8.5
    const amp = (crouched ? 0.35 : sprint ? 0.65 : 0.45) * (moving ? 1 : 0)
    const swing = Math.sin(performance.now() * 0.001 * rate) * amp
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
  })

  const h = 1
  return (
    <group ref={root}>
      <group ref={crouchRoot}>
        <mesh position={[0, 1.15 * h, 0]} castShadow>
          <capsuleGeometry args={[0.18, 0.5, 6, 12]} />
          <meshStandardMaterial color={PLAYER.skin} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.58 * h, 0]} castShadow>
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
