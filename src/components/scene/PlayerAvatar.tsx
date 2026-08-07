import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
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

type ClipName = 'idle' | 'walk' | 'run' | 'sneak_pose'

/**
 * Mixamo X-Bot — same class of humanoid as before, but nude (no suit).
 * Real clips: idle / walk / run / sneak_pose (agachado). Prone = lie on floor.
 * Always oriented so the chase cam sees the back.
 */
export function PlayerAvatar({ yawRef, pitchRef: _pitchRef, movingRef }: PlayerAvatarProps) {
  const root = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const propRef = useRef<THREE.Group>(null)
  const muzzleRef = useRef<THREE.Group>(null)
  const currentClip = useRef<ClipName | null>(null)
  const { scene, animations } = useGLTF(MODEL_URL)

  const clone = useMemo(() => {
    const c = cloneSkeleton(scene) as THREE.Group
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true

      // Hide gray joint orbs — body surface only (nude look).
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
    if (!root.current || !modelRef.current) return
    root.current.rotation.y = yawRef.current

    const game = useGameStore.getState()
    const stance = game.stance
    const sprint = game.input.sprint && stance === 'stand'
    const slow = game.input.slow
    const airborne = game.airborne
    const moving = movingRef.current

    let next: ClipName = 'idle'
    if (stance === 'prone') {
      next = 'idle'
    } else if (stance === 'crouch') {
      // sneak_pose = agachado humano; walk lento si se mueve agachado
      next = moving ? 'walk' : 'sneak_pose'
    } else if (airborne) {
      next = 'idle'
    } else if (moving && sprint) {
      next = 'run'
    } else if (moving) {
      next = 'walk'
    }

    if (next !== currentClip.current) {
      const prev = currentClip.current ? actions[currentClip.current] : null
      const action = actions[next]
      if (action) {
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.22).play()
        action.setLoop(THREE.LoopRepeat, Infinity)
        prev?.fadeOut(0.22)
        currentClip.current = next
      }
    }

    const action = currentClip.current ? actions[currentClip.current] : null
    if (action) {
      if (stance === 'crouch' && next === 'walk') action.setEffectiveTimeScale(0.68)
      else if (slow && next === 'walk') action.setEffectiveTimeScale(0.58)
      else if (sprint && next === 'run') action.setEffectiveTimeScale(1.05)
      else if (stance === 'prone') action.setEffectiveTimeScale(0.3)
      else action.setEffectiveTimeScale(1)
    }

    let y = 0
    let pitch = 0
    if (stance === 'crouch' && moving) {
      // Slight squat while using walk clip crouched
      y = -0.08
      pitch = 0.18
    } else if (stance === 'prone') {
      // Tenderse en el piso (barriga al suelo, espalda hacia arriba / cámara)
      y = 0.32
      pitch = 1.38
    } else if (airborne) {
      y = 0.05
      pitch = -0.05
    }

    // Mixamo +Z forward → flip so camera on +Z sees the back.
    modelRef.current.rotation.x = THREE.MathUtils.damp(modelRef.current.rotation.x, pitch, 14, delta)
    modelRef.current.rotation.y = Math.PI
    modelRef.current.rotation.z = 0
    modelRef.current.position.y = THREE.MathUtils.damp(modelRef.current.position.y, y, 14, delta)
  })

  return (
    <group ref={root}>
      <group ref={modelRef}>
        <primitive object={clone} />
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
