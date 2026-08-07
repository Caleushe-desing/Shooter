import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import {
  PLAYER,
  CAMERA,
  LOCOMOTION,
  resolveCircleBoxCollision,
  COMBAT,
  SCOPE,
  hipFireAimNdc,
  mergeColliders,
} from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { setPlayerPosition, getPlayerPosition } from '../../store/enemyRuntime'
import { useSettingsStore } from '../../store/settings'
import { maxCameraBoomDistance, fitCameraScaleOutsideSolids } from '../../store/cameraCollision'
import { useWorldStore } from '../../store/worldStore'
import { sampleHeight } from '../../world/heightmap'
import { PlayerAvatar } from './PlayerAvatar'

/** Scoped optics stay centered in the eyepiece. */
const SCOPE_AIM = new THREE.Vector2(0, 0)
const _pivotWorld = new THREE.Vector3()
const _idealLocal = new THREE.Vector3()
const _idealWorld = new THREE.Vector3()
const _camDir = new THREE.Vector3()
const _focusWorld = new THREE.Vector3()
const _focusLocal = new THREE.Vector3()
const _camWorld = new THREE.Vector3()

function dampAngle(current: number, target: number, speed: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-speed * dt))
}

/**
 * Classic third-person chase cam (GTA / San Andreas feel):
 * - Camera-relative move, soft orbit lag
 * - Rear-right boom so the pup reads in ¾ (espalda + costado)
 * - Hip-fire mira in the open space; hitscan through that point
 */
