import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { PLAYER, resolveCircleBoxCollision, COMBAT } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { getMuzzleWorldPosition } from '../../store/muzzle'
import { setPlayerPosition } from '../../store/enemyRuntime'
import { Weapon } from './Weapon'

/** NDC center — matches HUD crosshair at 50%/50%. */
const SCREEN_CENTER = new THREE.Vector2(0, 0)

export function PlayerController() {
  const rig = useRef<THREE.Group>(null)
  const pitchObj = useRef<THREE.Group>(null)
  const yaw = useRef(0)
  const pitch = useRef(0)
  const pos = useRef(new THREE.Vector3(PLAYER.spawn.x, PLAYER.eyeHeight, PLAYER.spawn.z))
  const lastFire = useRef(0)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())
  const aimOrigin = useRef(new THREE.Vector3())
  const aimDir = useRef(new THREE.Vector3())
  const muzzlePos = useRef(new THREE.Vector3())
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
      if (isTouch) return
      if (document.pointerLockElement !== el) {
        el.requestPointerLock()
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return
      useGameStore.getState().addLook(
        e.movementX * PLAYER.lookSensitivityDesktop,
        e.movementY * PLAYER.lookSensitivityDesktop,
      )
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyF') {
        e.preventDefault()
        useGameStore.getState().queueFire()
      }
    }

    el.addEventListener('click', onClick)
    el.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      el.removeEventListener('click', onClick)
      el.removeEventListener('mousedown', onMouseDown)
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
    if (!rig.current || !pitchObj.current) return
    // Enemies still need the player's position while the round is over.
    setPlayerPosition(pos.current.x, pos.current.y, pos.current.z)
    if (store.sectorCleared || store.caught) return

    const { dx, dy } = store.consumeLook()
    yaw.current -= dx
    pitch.current = THREE.MathUtils.clamp(
      pitch.current - dy,
      PLAYER.pitchMin,
      PLAYER.pitchMax,
    )

    rig.current.rotation.y = yaw.current
    pitchObj.current.rotation.x = pitch.current

    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))

    const { moveX, moveZ } = store.input
    wish.current
      .set(0, 0, 0)
      .addScaledVector(right.current, moveX)
      .addScaledVector(forward.current, -moveZ)

    if (wish.current.lengthSq() > 0) {
      wish.current.normalize().multiplyScalar(PLAYER.speed * dt)
      const nextX = pos.current.x + wish.current.x
      const nextZ = pos.current.z + wish.current.z
      const resolved = resolveCircleBoxCollision(nextX, nextZ, PLAYER.radius)
      pos.current.x = resolved.x
      pos.current.z = resolved.z
    }

    pos.current.y = PLAYER.eyeHeight
    rig.current.position.copy(pos.current)
    setPlayerPosition(pos.current.x, pos.current.y, pos.current.z)

    const now = performance.now()
    if (store.consumeFire() && now - lastFire.current >= COMBAT.fireCooldownMs) {
      lastFire.current = now
      // World matrices must include this frame's yaw/pitch/position before aiming.
      rig.current.updateWorldMatrix(true, true)
      // Hitscan exactly through screen center (same as the CSS crosshair).
      // IMPORTANT: use world ray — camera.position is local (0,0,0) and would
      // make shots drift as the player moves around the map.
      aimRaycaster.setFromCamera(SCREEN_CENTER, camera)
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
    <group ref={rig} position={[PLAYER.spawn.x, PLAYER.eyeHeight, PLAYER.spawn.z]}>
      <group ref={pitchObj}>
        <PerspectiveCamera makeDefault fov={75} near={0.05} far={80} />
        <Weapon />
      </group>
    </group>
  )
}
