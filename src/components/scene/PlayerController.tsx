import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { PLAYER, CAMERA, clampToArena } from '../../constants'
import {
  canStandUp,
  integrateVertical,
  raycastSolids,
  resolveHorizontal,
} from '../../map/collision'
import { aimState } from '../../input/aimState'
import { useGameStore } from '../../store/gameStore'
import { PlasticSoldier } from './PlasticSoldier'

/**
 * Over-the-shoulder TPS: camera right + above the back, soldier in the
 * left third of the frame, crosshair clear into open space ahead.
 */
export function PlayerController() {
  const { gl, camera } = useThree()
  const rig = useRef<THREE.Group>(null)
  const yawPivot = useRef<THREE.Group>(null)
  const lookYaw = useRef(0)
  const lookPitch = useRef<number>(PLAYER.pitchDefault)
  const bodyYaw = useRef(0)
  const moving = useRef(false)
  const spawn = useGameStore.getState().map.spawn
  const pos = useRef(new THREE.Vector3(spawn.x, spawn.y, spawn.z))
  const velY = useRef(0)
  const grounded = useRef(true)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())
  const boomScale = useRef(1)
  const bodyHeight = useRef<number>(PLAYER.height)
  const camHeight = useRef<number>(CAMERA.height)
  const runId = useRef(useGameStore.getState().runId)
  const aimDir = useRef(new THREE.Vector3())
  const aimPoint = useRef(new THREE.Vector3())
  const aimOrigin = useRef(new THREE.Vector3())
  const boomDir = useRef(new THREE.Vector3())
  const boomLocal = useRef(new THREE.Vector3())
  const yawAxis = useRef(new THREE.Vector3(0, 1, 0))

  useEffect(() => {
    const el = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const locked = document.pointerLockElement === el
      if (!locked) {
        el.requestPointerLock?.()
        return
      }
      useGameStore.getState().setFiring(true)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return
      useGameStore.getState().setFiring(false)
    }
    const onPointerMove = (e: PointerEvent) => {
      const locked = document.pointerLockElement === el
      if (!locked) return
      const sens =
        e.pointerType === 'touch' ? PLAYER.lookSensitivityMobile : PLAYER.lookSensitivity
      useGameStore.getState().addLook(e.movementX * sens, e.movementY * sens)
    }
    const onLockChange = () => {
      if (document.pointerLockElement !== el) {
        useGameStore.getState().setFiring(false)
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerlockchange', onLockChange)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerlockchange', onLockChange)
      useGameStore.getState().setFiring(false)
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
      if (e.code === 'ControlLeft' && !e.repeat) {
        e.preventDefault()
        const game = useGameStore.getState()
        if (game.isCrouching) {
          if (
            canStandUp(
              game.playerX,
              game.playerY,
              game.playerZ,
              PLAYER.radius,
              PLAYER.crouchHeight,
              PLAYER.height,
              game.map.solids,
            )
          ) {
            game.setCrouching(false)
          }
        } else {
          game.setCrouching(true)
        }
        return
      }
      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault()
        useGameStore.getState().regenerateMap()
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
    if (!rig.current || !yawPivot.current) return

    const game = useGameStore.getState()
    const { solids, trenches } = game.map
    const crouching = game.isCrouching

    if (game.runId !== runId.current) {
      runId.current = game.runId
      pos.current.set(game.map.spawn.x, game.map.spawn.y, game.map.spawn.z)
      velY.current = 0
      grounded.current = true
      lookYaw.current = 0
      lookPitch.current = PLAYER.pitchDefault
      bodyYaw.current = 0
      boomScale.current = 1
      bodyHeight.current = PLAYER.height
      camHeight.current = CAMERA.height
      game.setCrouching(false)
      game.setFiring(false)
    }

    const { dx, dy } = game.consumeLook()
    lookYaw.current -= dx
    lookPitch.current = THREE.MathUtils.clamp(
      lookPitch.current - dy,
      PLAYER.pitchMin,
      PLAYER.pitchMax,
    )
    bodyYaw.current = lookYaw.current
    aimState.yaw = lookYaw.current
    aimState.pitch = lookPitch.current

    const { moveX, moveZ, sprint } = game.input
    const wishMoving = Math.abs(moveX) > 1e-6 || Math.abs(moveZ) > 1e-6
    const sprinting = game.tickStamina(dt, sprint && !crouching, wishMoving)
    const speed = game.syncMoveSpeed(sprinting)

    const targetBodyH = crouching ? PLAYER.crouchHeight : PLAYER.height
    bodyHeight.current = THREE.MathUtils.damp(
      bodyHeight.current,
      targetBodyH,
      CAMERA.capsuleLerp,
      dt,
    )

    const targetCamH = crouching ? CAMERA.crouchHeight : CAMERA.height
    camHeight.current = THREE.MathUtils.damp(
      camHeight.current,
      targetCamH,
      CAMERA.headFollow,
      dt,
    )

    // Yaw-only rig; pitch is applied via lookAt so screen center = aim ray.
    yawPivot.current.rotation.y = lookYaw.current
    yawPivot.current.position.y = camHeight.current

    forward.current.set(-Math.sin(lookYaw.current), 0, -Math.cos(lookYaw.current))
    right.current.set(Math.cos(lookYaw.current), 0, -Math.sin(lookYaw.current))

    wish.current
      .set(0, 0, 0)
      .addScaledVector(right.current, moveX)
      .addScaledVector(forward.current, -moveZ)

    moving.current = wish.current.lengthSq() > 1e-6
    if (moving.current) {
      wish.current.normalize().multiplyScalar(speed * dt)

      let nextX = pos.current.x + wish.current.x
      let nextZ = pos.current.z
      let hit = resolveHorizontal(
        nextX,
        nextZ,
        pos.current.y,
        PLAYER.radius,
        bodyHeight.current,
        solids,
      )
      nextX = hit.x
      nextZ = pos.current.z + wish.current.z
      hit = resolveHorizontal(
        nextX,
        nextZ,
        pos.current.y,
        PLAYER.radius,
        bodyHeight.current,
        solids,
      )
      const bounded = clampToArena(hit.x, hit.z, PLAYER.radius)
      pos.current.x = bounded.x
      pos.current.z = bounded.z
    }

    if (game.consumeJump() && grounded.current && !crouching) {
      velY.current = PLAYER.jumpSpeed
      grounded.current = false
    }

    const vert = integrateVertical(
      {
        x: pos.current.x,
        y: pos.current.y,
        z: pos.current.z,
        velY: velY.current,
        grounded: grounded.current,
      },
      dt,
      solids,
      trenches,
      PLAYER.gravity,
      PLAYER.radius,
    )
    pos.current.x = vert.x
    pos.current.y = vert.y
    pos.current.z = vert.z
    velY.current = vert.velY
    grounded.current = vert.grounded

    // Aim ray from the gun shoulder (right) — screen center stays in open space.
    const aimH = crouching ? CAMERA.aimHeight - 0.42 : CAMERA.aimHeight
    const cosP = Math.cos(lookPitch.current)
    aimDir.current.set(
      -Math.sin(lookYaw.current) * cosP,
      Math.sin(lookPitch.current),
      -Math.cos(lookYaw.current) * cosP,
    )
    aimOrigin.current
      .set(pos.current.x, pos.current.y + aimH, pos.current.z)
      .addScaledVector(right.current, CAMERA.aimShoulder)
    aimPoint.current
      .copy(aimOrigin.current)
      .addScaledVector(aimDir.current, CAMERA.aimDistance)

    // Soft boom collision along the shoulder offset behind the pivot.
    boomLocal.current.set(CAMERA.shoulder, CAMERA.lift, CAMERA.distance)
    boomLocal.current.applyAxisAngle(yawAxis.current, lookYaw.current)
    const maxLen = boomLocal.current.length()
    boomDir.current.copy(boomLocal.current).normalize()
    const ox = pos.current.x
    const oy = pos.current.y + camHeight.current
    const oz = pos.current.z
    const hitDist = raycastSolids(
      ox,
      oy,
      oz,
      boomDir.current.x,
      boomDir.current.y,
      boomDir.current.z,
      maxLen,
      solids,
    )
    let targetScale = 1
    if (hitDist !== null) {
      const safe = Math.max(CAMERA.minBoomLength, hitDist - CAMERA.boomSkin)
      targetScale = THREE.MathUtils.clamp(safe / maxLen, CAMERA.minBoomLength / maxLen, 1)
    }
    const boomT = 1 - Math.exp(-CAMERA.boomLerp * dt)
    boomScale.current = THREE.MathUtils.lerp(boomScale.current, targetScale, boomT)

    const cam = camera as THREE.PerspectiveCamera
    cam.position.set(
      CAMERA.shoulder * boomScale.current,
      CAMERA.lift * boomScale.current,
      CAMERA.distance * boomScale.current,
    )
    if (cam.isPerspectiveCamera) {
      cam.fov = CAMERA.fov
      cam.near = CAMERA.near
      cam.far = CAMERA.far
      cam.updateProjectionMatrix()
    }

    rig.current.position.set(pos.current.x, pos.current.y, pos.current.z)
    // lookAt after rig/pivot transforms so world aim matches screen center.
    yawPivot.current.updateWorldMatrix(true, true)
    cam.up.set(0, 1, 0)
    cam.lookAt(aimPoint.current)

    game.setPlayerPos(pos.current.x, pos.current.y, pos.current.z)
  })

  return (
    <group ref={rig} position={[spawn.x, spawn.y, spawn.z]}>
      <PlasticSoldier yawRef={bodyYaw} movingRef={moving} />
      <group ref={yawPivot} position={[0, CAMERA.height, 0]}>
        <PerspectiveCamera
          makeDefault
          fov={CAMERA.fov}
          near={CAMERA.near}
          far={CAMERA.far}
          position={[CAMERA.shoulder, CAMERA.lift, CAMERA.distance]}
        />
      </group>
    </group>
  )
}
