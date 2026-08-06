import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ARENA, BIRD, COLORS, OBSTACLES } from '../../constants'
import { useGameStore, type BirdData } from '../../store/gameStore'
import { getPlayerPosition } from '../../store/enemyRuntime'
import {
  clearBirdRuntime,
  getBirdRuntime,
  registerBirdTarget,
  setBirdRuntime,
  unregisterBirdTarget,
} from '../../store/birdRuntime'
import { useSettingsStore } from '../../store/settings'

function uid() {
  return `bird-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Flocks that burst out from behind a crate — the birds start hidden on the
 * far side of the box (relative to the player) and climb away from it.
 */
function spawnFlock(): BirdData[] {
  const crate = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)]
  const player = getPlayerPosition()

  // Direction pointing from the player past the crate: the hidden side.
  const awayX = crate.x - player.x
  const awayZ = crate.z - player.z
  const len = Math.hypot(awayX, awayZ) || 1
  const dirX = awayX / len
  const dirZ = awayZ / len

  const count = BIRD.flockMin + Math.floor(Math.random() * (BIRD.flockMax - BIRD.flockMin + 1))
  const now = performance.now()
  const birds: BirdData[] = []

  for (let i = 0; i < count; i++) {
    const id = uid()
    // Fan the flock out sideways so they don't fly as one line.
    const spread = (i - (count - 1) / 2) * 0.45
    const behind = Math.max(crate.w, crate.d) / 2 + 0.25

    const speed = BIRD.speedMin + Math.random() * (BIRD.speedMax - BIRD.speedMin)
    const climb = BIRD.climbMin + Math.random() * (BIRD.climbMax - BIRD.climbMin)
    const wobble = (Math.random() - 0.5) * 0.5

    setBirdRuntime(id, {
      x: crate.x + dirX * behind - dirZ * spread,
      y: 0.25 + Math.random() * 0.3,
      z: crate.z + dirZ * behind + dirX * spread,
      vx: (dirX + -dirZ * wobble) * speed,
      vy: climb,
      vz: (dirZ + dirX * wobble) * speed,
      flap: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2,
      deadAt: 0,
      tumble: Math.random() > 0.5 ? 1 : -1,
    })

    birds.push({
      id,
      color: COLORS.birdBodies[Math.floor(Math.random() * COLORS.birdBodies.length)],
      size: BIRD.size * (0.85 + Math.random() * 0.35),
      alive: true,
      diedAt: 0,
      bornAt: now + i * BIRD.flockStaggerMs,
    })
  }

  return birds
}

export function Birds() {
  const birds = useGameStore((s) => s.birds)
  const nextFlockAt = useRef(performance.now() + BIRD.firstFlockDelayMs)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    const store = useGameStore.getState()
    const paused = store.caught || store.sectorCleared || useSettingsStore.getState().open

    if (!paused && now >= nextFlockAt.current) {
      nextFlockAt.current =
        now +
        BIRD.flockIntervalMinMs +
        Math.random() * (BIRD.flockIntervalMaxMs - BIRD.flockIntervalMinMs)
      store.addBirds(spawnFlock())
    }

    const expired: string[] = []

    for (const bird of store.birds) {
      const rt = getBirdRuntime(bird.id)
      if (!rt) {
        expired.push(bird.id)
        continue
      }
      if (now < bird.bornAt) continue

      if (rt.deadAt > 0) {
        // Shot down: tumble to the ground, then clean up.
        rt.vy -= 12 * dt
        rt.x += rt.vx * dt * 0.35
        rt.y += rt.vy * dt
        rt.z += rt.vz * dt * 0.35
        if (rt.y <= 0.08) {
          rt.y = 0.08
          rt.vx *= 0.6
          rt.vz *= 0.6
        }
        if (now - rt.deadAt > BIRD.featherFadeMs) expired.push(bird.id)
        continue
      }

      if (paused) continue

      rt.flap += BIRD.flapSpeed * dt
      rt.bobPhase += BIRD.bobSpeed * dt
      rt.vy *= Math.pow(BIRD.climbDamping, dt * 4)

      rt.x += rt.vx * dt
      rt.y += (rt.vy + Math.cos(rt.bobPhase) * BIRD.bobAmplitude) * dt
      rt.z += rt.vz * dt

      const outOfRange =
        rt.y > BIRD.maxAltitude ||
        Math.hypot(rt.x, rt.z) > BIRD.maxRange ||
        now - bird.bornAt > BIRD.lifetimeMs
      if (outOfRange) expired.push(bird.id)

      // Clear the perimeter wall instead of clipping through it.
      const half = ARENA.size / 2
      if (Math.abs(rt.x) > half - 1 || Math.abs(rt.z) > half - 1) {
        rt.vy = Math.max(rt.vy, 1.6)
      }
    }

    if (expired.length > 0) store.removeBirds(expired)
  })

  return (
    <group>
      {birds.map((bird) => (
        <BirdBody key={bird.id} bird={bird} />
      ))}
    </group>
  )
}

function BirdBody({ bird }: { bird: BirdData }) {
  const root = useRef<THREE.Group>(null)
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)

  const materials = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: bird.color, roughness: 0.85 }),
      belly: new THREE.MeshStandardMaterial({ color: COLORS.birdBelly, roughness: 0.9 }),
      beak: new THREE.MeshStandardMaterial({ color: COLORS.birdBeak, roughness: 0.6 }),
    }),
    [bird.color],
  )

  useEffect(() => {
    return () => {
      materials.body.dispose()
      materials.belly.dispose()
      materials.beak.dispose()
    }
  }, [materials])

  useEffect(() => {
    const g = root.current
    if (!g) return
    g.userData.birdId = bird.id
    registerBirdTarget(bird.id, g)
    return () => {
      unregisterBirdTarget(bird.id)
      if (!useGameStore.getState().birds.some((b) => b.id === bird.id)) {
        clearBirdRuntime(bird.id)
      }
    }
  }, [bird.id])

  useFrame(() => {
    const g = root.current
    if (!g) return
    const rt = getBirdRuntime(bird.id)
    if (!rt || performance.now() < bird.bornAt) {
      g.visible = false
      return
    }
    g.visible = true
    g.position.set(rt.x, rt.y, rt.z)

    if (rt.deadAt > 0) {
      g.rotation.z += rt.tumble * 9 * 0.016
      g.rotation.x += 5 * 0.016
      if (wingL.current) wingL.current.rotation.z = 0.5
      if (wingR.current) wingR.current.rotation.z = -0.5
      return
    }

    // Face the flight direction with a slight climb/dive pitch.
    g.rotation.y = Math.atan2(rt.vx, rt.vz)
    const horizontal = Math.hypot(rt.vx, rt.vz) || 1
    g.rotation.x = -Math.atan2(rt.vy, horizontal) * 0.5
    g.rotation.z = 0

    const flap = Math.sin(rt.flap)
    if (wingL.current) wingL.current.rotation.z = 0.35 + flap * 0.95
    if (wingR.current) wingR.current.rotation.z = -0.35 - flap * 0.95
  })

  const s = bird.size

  return (
    <group ref={root} userData={{ birdId: bird.id }}>
      {/* Body */}
      <mesh material={materials.body} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.72]}>
        <capsuleGeometry args={[s * 0.42, s * 0.95, 4, 8]} />
      </mesh>
      <mesh
        material={materials.belly}
        position={[0, -s * 0.16, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.86, 1, 0.5]}
      >
        <capsuleGeometry args={[s * 0.38, s * 0.7, 4, 8]} />
      </mesh>

      {/* Head + beak */}
      <mesh material={materials.body} position={[0, s * 0.22, s * 0.7]}>
        <sphereGeometry args={[s * 0.34, 10, 10]} />
      </mesh>
      <mesh
        material={materials.beak}
        position={[0, s * 0.18, s * 1.02]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[s * 0.12, s * 0.34, 6]} />
      </mesh>

      {/* Wings */}
      <group ref={wingL} position={[-s * 0.3, s * 0.1, 0]}>
        <mesh material={materials.body} position={[-s * 0.7, 0, 0]} scale={[1, 0.18, 1]}>
          <boxGeometry args={[s * 1.5, s * 0.5, s * 0.8]} />
        </mesh>
      </group>
      <group ref={wingR} position={[s * 0.3, s * 0.1, 0]}>
        <mesh material={materials.body} position={[s * 0.7, 0, 0]} scale={[1, 0.18, 1]}>
          <boxGeometry args={[s * 1.5, s * 0.5, s * 0.8]} />
        </mesh>
      </group>

      {/* Tail */}
      <mesh material={materials.body} position={[0, s * 0.08, -s * 0.85]} scale={[1, 0.2, 1]}>
        <boxGeometry args={[s * 0.55, s * 0.4, s * 0.6]} />
      </mesh>
    </group>
  )
}
