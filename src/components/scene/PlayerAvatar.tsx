import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { COLORS } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setMuzzleObject } from '../../store/muzzle'

type PlayerAvatarProps = {
  yawRef: MutableRefObject<number>
  pitchRef: MutableRefObject<number>
  movingRef: MutableRefObject<boolean>
}

const MODEL_URL = '/models/human.glb'

useGLTF.preload(MODEL_URL)

/**
 * Rigged human (Mixamo) with real Idle / Walk / Run clips.
 * Stances (crouch / prone) and jump lean on those clips + pose offsets.
 */
export function PlayerAvatar({ yawRef, pitchRef, movingRef }: PlayerAvatarProps) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const propRef = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const currentClip = useRef<string | null>(null)
  const { scene, animations } = useGLTF(MODEL_URL)

  const clone = useMemo(() => {
    const c = cloneSkeleton(scene) as THREE.Group
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial
        if (!std?.isMeshStandardMaterial) continue
        // Soften the sci-fi armor into a warmer civilian palette.
        if ((std.name || '').toLowerCase().includes('visor')) {
          std.color.set('#5A8AAA')
          std.metalness = 0.35
          std.roughness = 0.45
        } else {
          std.color.set('#C4A882')
          std.metalness = 0.05
          std.roughness = 0.78
        }
      }
    })
    return c
  }, [scene])

  const hand = useMemo(() => {
    let bone: THREE.Object3D | null = null
    clone.traverse((obj) => {
      if (obj.name === 'mixamorig:RightHand' || obj.name === 'mixamorigRightHand') {
        bone = obj
      }
    })
    return bone as THREE.Object3D | null
  }, [clone])

  const { actions, mixer } = useAnimations(animations, modelRef)

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
    const idle = actions.Idle
    if (idle) {
      idle.reset().fadeIn(0.2).play()
      currentClip.current = 'Idle'
    }
    return () => {
      mixer?.stopAllAction()
    }
  }, [actions, mixer])

  useFrame((_, delta) => {
    if (!root.current || !modelRef.current) return
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const stance = game.stance
    const sprint = game.input.sprint && stance === 'stand'
    const slow = game.input.slow
    const airborne = game.airborne
    const moving = movingRef.current

    let next = 'Idle'
    if (airborne) next = 'Idle'
    else if (stance === 'prone') next = 'Idle'
    else if (moving && stance === 'crouch') next = 'Walk'
    else if (moving && sprint) next = 'Run'
    else if (moving) next = 'Walk'

    if (next !== currentClip.current) {
      const prev = currentClip.current ? actions[currentClip.current] : null
      const action = actions[next]
      if (action) {
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.18).play()
        prev?.fadeOut(0.18)
        currentClip.current = next
      }
    }

    const action = currentClip.current ? actions[currentClip.current] : null
    if (action) {
      if (stance === 'crouch') action.setEffectiveTimeScale(moving ? 0.75 : 1)
      else if (slow && next === 'Walk') action.setEffectiveTimeScale(0.65)
      else if (sprint && next === 'Run') action.setEffectiveTimeScale(1.05)
      else action.setEffectiveTimeScale(1)
    }

    let y = 0
    let pitch = 0
    let scaleY = 1
    if (stance === 'crouch') {
      y = -0.2
      pitch = 0.12
      scaleY = 0.88
    } else if (stance === 'prone') {
      y = 0.15
      pitch = 1.25
      scaleY = 0.95
    } else if (airborne) {
      y = 0.05
      pitch = -0.08
    } else {
      pitch = pitchRef.current * 0.12
    }

    // Mixamo faces +Z; our locomotion yaw faces −Z → flip 180°.
    modelRef.current.rotation.set(pitch, Math.PI, 0)
    modelRef.current.position.y = THREE.MathUtils.damp(modelRef.current.position.y, y, 12, delta)
    const sy = THREE.MathUtils.damp(modelRef.current.scale.y, scaleY, 12, delta)
    modelRef.current.scale.set(1, sy, 1)
  })

  return (
    <group ref={root}>
      <group ref={modelRef}>
        <primitive object={clone} />
      </group>
      {/* Attached to RightHand in layout effect; kept outside clone tree for React ownership. */}
      <group ref={propRef} position={[0, 0.04, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, -0.08]}>
          <boxGeometry args={[0.04, 0.05, 0.22]} />
          <meshStandardMaterial color={COLORS.gunMetal} roughness={0.4} metalness={0.45} />
        </mesh>
        <group ref={muzzleRef} position={[0, 0, -0.22]} />
      </group>
    </group>
  )
}