export function PlayerController() {
  const rig = useRef<THREE.Group>(null)
  const yawPivot = useRef<THREE.Group>(null)
  const pitchObj = useRef<THREE.Group>(null)
  const lookYaw = useRef(0)
  const lookPitch = useRef(0)
  const camYaw = useRef(0)
  const camPitch = useRef(0)
  const bodyYaw = useRef(0)
  /** 0–1 of the ideal shoulder boom; pulled in when walls block the view. */
  const camScale = useRef(1)
  const pos = useRef(
    new THREE.Vector3(PLAYER.spawn.x, sampleHeight(PLAYER.spawn.x, PLAYER.spawn.z), PLAYER.spawn.z),
  )
  const smoothedY = useRef(sampleHeight(PLAYER.spawn.x, PLAYER.spawn.z))
  const velY = useRef(0)
  const grounded = useRef(true)
  const camHeightSmooth = useRef<number>(LOCOMOTION.camHeight.stand)
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

    const uiBlocking = () => {
      const w = useWorldStore.getState()
      return w.inventoryOpen || w.mapOpen
    }

    const onMouseDown = (e: MouseEvent) => {
      if (isTouch) return
      if (uiBlocking()) return
      if (document.pointerLockElement === el && e.button === 0) {
        useGameStore.getState().queueFire()
      }
    }

    const onClick = () => {
      if (isTouch || useSettingsStore.getState().open) return
      if (uiBlocking()) return
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
      const world = useWorldStore.getState()
      const p = getPlayerPosition()

      if (e.code === 'Escape') {
        world.setBuildMode(null)
        if (world.mapOpen) {
          world.setMapOpen(false)
          return
        }
        if (world.inventoryOpen) world.setInventoryOpen(false)
      }
      if (
        (world.inventoryOpen || world.mapOpen) &&
        e.code !== 'KeyI' &&
        e.code !== 'Escape'
      ) {
        return
      }
      const game = useGameStore.getState()
      if (e.code === 'Space') {
        e.preventDefault()
        if (world.buildMode) {
          world.placeBuilding(world.buildMode, p.x, p.z, 0)
          return
        }
        game.queueJump()
        return
      }
      if (e.code === 'KeyF') {
        e.preventDefault()
        if (world.buildMode) {
          world.placeBuilding(world.buildMode, p.x, p.z, 0)
          return
        }
        game.queueFire()
      }
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        e.preventDefault()
        game.toggleCrouch()
      }
      if (e.code === 'KeyX') {
        e.preventDefault()
        game.toggleProne()
      }
      if (e.code === 'KeyZ') {
        e.preventDefault()
        game.toggleScope()
      }
      if (e.code === 'KeyE') {
        e.preventDefault()
        world.tryInteract(p.x, p.z)
      }
      if (e.code === 'KeyI') {
        e.preventDefault()
        world.toggleInventory()
      }
      if (e.code === 'KeyC') {
        e.preventDefault()
        world.toggleScan()
        world.performScan(p.x, p.z)
      }
      if (e.code === 'KeyQ') {
        e.preventDefault()
        if (world.bathe(p.x, p.z)) {
          game.applyNeeds({ hygiene: 50 })
        }
      }
      if (e.code === 'KeyR') {
        e.preventDefault()
        world.fish(p.x, p.z)
      }
      if (e.code === 'KeyV') {
        e.preventDefault()
        world.dig(p.x, p.z)
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
      if (!isTouch) {
        const game = useGameStore.getState()
        game.setMove(x, z)
        game.setSprint(keys.has('ShiftLeft') || keys.has('ShiftRight'))
        game.setSlow(keys.has('AltLeft') || keys.has('AltRight'))
      }
    }

    const down = (e: KeyboardEvent) => {
      if (
        e.code === 'AltLeft' ||
        e.code === 'AltRight' ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight'
      ) {
        e.preventDefault()
      }
      keys.add(e.code)
      syncMove()
    }
    const up = (e: KeyboardEvent) => {
      if (
        e.code === 'AltLeft' ||
        e.code === 'AltRight' ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight'
      ) {
        e.preventDefault()
      }
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
    if (store.caught) return
    if (useSettingsStore.getState().open) return
    const worldUi = useWorldStore.getState()
    if (worldUi.inventoryOpen || worldUi.mapOpen) return

    store.tickNeeds(dt)

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
    lookYaw.current -= dx * zoomFactor
    // Mouse/touch up (negative dy) → look up (negative pitch on this boom rig).
    lookPitch.current = THREE.MathUtils.clamp(
      lookPitch.current - dy * zoomFactor,
      PLAYER.pitchMin,
      PLAYER.pitchMax,
    )

    // Soft orbit lag — while turning you briefly see the body de costado.
    const yawFollow = store.scoped ? CAMERA.followYaw * 2.2 : CAMERA.followYaw
    const pitchFollow = store.scoped ? CAMERA.followPitch * 2.2 : CAMERA.followPitch
    camYaw.current = dampAngle(camYaw.current, lookYaw.current, yawFollow, dt)
    camPitch.current = dampAngle(camPitch.current, lookPitch.current, pitchFollow, dt)
    camPitch.current = THREE.MathUtils.clamp(camPitch.current, PLAYER.pitchMin, PLAYER.pitchMax)

    yawPivot.current.rotation.y = camYaw.current
    pitchObj.current.rotation.x = camPitch.current + CAMERA.pitchBias

    // Camera-relative movement (classic third-person).
    forward.current.set(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current))
    right.current.set(Math.cos(camYaw.current), 0, -Math.sin(camYaw.current))

    const { moveX, moveZ, sprint, slow } = store.input
    const stance = store.stance
    wish.current
      .set(0, 0, 0)
      .addScaledVector(right.current, moveX)
      .addScaledVector(forward.current, -moveZ)

    moving.current = wish.current.lengthSq() > 1e-6

    let gait: number = LOCOMOTION.walk
    if (stance === 'prone') gait = LOCOMOTION.prone
    else if (stance === 'crouch') gait = LOCOMOTION.crouch
    else if (sprint) gait = LOCOMOTION.run
    else if (slow) gait = LOCOMOTION.slow

    if (moving.current) {
      const scopePenalty = store.scoped ? SCOPE.moveScale : 1
      const air = grounded.current ? 1 : LOCOMOTION.airControl
      const speed =
        PLAYER.speed * useSettingsStore.getState().moveSpeed * scopePenalty * gait * air
      wish.current.normalize().multiplyScalar(speed * dt)
      const nextX = pos.current.x + wish.current.x
      const nextZ = pos.current.z + wish.current.z
      const nextGround = sampleHeight(nextX, nextZ)
      const stepUp = nextGround - (grounded.current ? smoothedY.current : pos.current.y)
      // Block cliff climbs / freefall ledges that feel broken (airborne can fall farther).
      const maxDrop = grounded.current ? 2.8 : 40
      if (stepUp <= 1.35 && stepUp >= -maxDrop) {
        const worldCols = useWorldStore.getState().getTreeColliders()
        const resolved = resolveCircleBoxCollision(
          nextX,
          nextZ,
          PLAYER.radius,
          mergeColliders(worldCols),
        )
        pos.current.x = resolved.x
        pos.current.z = resolved.z

        const moveYaw = Math.atan2(-wish.current.x, -wish.current.z)
        bodyYaw.current = dampAngle(bodyYaw.current, moveYaw, CAMERA.bodyTurn, dt)
      }
    } else {
      bodyYaw.current = dampAngle(bodyYaw.current, lookYaw.current, CAMERA.bodyTurn, dt)
    }

    useWorldStore.getState().setPlayerYaw(lookYaw.current)

    const groundY = sampleHeight(pos.current.x, pos.current.z)

    // Jump / gravity
    if (store.consumeJump() && grounded.current && stance !== 'prone') {
      velY.current =
        stance === 'crouch' ? LOCOMOTION.crouchJumpSpeed : LOCOMOTION.jumpSpeed
      grounded.current = false
      if (stance === 'crouch') store.setStance('stand')
    }

    if (grounded.current) {
      // Stepped off a ledge — leave ground stick and fall.
      if (smoothedY.current - groundY > 0.45) {
        grounded.current = false
        pos.current.y = smoothedY.current
        velY.current = 0
      } else {
        smoothedY.current = THREE.MathUtils.damp(smoothedY.current, groundY, 14, dt)
        pos.current.y = smoothedY.current
        velY.current = 0
      }
    }
    if (!grounded.current) {
      velY.current -= LOCOMOTION.gravity * dt
      pos.current.y += velY.current * dt
      if (pos.current.y <= groundY && velY.current <= 0) {
        pos.current.y = groundY
        smoothedY.current = groundY
        velY.current = 0
        grounded.current = true
      } else {
        smoothedY.current = pos.current.y
      }
    }
    store.setAirborne(!grounded.current)

    const eyeH = LOCOMOTION.eyeHeight[stance]
    const camH = LOCOMOTION.camHeight[stance]
    camHeightSmooth.current = THREE.MathUtils.damp(camHeightSmooth.current, camH, 10, dt)
    yawPivot.current.position.y = camHeightSmooth.current

    rig.current.position.set(pos.current.x, pos.current.y, pos.current.z)
    setPlayerPosition(pos.current.x, pos.current.y + eyeH, pos.current.z)

    useWorldStore.getState().setInteractHint(null)

    // --- Rear-right boom + wall collision ---
    const boomMul = LOCOMOTION.boomScale[stance]
    const desiredZ = (store.scoped ? CAMERA.scopedDistance : CAMERA.distance) * boomMul
    const shoulder = (store.scoped ? CAMERA.shoulder * 0.4 : CAMERA.shoulder) * boomMul
    const lift = store.scoped ? CAMERA.lift * 0.4 : CAMERA.lift

    rig.current.updateWorldMatrix(true, true)
    yawPivot.current.getWorldPosition(_pivotWorld)
    _idealLocal.set(shoulder, lift, desiredZ)
    _idealWorld.copy(_idealLocal).applyMatrix4(pitchObj.current.matrixWorld)
    _camDir.copy(_idealWorld).sub(_pivotWorld)
    const idealLen = Math.max(_camDir.length(), 1e-6)
    const allowed = maxCameraBoomDistance(_pivotWorld, _camDir, idealLen)
    let targetScale = THREE.MathUtils.clamp(allowed / idealLen, CAMERA.minDistance / idealLen, 1)
    targetScale = fitCameraScaleOutsideSolids(
      _pivotWorld,
      _idealLocal,
      pitchObj.current.matrixWorld,
      targetScale,
    )

    if (targetScale < camScale.current) {
      camScale.current = targetScale
    } else {
      camScale.current = THREE.MathUtils.damp(
        camScale.current,
        targetScale,
        CAMERA.boomSpeed,
        dt,
      )
    }

    camera.position.copy(_idealLocal).multiplyScalar(camScale.current)

    // Final ground clamp — boom pull-in can still leave the lens under steep hills / look-up.
    camera.updateMatrixWorld(true)
    camera.getWorldPosition(_camWorld)
    const floorY = sampleHeight(_camWorld.x, _camWorld.z) + CAMERA.groundClearance
    if (_camWorld.y < floorY) {
      _camWorld.y = floorY
      pitchObj.current.worldToLocal(_camWorld)
      camera.position.copy(_camWorld)
    }

    // Look toward the open side of the frame (where the OTS mira sits).
    _focusLocal.set(-shoulder * 0.35, -lift * 0.25, -CAMERA.lookAhead)
    _focusWorld.copy(_focusLocal).applyMatrix4(pitchObj.current.matrixWorld)
    camera.lookAt(_focusWorld)
    camera.updateMatrixWorld(true)

    const now = performance.now()
    if (store.consumeFire() && now - lastFire.current >= COMBAT.fireCooldownMs) {
      lastFire.current = now
      camera.updateMatrixWorld(true)
      // Exact screen-space mira (offset NDC) — bullets go where the reticle is.
      const aimNdc = store.scoped ? SCOPE_AIM : hipAim
      aimRaycaster.setFromCamera(aimNdc, camera)
      aimOrigin.current.copy(aimRaycaster.ray.origin)
      aimDir.current.copy(aimRaycaster.ray.direction)
      // Tracer rides the same mira ray (not the gun barrel offset).
      muzzlePos.current.copy(aimOrigin.current).addScaledVector(aimDir.current, 1.1)
      store.spawnTracer(aimOrigin.current, aimDir.current, muzzlePos.current)
    }
  })

  return (
    <group ref={rig} position={[PLAYER.spawn.x, 0, PLAYER.spawn.z]}>
      <PlayerAvatar yawRef={bodyYaw} pitchRef={lookPitch} movingRef={moving} />

      <group ref={yawPivot} position={[0, CAMERA.height, 0]}>
        <group ref={pitchObj}>
          <PerspectiveCamera
            makeDefault
            fov={SCOPE.baseFov}
            near={CAMERA.near}
            far={CAMERA.far}
            position={[CAMERA.shoulder, CAMERA.lift, CAMERA.distance]}
          />
        </group>
      </group>
    </group>
  )
}
