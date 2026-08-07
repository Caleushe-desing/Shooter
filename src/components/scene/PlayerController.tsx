import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { PLAYER, CAMERA, clampToArena, resolveCircleAabb } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { WeaponSystem } from './WeaponSystem'
import { buildHavenInspiredMap } from '../../map/havenLayout'
import { unlockAudio } from '../../audio/gunshot'
import { mobileLookStick } from '../../input/mobileLookStick'

const MAP_SOLIDS = buildHavenInspiredMap().solids

/**
 * Player controller with TPS / FPS camera toggle (store.cameraMode).
 * WASD · Shift · Space · V (view) · mouse look · chase or eye cam.
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
  const { gl, camera } = useThree()

  // Desktop mouse look + fire.
  useEffect(() => {
    const el = gl.domElement
    const isCoarse = () => window.matchMedia('(pointer: coarse)').matches

    const onPointerDown = (e: PointerEvent) => {
      if (isCoarse()) return
      if (e.button !== 0) return
      unlockAudio()
      if (document.pointerLockElement !== el) {
        void el.requestPointerLock()
        return
      }
      useGameStore.getState().requestFire()
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
    document.addEventListener('mousemove', onMouseMove)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [gl])

  // WASD / Shift / Space / V (camera mode).
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

  // Priority -1: update look + camera before WeaponSystem (default 0).
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (!rig.current || !yawPivot.current || !pitchObj.current) return

    const game = useGameStore.getState()
    const firstPerson = game.cameraMode === 'first'

    if (lastCamMode.current !== game.cameraMode) {
      lastCamMode.current = game.cameraMode
      // Soft pitch reset when switching view so FPS is not stuck looking down.
      if (firstPerson) lookPitch.current = THREE.MathUtils.lerp(lookPitch.current, 0, 0.85)
      else lookPitch.current = THREE.MathUtils.lerp(lookPitch.current, PLAYER.pitchDefault, 0.65)
    }
    if (game.runId !== runId.current) {
      runId.current = game.runId
      pos.current.set(PLAYER.spawn.x, 0, PLAYER.spawn.z)
      velY.current = 0
      grounded.current = true
      lookYaw.current = 0
      lookPitch.current = firstPerson ? 0 : PLAYER.pitchDefault
      bodyYaw.current = 0
    }

    const { dx, dy } = game.consumeLook()
    lookYaw.current -= dx
    lookPitch.current = THREE.MathUtils.clamp(
      lookPitch.current - dy,
      PLAYER.pitchMin,
      PLAYER.pitchMax,
    )

    if (mobileLookStick.active) {
      lookYaw.current -= mobileLookStick.x * PLAYER.lookStickRate * dt
      lookPitch.current = THREE.MathUtils.clamp(
        lookPitch.current - mobileLookStick.y * PLAYER.lookStickRate * dt,
        PLAYER.pitchMin,
        PLAYER.pitchMax,
      )
    }

    bodyYaw.current = lookYaw.current
    yawPivot.current.rotation.y = lookYaw.current
    pitchObj.current.rotation.x = lookPitch.current
    yawPivot.current.position.y = firstPerson ? CAMERA.fpHeight : CAMERA.height

    const persp = camera as THREE.PerspectiveCamera
    if (firstPerson) {
      // Eye cam: at head, looking along local −Z (world forward).
      camera.position.set(0, 0, -CAMERA.fpForward)
      camera.rotation.set(0, 0, 0)
      if (persp.isPerspectiveCamera) {
        persp.fov = CAMERA.fpFov
        persp.near = CAMERA.fpNear
        persp.updateProjectionMatrix()
      }
    } else {
      // Chase boom behind the shoulder.
      camera.position.set(CAMERA.shoulder, CAMERA.lift, CAMERA.distance)
      camera.rotation.set(0, 0, 0)
      if (persp.isPerspectiveCamera) {
        persp.fov = CAMERA.fov
        persp.near = CAMERA.near
        persp.updateProjectionMatrix()
      }
    }

    // Hide own body in first person so it does not clip the view.
    if (avatarRoot.current) avatarRoot.current.visible = !firstPerson

    forward.current.set(-Math.sin(lookYaw.current), 0, -Math.cos(lookYaw.current))
    right.current.set(Math.cos(lookYaw.current), 0, -Math.sin(lookYaw.current))

    if (game.alive) {
      const { moveX, moveZ, sprint } = game.input
      wish.current
        .set(0, 0, 0)
        .addScaledVector(right.current, moveX)
        .addScaledVector(forward.current, -moveZ)

      moving.current = wish.current.lengthSq() > 1e-6
      if (moving.current) {
        const speed = PLAYER.speed * (sprint ? PLAYER.runMul : 1)
        wish.current.normalize().multiplyScalar(speed * dt)
        let nx = pos.current.x + wish.current.x
        let nz = pos.current.z + wish.current.z
        const bounded = clampToArena(nx, nz, PLAYER.radius)
        nx = bounded.x
        nz = bounded.z
        for (const box of MAP_SOLIDS) {
          const hit = resolveCircleAabb(nx, nz, PLAYER.radius, box)
          nx = hit.x
          nz = hit.z
        }
        for (const box of MAP_SOLIDS) {
          const hit = resolveCircleAabb(nx, nz, PLAYER.radius, box)
          nx = hit.x
          nz = hit.z
        }
        pos.current.x = nx
        pos.current.z = nz
      }

      if (game.consumeJump() && grounded.current) {
        velY.current = PLAYER.jumpSpeed
        grounded.current = false
      }
      if (!grounded.current || velY.current !== 0) {
        velY.current -= PLAYER.gravity * dt
        pos.current.y += velY.current * dt
        if (pos.current.y <= 0) {
          pos.current.y = 0
          velY.current = 0
          grounded.current = true
        }
      }
    } else {
      moving.current = false
      game.consumeJump()
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
