import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { PLAYER, CAMERA, clampToArena } from '../../constants'
import { resolveCircleSolids } from '../../map/proceduralLayout'
import { useGameStore } from '../../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { mobileLookStick } from '../../input/mobileLookStick'

/**
 * Character controller: walk / run / jump + TPS / FPS / top camera.
 * Collides against procedural building solids.
 */
export function PlayerController() {
  const { gl, camera } = useThree()
  const rig = useRef<THREE.Group>(null)
  const avatarRoot = useRef<THREE.Group>(null)
  const yawPivot = useRef<THREE.Group>(null)
  const pitchObj = useRef<THREE.Group>(null)
  const lookYaw = useRef(0)
  const lookPitch = useRef<number>(PLAYER.pitchDefault)
  const bodyYaw = useRef(0)
  const moving = useRef(false)
  const spawn = useGameStore.getState().map.spawn
  const pos = useRef(new THREE.Vector3(spawn.x, 0, spawn.z))
  const velY = useRef(0)
  const grounded = useRef(true)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())
  const runId = useRef(useGameStore.getState().runId)
  const lastCamMode = useRef(useGameStore.getState().cameraMode)
  const boomLen = useRef(Math.hypot(CAMERA.shoulder, CAMERA.lift, CAMERA.distance))

  useEffect(() => {
    const el = gl.domElement
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* ignore InvalidStateError when capture is unavailable */
      }
      el.requestPointerLock?.()
    }
    const onPointerMove = (e: PointerEvent) => {
      if (document.pointerLockElement !== el && !(e.buttons & 1)) return
      const sens =
        'ontouchstart' in window ? PLAYER.lookSensitivityMobile : PLAYER.lookSensitivity
      useGameStore.getState().addLook(e.movementX * sens, e.movementY * sens)
    }
    const onWheel = (e: WheelEvent) => {
      if (useGameStore.getState().cameraMode !== 'top') return
      e.preventDefault()
      useGameStore.getState().adjustTopZoom(e.deltaY * CAMERA.topZoomWheel)
    }
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useEffect(() => {
    const keys = new Set<string>()
    const syncMoveSprint = () => {
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
      const game = useGameStore.getState()
      game.setMove(x, z)
      game.setSprint(keys.has('ShiftLeft') || keys.has('ShiftRight'))
    }
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) useGameStore.getState().requestJump()
        return
      }
      if (e.code === 'KeyV' && !e.repeat) {
        e.preventDefault()
        useGameStore.getState().toggleCameraMode()
        return
      }
      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault()
        useGameStore.getState().regenerateMap()
        return
      }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault()
        useGameStore.getState().adjustTopZoom(-CAMERA.topZoomStep)
        return
      }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault()
        useGameStore.getState().adjustTopZoom(CAMERA.topZoomStep)
        return
      }
      keys.add(e.code)
      syncMoveSprint()
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      syncMoveSprint()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (!rig.current || !yawPivot.current || !pitchObj.current) return

    const game = useGameStore.getState()
    const firstPerson = game.cameraMode === 'first'
    const topDown = game.cameraMode === 'top'

    if (lastCamMode.current !== game.cameraMode) {
      lastCamMode.current = game.cameraMode
      if (firstPerson) lookPitch.current = 0
      else if (topDown) lookPitch.current = -Math.PI / 2
      else lookPitch.current = PLAYER.pitchDefault
      boomLen.current = Math.hypot(CAMERA.shoulder, CAMERA.lift, CAMERA.distance)
    }
    if (game.runId !== runId.current) {
      runId.current = game.runId
      pos.current.set(game.map.spawn.x, 0, game.map.spawn.z)
      velY.current = 0
      grounded.current = true
      lookYaw.current = 0
      lookPitch.current = firstPerson ? 0 : topDown ? -Math.PI / 2 : PLAYER.pitchDefault
      bodyYaw.current = 0
    }

    const { dx, dy } = game.consumeLook()
    lookYaw.current -= dx
    if (!topDown) {
      lookPitch.current = THREE.MathUtils.clamp(
        lookPitch.current - dy,
        PLAYER.pitchMin,
        PLAYER.pitchMax,
      )
    }

    if (mobileLookStick.active) {
      lookYaw.current -= mobileLookStick.x * PLAYER.lookStickRate * dt
      if (!topDown) {
        lookPitch.current = THREE.MathUtils.clamp(
          lookPitch.current - mobileLookStick.y * PLAYER.lookStickRate * dt,
          PLAYER.pitchMin,
          PLAYER.pitchMax,
        )
      }
    }

    const { moveX, moveZ, sprint } = game.input
    const wishMoving = Math.abs(moveX) > 1e-6 || Math.abs(moveZ) > 1e-6
    const sprinting = game.tickStamina(dt, sprint, wishMoving)

    rig.current.position.set(pos.current.x, pos.current.y, pos.current.z)
    const persp = camera as THREE.PerspectiveCamera

    if (topDown) {
      yawPivot.current.rotation.y = 0
      pitchObj.current.rotation.x = -Math.PI / 2
      yawPivot.current.position.y = game.topCamHeight
      camera.position.set(0, 0, 0)
      camera.rotation.set(0, 0, 0)
      if (persp.isPerspectiveCamera) {
        persp.fov = CAMERA.topFov
        persp.near = CAMERA.topNear
        persp.far = CAMERA.topFar
        persp.updateProjectionMatrix()
      }
      forward.current.set(0, 0, -1)
      right.current.set(1, 0, 0)
    } else if (firstPerson) {
      yawPivot.current.rotation.y = lookYaw.current
      pitchObj.current.rotation.x = lookPitch.current
      yawPivot.current.position.y = CAMERA.fpHeight
      camera.position.set(0, 0, -CAMERA.fpForward)
      camera.rotation.set(0, 0, 0)
      if (persp.isPerspectiveCamera) {
        persp.fov = CAMERA.fpFov
        persp.near = CAMERA.fpNear
        persp.far = CAMERA.far
        persp.updateProjectionMatrix()
      }
      forward.current.set(-Math.sin(lookYaw.current), 0, -Math.cos(lookYaw.current))
      right.current.set(Math.cos(lookYaw.current), 0, -Math.sin(lookYaw.current))
    } else {
      yawPivot.current.rotation.y = lookYaw.current
      pitchObj.current.rotation.x = lookPitch.current
      yawPivot.current.position.y = CAMERA.height
      camera.position.set(CAMERA.shoulder, CAMERA.lift, boomLen.current)
      camera.rotation.set(0, 0, 0)
      if (persp.isPerspectiveCamera) {
        persp.fov = CAMERA.fov
        persp.near = CAMERA.near
        persp.far = CAMERA.far
        persp.updateProjectionMatrix()
      }
      forward.current.set(-Math.sin(lookYaw.current), 0, -Math.cos(lookYaw.current))
      right.current.set(Math.cos(lookYaw.current), 0, -Math.sin(lookYaw.current))
    }

    if (avatarRoot.current) avatarRoot.current.visible = !firstPerson

    wish.current
      .set(0, 0, 0)
      .addScaledVector(right.current, moveX)
      .addScaledVector(forward.current, -moveZ)

    moving.current = wish.current.lengthSq() > 1e-6
    if (moving.current) {
      const speed = PLAYER.speed * (sprinting ? PLAYER.runMul : 1)
      wish.current.normalize().multiplyScalar(speed * dt)

      // Separate-axis resolve so walls slide instead of sticky-stop.
      let nextX = pos.current.x + wish.current.x
      let nextZ = pos.current.z
      let hit = resolveCircleSolids(nextX, nextZ, PLAYER.radius, game.map.solids)
      nextX = hit.x
      nextZ = pos.current.z + wish.current.z
      hit = resolveCircleSolids(nextX, nextZ, PLAYER.radius, game.map.solids)
      const bounded = clampToArena(hit.x, hit.z, PLAYER.radius)
      pos.current.x = bounded.x
      pos.current.z = bounded.z
    }

    bodyYaw.current = lookYaw.current

    if (game.consumeJump() && grounded.current) {
      velY.current = PLAYER.jumpSpeed
      grounded.current = false
    }

    if (!grounded.current || velY.current !== 0) {
      velY.current -= PLAYER.gravity * dt
      pos.current.y += velY.current * dt
      if (velY.current <= 0 && pos.current.y <= 0) {
        pos.current.y = 0
        velY.current = 0
        grounded.current = true
      }
    } else {
      pos.current.y = 0
    }

    rig.current.position.set(pos.current.x, pos.current.y, pos.current.z)
    game.setPlayerPos(pos.current.x, pos.current.y, pos.current.z)
  }, -1)

  return (
    <group ref={rig} position={[spawn.x, 0, spawn.z]}>
      <group ref={avatarRoot}>
        <PlayerAvatar yawRef={bodyYaw} movingRef={moving} />
      </group>
      <group ref={yawPivot} position={[0, CAMERA.height, 0]}>
        <group ref={pitchObj}>
          <PerspectiveCamera
            makeDefault
            fov={CAMERA.fov}
            near={CAMERA.near}
            far={CAMERA.far}
            position={[CAMERA.shoulder, CAMERA.lift, CAMERA.distance]}
          />
        </group>
      </group>
    </group>
  )
}
