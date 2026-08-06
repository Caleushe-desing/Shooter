import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import {
  PLAYER,
  CAMERA,
  resolveCircleBoxCollision,
  COMBAT,
  SCOPE,
  hipFireAimNdc,
} from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { getMuzzleWorldPosition } from '../../store/muzzle'
import { setPlayerPosition } from '../../store/enemyRuntime'
import { useSettingsStore } from '../../store/settings'
import { maxCameraBoomDistance } from '../../store/cameraCollision'
import { PlayerAvatar } from './PlayerAvatar'

/** Scoped optics stay centered in the eyepiece. */
const SCOPE_AIM = new THREE.Vector2(0, 0)
const _pivotWorld = new THREE.Vector3()
const _idealLocal = new THREE.Vector3()
const _idealWorld = new THREE.Vector3()
const _camDir = new THREE.Vector3()

/**
 * No Man's Sky-style third person:
 * - Over-right-shoulder camera so the back sits on the left of the frame
 * - Hip-fire reticle shifted off-center; hitscan goes through that point
 * - Body still faces look yaw and the gun tips with pitch
 */
export function PlayerController() {
  const rig = useRef<THREE.Group>(null)
  const yawPivot = useRef<THREE.Group>(null)
  const pitchObj = useRef<THREE.Group>(null)
  const yaw = useRef(0)
  const pitch = useRef(0)
  /** 0–1 of the ideal shoulder boom; pulled in when walls block the view. */
  const camScale = useRef(1)
  const pos = useRef(new THREE.Vector3(PLAYER.spawn.x, 0, PLAYER.spawn.z))
  const moving = useRef(false)
  const lastFire = useRef(0)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())
  const aimOrigin = useRef(new THREE.Vector3())
  const aimDir = useRef(new THREE.Vector3())
  const muzzlePos = useRef(new THREE.Vector3())
  const hipAim = useMemo(() => {
    const { x, y } = hipFireAimNdc()
    return new THREE.Vector2(x, y)
  }, [])
  const aimRaycaster = useMemo(() => new THREE.Raycaster(), [])
  const { gl, camera } = useThree()

  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  useEffect(() => {
    const el = gl.domElement

    const onMouseDown = (e: MouseEvent) => {
      if (isTouch) return
      if (document.pointerLockElement === el && e.button === 0) {
        useGameStore.getState().queueFire()
      }
    }

    const onClick = () => {
      if (isTouch || useSettingsStore.getState().open) return
      if (document.pointerLockElement !== el) {
        el.requestPointerLock()
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return
      const sensitivity =
        PLAYER.lookSensitivityDesktop * useSettingsStore.getState().lookSpeed
      useGameStore.getState().addLook(
        e.movementX * sensitivity,
        e.movementY * sensitivity,
      )
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (useSettingsStore.getState().open) return
      if (e.code === 'Space' || e.code === 'KeyF') {
        e.preventDefault()
        useGameStore.getState().queueFire()
      }
      if (e.code === 'KeyZ') {
        e.preventDefault()
        useGameStore.getState().toggleScope()
      }
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      if (isTouch || useSettingsStore.getState().open) return
      useGameStore.getState().toggleScope()
    }

    el.addEventListener('click', onClick)
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      el.removeEventListener('click', onClick)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [gl, isTouch])

  useEffect(() => {
    const keys = new Set<string>()

    const syncMove = () => {
      let x = 0
      let z = 0
      if (keys.has('KeyW') || keys.has('ArrowUp')) z -= 1
      if (keys.has('KeyS') || keys.has('ArrowDown')) z += 1
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1
      const len = Math.hypot(x, z)
      if (len > 0) {
        x /= len
        z /= len
      }
      if (!isTouch) useGameStore.getState().setMove(x, z)
    }

    const down = (e: KeyboardEvent) => {
      keys.add(e.code)
      syncMove()
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      syncMove()
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [isTouch])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const store = useGameStore.getState()
    if (!rig.current || !yawPivot.current || !pitchObj.current) return

    setPlayerPosition(pos.current.x, PLAYER.eyeHeight, pos.current.z)
    if (store.sectorCleared || store.caught) return
    if (useSettingsStore.getState().open) return

    const targetFov = store.scoped ? SCOPE.zoomedFov : SCOPE.baseFov
    const perspective = camera as THREE.PerspectiveCamera
    if (perspective.isPerspectiveCamera && Math.abs(perspective.fov - targetFov) > 0.01) {
      perspective.fov = THREE.MathUtils.damp(
        perspective.fov,
        targetFov,
        SCOPE.transitionSpeed,
        dt,
      )
      perspective.updateProjectionMatrix()
    }
    const zoomFactor = perspective.isPerspectiveCamera
      ? perspective.fov / SCOPE.baseFov
      : 1

    const { dx, dy } = store.consumeLook()
    yaw.current -= dx * zoomFactor
    pitch.current = THREE.MathUtils.clamp(
      pitch.current - dy * zoomFactor,
      PLAYER.pitchMin,
      PLAYER.pitchMax,
    )

    yawPivot.current.rotation.y = yaw.current
    pitchObj.current.rotation.x = pitch.current + CAMERA.pitchBias

    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))

    const { moveX, moveZ } = store.input
    wish.current
      .set(0, 0, 0)
      .addScaledVector(right.current, moveX)
      .addScaledVector(forward.current, -moveZ)

    moving.current = wish.current.lengthSq() > 1e-6

    if (moving.current) {
      const scopePenalty = store.scoped ? SCOPE.moveScale : 1
      const speed = PLAYER.speed * useSettingsStore.getState().moveSpeed * scopePenalty
      wish.current.normalize().multiplyScalar(speed * dt)
      const nextX = pos.current.x + wish.current.x
      const nextZ = pos.current.z + wish.current.z
      const resolved = resolveCircleBoxCollision(nextX, nextZ, PLAYER.radius)
      pos.current.x = resolved.x
      pos.current.z = resolved.z
    }

    pos.current.y = 0
    rig.current.position.set(pos.current.x, 0, pos.current.z)
    setPlayerPosition(pos.current.x, PLAYER.eyeHeight, pos.current.z)

    // --- Chase boom with wall/crate collision so the pup never vanishes ---
    const desiredZ = store.scoped ? CAMERA.scopedDistance : CAMERA.distance
    const shoulder = store.scoped ? CAMERA.shoulder * 0.35 : CAMERA.shoulder

    // Orient pivots first, then probe the ideal lens point in world space.
    rig.current.updateWorldMatrix(true, true)
    yawPivot.current.getWorldPosition(_pivotWorld)
    _idealLocal.set(shoulder, 0, desiredZ)
    _idealWorld.copy(_idealLocal).applyMatrix4(pitchObj.current.matrixWorld)
    _camDir.copy(_idealWorld).sub(_pivotWorld)
    const idealLen = Math.max(_camDir.length(), 1e-6)
    const allowed = maxCameraBoomDistance(_pivotWorld, _camDir, idealLen)
    const targetScale = THREE.MathUtils.clamp(allowed / idealLen, CAMERA.minDistance / idealLen, 1)

    // Snap in against walls; ease back out when the path clears.
    if (targetScale < camScale.current) {
      camScale.current = THREE.MathUtils.damp(
        camScale.current,
        targetScale,
        CAMERA.collisionPullSpeed,
        dt,
      )
      if (camScale.current > targetScale) camScale.current = targetScale
    } else {
      camScale.current = THREE.MathUtils.damp(
        camScale.current,
        targetScale,
        CAMERA.boomSpeed,
        dt,
      )
    }

    camera.position.copy(_idealLocal).multiplyScalar(camScale.current)

    const now = performance.now()
    if (store.consumeFire() && now - lastFire.current >= COMBAT.fireCooldownMs) {
      lastFire.current = now
      rig.current.updateWorldMatrix(true, true)

      // Hip fire: ray through the off-center reticle. Scoped: eyepiece center.
      const aimPoint = store.scoped ? SCOPE_AIM : hipAim
      aimRaycaster.setFromCamera(aimPoint, camera)
      aimOrigin.current.copy(aimRaycaster.ray.origin)
      aimDir.current.copy(aimRaycaster.ray.direction)

      const hasMuzzle = getMuzzleWorldPosition(muzzlePos.current)
      store.spawnTracer(
        aimOrigin.current,
        aimDir.current,
        hasMuzzle ? muzzlePos.current : undefined,
      )
    }
  })

  return (
    <group ref={rig} position={[PLAYER.spawn.x, 0, PLAYER.spawn.z]}>
      <PlayerAvatar yawRef={yaw} pitchRef={pitch} movingRef={moving} />

      <group ref={yawPivot} position={[0, CAMERA.height, 0]}>
        <group ref={pitchObj}>
          <PerspectiveCamera
            makeDefault
            fov={SCOPE.baseFov}
            near={CAMERA.near}
            far={CAMERA.far}
            position={[CAMERA.shoulder, 0, CAMERA.distance]}
          />
        </group>
      </group>
    </group>
  )
}
