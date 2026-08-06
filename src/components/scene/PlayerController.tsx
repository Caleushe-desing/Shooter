import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { PLAYER, CAMERA, resolveCircleBoxCollision, COMBAT, SCOPE } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { getMuzzleWorldPosition } from '../../store/muzzle'
import { setPlayerPosition } from '../../store/enemyRuntime'
import { useSettingsStore } from '../../store/settings'
import { PlayerAvatar } from './PlayerAvatar'

/**
 * Third-person chase cam locked on the player's back.
 * Shots always fire along the body's forward aim (never camera-side rays).
 */
export function PlayerController() {
  const rig = useRef<THREE.Group>(null)
  const yawPivot = useRef<THREE.Group>(null)
  const pitchObj = useRef<THREE.Group>(null)
  const yaw = useRef(0)
  const pitch = useRef(0)
  const boomDistance = useRef<number>(CAMERA.distance)
  const pos = useRef(new THREE.Vector3(PLAYER.spawn.x, 0, PLAYER.spawn.z))
  const moving = useRef(false)
  const lastFire = useRef(0)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())
  const aimOrigin = useRef(new THREE.Vector3())
  const aimDir = useRef(new THREE.Vector3())
  const muzzlePos = useRef(new THREE.Vector3())
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

    // Enemies still need the player's position while the round is over.
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

    const targetBoom = store.scoped ? CAMERA.scopedDistance : CAMERA.distance
    boomDistance.current = THREE.MathUtils.damp(
      boomDistance.current,
      targetBoom,
      CAMERA.boomSpeed,
      dt,
    )
    // Dead-center behind the spine; camera looks toward -Z (the character's front).
    camera.position.set(CAMERA.shoulder, 0, boomDistance.current)

    const { dx, dy } = store.consumeLook()
    yaw.current -= dx * zoomFactor
    pitch.current = THREE.MathUtils.clamp(
      pitch.current - dy * zoomFactor,
      PLAYER.pitchMin,
      PLAYER.pitchMax,
    )

    yawPivot.current.rotation.y = yaw.current
    // Bias pitch slightly so the chase cam always frames the back.
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

    const now = performance.now()
    if (store.consumeFire() && now - lastFire.current >= COMBAT.fireCooldownMs) {
      lastFire.current = now
      // Sync gun pose before reading the muzzle tip.
      rig.current.updateWorldMatrix(true, true)

      // Fire straight out the character's front (yaw + pitch), not a camera ray.
      const cp = Math.cos(pitch.current)
      const sp = Math.sin(pitch.current)
      aimDir.current
        .set(
          -Math.sin(yaw.current) * cp,
          sp,
          -Math.cos(yaw.current) * cp,
        )
        .normalize()

      const hasMuzzle = getMuzzleWorldPosition(muzzlePos.current)
      if (hasMuzzle) {
        aimOrigin.current.copy(muzzlePos.current)
      } else {
        aimOrigin.current.set(
          pos.current.x,
          PLAYER.eyeHeight * 0.9,
          pos.current.z,
        )
        aimOrigin.current.addScaledVector(forward.current, 0.45)
      }

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

      {/* Chase pivots on the upper back; boom stays centered on the spine. */}
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
