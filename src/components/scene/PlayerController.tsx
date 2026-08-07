import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import {
  PLAYER,
  CAMERA,
  COLLISION,
  clampToArena,
  resolveCircleSolids,
  findSupportY,
  resolveCeiling,
} from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { WeaponSystem } from './WeaponSystem'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import { unlockAudio } from '../../audio/gunshot'
import { mobileLookStick } from '../../input/mobileLookStick'
import { nearestAabbHit, type Aabb3 } from '../../math/aabbRay'

const MAP_SOLIDS = buildHavenInspiredMap().solids

const _pivot = new THREE.Vector3()
const _idealLocal = new THREE.Vector3()
const _boomDirLocal = new THREE.Vector3()
const _worldDir = new THREE.Vector3()
const _quat = new THREE.Quaternion()

/**
 * Player controller with TPS / FPS / top-down (2D) camera toggle.
 * Third-person boom shortens against walls so the character stays in view.
 */
export function PlayerController() {
  const rig = useRef<THREE.Group>(null)
  const avatarRoot = useRef<THREE.Group>(null)
  const yawPivot = useRef<THREE.Group>(null)
  const pitchObj = useRef<THREE.Group>(null)
  const lookYaw = useRef(0)
  const lookPitch = useRef<number>(PLAYER.pitchDefault)
  const bodyYaw = useRef(0)
  const moving = useRef(false)
  const pos = useRef(new THREE.Vector3(PLAYER.spawn.x, 0, PLAYER.spawn.z))
  const velY = useRef(0)
  const grounded = useRef(true)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())
  const runId = useRef(useGameStore.getState().runId)
  const lastCamMode = useRef(useGameStore.getState().cameraMode)
  /** Current third-person boom length (meters along ideal boom vector). */
  const boomLen = useRef(Math.hypot(CAMERA.shoulder, CAMERA.lift, CAMERA.distance))
  const { gl, camera } = useThree()

  const camBoxes = useMemo<Aabb3[]>(() => {
    const { props } = buildHavenInspiredMap()
    return props
      .filter((p) => p.solid)
      .map((p) => ({
        minX: p.x - p.w / 2,
        minY: p.y - p.h / 2,
        minZ: p.z - p.d / 2,
        maxX: p.x + p.w / 2,
        maxY: p.y + p.h / 2,
        maxZ: p.z + p.d / 2,
      }))
  }, [])

  useEffect(() => {
    const el = gl.domElement
    const isCoarse = () => window.matchMedia('(pointer: coarse)').matches
    let dragLook = false
    let lastX = 0
    let lastY = 0

    const onPointerDown = (e: PointerEvent) => {
      if (isCoarse()) return
      if (e.button !== 0) return
      unlockAudio()
      if (document.pointerLockElement !== el) {
        // Prefer pointer lock; also allow click-drag look as fallback.
        void el.requestPointerLock()
        dragLook = true
        lastX = e.clientX
        lastY = e.clientY
        el.setPointerCapture(e.pointerId)
        return
      }
      useGameStore.getState().requestFire()
    }
    const onPointerMove = (e: PointerEvent) => {
      if (isCoarse()) return
      if (document.pointerLockElement === el) return
      if (!dragLook) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      useGameStore.getState().addLook(
        dx * PLAYER.lookSensitivity,
        dy * PLAYER.lookSensitivity,
      )
    }
    const onPointerUp = (e: PointerEvent) => {
      if (dragLook) {
        dragLook = false
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      if (isCoarse()) return
      if (document.pointerLockElement !== el) return
      useGameStore.getState().addLook(
        e.movementX * PLAYER.lookSensitivity,
        e.movementY * PLAYER.lookSensitivity,
      )
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    document.addEventListener('mousemove', onMouseMove)

    const onWheel = (e: WheelEvent) => {
      if (useGameStore.getState().cameraMode !== 'top') return
      e.preventDefault()
      useGameStore.getState().adjustTopZoom(e.deltaY * CAMERA.topZoomWheel)
    }
    window.addEventListener('wheel', onWheel, { passive: false })

    let pinchDist = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const a = e.touches[0]
        const b = e.touches[1]
        pinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (useGameStore.getState().cameraMode !== 'top') return
      if (e.touches.length !== 2 || pinchDist <= 0) return
      e.preventDefault()
      const a = e.touches[0]
      const b = e.touches[1]
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const delta = pinchDist - d
      pinchDist = d
      useGameStore.getState().adjustTopZoom(delta * 0.04)
    }
    const onTouchEnd = () => {
      pinchDist = 0
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
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
      if (e.code.startsWith('Arrow') || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault()
      }
      syncMoveSprint()
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyV') {
        e.preventDefault()
        return
      }
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
      pos.current.set(PLAYER.spawn.x, 0, PLAYER.spawn.z)
      velY.current = 0
      grounded.current = true
      lookYaw.current = 0
      lookPitch.current = firstPerson ? 0 : topDown ? -Math.PI / 2 : PLAYER.pitchDefault
      bodyYaw.current = 0
      boomLen.current = Math.hypot(CAMERA.shoulder, CAMERA.lift, CAMERA.distance)
    }

    const { dx, dy } = game.consumeLook()
    // All views: yaw always responds to look. Pitch only in 1ª / 3ª.
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
    const canPlay = game.status === 'playing'

    // Keep rig transform current before camera world probes.
    rig.current.position.set(pos.current.x, pos.current.y, pos.current.z)

    const persp = camera as THREE.PerspectiveCamera
    if (topDown) {
      // Fixed north-up bird's-eye: pivot high above player, pitch straight down.
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
      // World-aligned move (screen up = −Z).
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
      // Ideal chase boom in pitch-local space (camera looks local −Z at the pivot).
      _idealLocal.set(CAMERA.shoulder, CAMERA.lift, CAMERA.distance)
      const idealLen = _idealLocal.length()
      _boomDirLocal.copy(_idealLocal).multiplyScalar(1 / idealLen)

      yawPivot.current.updateWorldMatrix(true, true)
      pitchObj.current.getWorldPosition(_pivot)
      pitchObj.current.getWorldQuaternion(_quat)
      _worldDir.copy(_boomDirLocal).applyQuaternion(_quat)

      const hitDist = nearestAabbHit(
        _pivot.x,
        _pivot.y,
        _pivot.z,
        _worldDir.x,
        _worldDir.y,
        _worldDir.z,
        idealLen,
        camBoxes,
      )
      let targetLen = idealLen
      if (hitDist < idealLen) {
        targetLen = Math.max(CAMERA.minBoomLength, hitDist - CAMERA.collidePadding)
      }

      // Snap in when blocked; ease out when clear so framing stays stable.
      if (targetLen < boomLen.current) {
        boomLen.current = targetLen
      } else {
        const k = 1 - Math.exp(-CAMERA.collideOutSmooth * dt)
        boomLen.current += (targetLen - boomLen.current) * k
      }

      camera.position.copy(_boomDirLocal).multiplyScalar(boomLen.current)
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
      .addScaledVector(right.current, canPlay ? moveX : 0)
      .addScaledVector(forward.current, canPlay ? -moveZ : 0)

    moving.current = wish.current.lengthSq() > 1e-6
    if (moving.current) {
      // Move and look are independent in every camera mode (dual-stick / WASD+mouse).
      const speed = PLAYER.speed * (sprint ? PLAYER.runMul : 1)
      wish.current.normalize().multiplyScalar(speed * dt)
      let nx = pos.current.x + wish.current.x
      let nz = pos.current.z + wish.current.z
      const bounded = clampToArena(nx, nz, PLAYER.radius)
      nx = bounded.x
      nz = bounded.z
      // Height-aware: cleared tops (jump/step) do not block XZ.
      const hit = resolveCircleSolids(
        nx,
        nz,
        PLAYER.radius,
        MAP_SOLIDS,
        pos.current.y,
        PLAYER.height,
        COLLISION.stepHeight,
      )
      pos.current.x = hit.x
      pos.current.z = hit.z
    }

    bodyYaw.current = lookYaw.current

    if (canPlay && game.consumeJump() && grounded.current) {
      velY.current = PLAYER.jumpSpeed
      grounded.current = false
    } else if (!canPlay) {
      game.consumeJump()
    }

    const supportR = PLAYER.radius * COLLISION.supportRadiusScale
    if (!grounded.current || velY.current !== 0) {
      velY.current -= PLAYER.gravity * dt
      pos.current.y += velY.current * dt
      const ceil = resolveCeiling(
        pos.current.y,
        velY.current,
        PLAYER.radius,
        pos.current.x,
        pos.current.z,
        PLAYER.height,
        MAP_SOLIDS,
      )
      pos.current.y = ceil.feetY
      velY.current = ceil.velY

      const support = findSupportY(
        pos.current.x,
        pos.current.z,
        pos.current.y,
        supportR,
        MAP_SOLIDS,
        COLLISION.landSnap,
      )
      if (velY.current <= 0 && pos.current.y <= support) {
        pos.current.y = support
        velY.current = 0
        grounded.current = true
      }
    } else {
      // Grounded: stick to platforms / fall off edges.
      const support = findSupportY(
        pos.current.x,
        pos.current.z,
        pos.current.y + 0.08,
        supportR,
        MAP_SOLIDS,
        0.4,
      )
      if (support < pos.current.y - 0.06) {
        grounded.current = false
        velY.current = 0
      } else {
        pos.current.y = support
      }
    }

    rig.current.position.set(pos.current.x, pos.current.y, pos.current.z)
    game.setPlayerPos(pos.current.x, pos.current.y, pos.current.z)
  }, -1)

  return (
    <group ref={rig} position={[PLAYER.spawn.x, 0, PLAYER.spawn.z]}>
      <group ref={avatarRoot}>
        <PlayerAvatar yawRef={bodyYaw} movingRef={moving} />
      </group>
      <WeaponSystem rigRef={rig} lookYaw={lookYaw} lookPitch={lookPitch} />
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
