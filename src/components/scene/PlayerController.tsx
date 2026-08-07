import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { PLAYER, CAMERA, LOCOMOTION, clampToArena } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'

/**
 * Third-person human locomotion:
 * WASD · Shift run · Ctrl crouch · Space jump · mouse look
 */
export function PlayerController() {
  const rig = useRef<THREE.Group>(null)
  const yawPivot = useRef<THREE.Group>(null)
  const pitchObj = useRef<THREE.Group>(null)
  const lookYaw = useRef(0)
  const lookPitch = useRef<number>(PLAYER.pitchDefault)
  const bodyYaw = useRef(0)
  const moving = useRef(false)
  const pos = useRef(new THREE.Vector3(PLAYER.spawn.x, 0, PLAYER.spawn.z))
  const velY = useRef(0)
  const grounded = useRef(true)
  const camH = useRef<number>(LOCOMOTION.camHeight.stand)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())
  const { gl, camera } = useThree()

  useEffect(() => {
    const el = gl.domElement

    const onClick = () => {
      if (document.pointerLockElement !== el) void el.requestPointerLock()
    }
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return
      useGameStore.getState().addLook(
        e.movementX * PLAYER.lookSensitivity,
        e.movementY * PLAYER.lookSensitivity,
      )
    }

    el.addEventListener('click', onClick)
    document.addEventListener('mousemove', onMouseMove)
    return () => {
      el.removeEventListener('click', onClick)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [gl])

  useEffect(() => {
    const keys = new Set<string>()

    const sync = () => {
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
      if (
        e.code.startsWith('Arrow') ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        e.code === 'Space' ||
        e.code === 'ControlLeft' ||
        e.code === 'ControlRight'
      ) {
        e.preventDefault()
      }
      if (e.code === 'Space') {
        useGameStore.getState().queueJump()
        return
      }
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        if (!e.repeat) useGameStore.getState().toggleCrouch()
        return
      }
      keys.add(e.code)
      sync()
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      sync()
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

    const store = useGameStore.getState()
    const { dx, dy } = store.consumeLook()
    lookYaw.current -= dx
    lookPitch.current = THREE.MathUtils.clamp(
      lookPitch.current - dy,
      PLAYER.pitchMin,
      PLAYER.pitchMax,
    )

    bodyYaw.current = lookYaw.current
    yawPivot.current.rotation.y = lookYaw.current
    pitchObj.current.rotation.x = lookPitch.current

    const stance = store.stance
    const targetCam = LOCOMOTION.camHeight[stance]
    camH.current = THREE.MathUtils.damp(camH.current, targetCam, 12, dt)
    yawPivot.current.position.y = camH.current

    const boom = LOCOMOTION.boomScale[stance]
    camera.position.set(CAMERA.shoulder * boom, CAMERA.lift * boom, CAMERA.distance * boom)
    camera.rotation.set(0, 0, 0)

    forward.current.set(-Math.sin(lookYaw.current), 0, -Math.cos(lookYaw.current))
    right.current.set(Math.cos(lookYaw.current), 0, -Math.sin(lookYaw.current))

    const { moveX, moveZ, sprint } = store.input
    wish.current
      .set(0, 0, 0)
      .addScaledVector(right.current, moveX)
      .addScaledVector(forward.current, -moveZ)

    moving.current = wish.current.lengthSq() > 1e-6
    if (moving.current) {
      let gait = 1
      if (stance === 'crouch') gait = PLAYER.crouchMul
      else if (sprint) gait = PLAYER.runMul
      const air = grounded.current ? 1 : LOCOMOTION.airControl
      const speed = PLAYER.speed * gait * air
      wish.current.normalize().multiplyScalar(speed * dt)
      const next = clampToArena(
        pos.current.x + wish.current.x,
        pos.current.z + wish.current.z,
        PLAYER.radius,
      )
      pos.current.x = next.x
      pos.current.z = next.z
    }

    if (store.consumeJump() && grounded.current) {
      velY.current =
        stance === 'crouch' ? LOCOMOTION.crouchJumpSpeed : LOCOMOTION.jumpSpeed
      grounded.current = false
      if (stance === 'crouch') store.setStance('stand')
    }

    if (!grounded.current) {
      velY.current -= LOCOMOTION.gravity * dt
      pos.current.y += velY.current * dt
      if (pos.current.y <= 0 && velY.current <= 0) {
        pos.current.y = 0
        velY.current = 0
        grounded.current = true
      }
    } else {
      pos.current.y = 0
      velY.current = 0
    }

    store.setAirborne(!grounded.current)
    rig.current.position.set(pos.current.x, pos.current.y, pos.current.z)
  })

  return (
    <group ref={rig} position={[PLAYER.spawn.x, 0, PLAYER.spawn.z]}>
      <PlayerAvatar yawRef={bodyYaw} movingRef={moving} />
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
