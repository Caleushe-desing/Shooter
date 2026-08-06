import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ARENA, COLORS, ENEMY, resolveCircleBoxCollision } from '../../constants'
import { useGameStore, type EnemyData } from '../../store/gameStore'
import {
  clearEnemyRuntime,
  getAllEnemyRuntimes,
  getEnemyRuntime,
  getPlayerPosition,
  registerEnemyTarget,
  setEnemyRuntime,
  unregisterEnemyTarget,
  type EnemyRuntime,
} from '../../store/enemyRuntime'

/**
 * Rotates a ring spawn point around the arena until it is far enough from the
 * player, so hostiles never materialise in their face.
 */
function spawnPointAwayFromPlayer(
  x: number,
  z: number,
  player: { x: number; z: number },
) {
  const radius = Math.hypot(x, z) || ENEMY.spawnRingMin
  let angle = Math.atan2(z, x)

  for (let i = 0; i < 8; i++) {
    const px = Math.cos(angle) * radius
    const pz = Math.sin(angle) * radius
    if (Math.hypot(px - player.x, pz - player.z) >= ENEMY.spawnMinPlayerDistance) {
      return { x: px, z: pz }
    }
    angle += Math.PI / 4
  }

  // Fallback: directly opposite the player.
  const away = Math.atan2(-player.z, -player.x)
  return { x: Math.cos(away) * radius, z: Math.sin(away) * radius }
}

/** Hostile crowd: spawns, chases the player and grabs them on contact. */
export function Enemies() {
  const enemies = useGameStore((s) => s.enemies)
  const pendingDamage = useRef(0)
  const lastPrune = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const now = performance.now()
    const store = useGameStore.getState()
    const frozen = store.caught || store.sectorCleared
    const player = getPlayerPosition()

    for (const enemy of store.enemies) {
      let rt = getEnemyRuntime(enemy.id)

      if (!rt) {
        if (!enemy.alive || now < enemy.spawnAt) continue
        const spawn = spawnPointAwayFromPlayer(enemy.startX, enemy.startZ, player)
        rt = {
          x: spawn.x,
          z: spawn.z,
          yaw: 0,
          phase: Math.random() * Math.PI * 2,
          speed: enemy.speed,
          grabbing: false,
          deadAt: 0,
          fallSide: Math.random() > 0.5 ? 1 : -1,
        }
        setEnemyRuntime(enemy.id, rt)
      }

      if (!enemy.alive) {
        if (rt.deadAt === 0) rt.deadAt = enemy.diedAt || now
        rt.grabbing = false
        continue
      }

      const dx = player.x - rt.x
      const dz = player.z - rt.z
      const dist = Math.hypot(dx, dz)
      if (dist > 1e-4) rt.yaw = Math.atan2(dx, dz)

      if (frozen) {
        rt.grabbing = false
        continue
      }

      rt.grabbing = dist <= ENEMY.grabDistance
      if (rt.grabbing) {
        pendingDamage.current += ENEMY.grabDamagePerSec * dt
        continue
      }

      const step = rt.speed * dt
      let nx = rt.x + (dx / dist) * step
      let nz = rt.z + (dz / dist) * step

      // Slide sideways when a crate blocks the direct path.
      const resolved = resolveCircleBoxCollision(nx, nz, ENEMY.radius)
      if (Math.abs(resolved.x - nx) > 1e-6 || Math.abs(resolved.z - nz) > 1e-6) {
        const side = rt.fallSide
        nx = resolved.x + (-dz / dist) * step * side
        nz = resolved.z + (dx / dist) * step * side
        const slid = resolveCircleBoxCollision(nx, nz, ENEMY.radius)
        nx = slid.x
        nz = slid.z
      } else {
        nx = resolved.x
        nz = resolved.z
      }

      // Keep the crowd from stacking into a single body.
      for (const [otherId, other] of getAllEnemyRuntimes()) {
        if (otherId === enemy.id || other.deadAt > 0) continue
        const ox = nx - other.x
        const oz = nz - other.z
        const d = Math.hypot(ox, oz)
        const minGap = ENEMY.radius * 2
        if (d > 1e-4 && d < minGap) {
          const push = (minGap - d) / d
          nx += ox * push * 0.5
          nz += oz * push * 0.5
        }
      }

      const limit = ARENA.size / 2 - ENEMY.radius
      rt.x = THREE.MathUtils.clamp(nx, -limit, limit)
      rt.z = THREE.MathUtils.clamp(nz, -limit, limit)
    }

    if (pendingDamage.current >= 1.5) {
      store.damagePlayer(pendingDamage.current)
      pendingDamage.current = 0
    }

    if (now - lastPrune.current > 500) {
      lastPrune.current = now
      store.pruneCorpses(now)
    }
  })

  return (
    <group>
      {enemies.map((enemy) => (
        <EnemyBody key={enemy.id} enemy={enemy} />
      ))}
    </group>
  )
}

function EnemyBody({ enemy }: { enemy: EnemyData }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)

  const materials = useMemo(() => {
    const make = (color: string, emissive: number) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color).multiplyScalar(emissive),
        roughness: 0.85,
        metalness: 0.05,
        transparent: true,
        opacity: 1,
      })
    return {
      skin: make(enemy.skin, 0.35),
      shirt: make(enemy.shirt, 0.3),
      pants: make(enemy.pants, 0.3),
      eye: new THREE.MeshBasicMaterial({ color: COLORS.enemyEye, transparent: true }),
    }
  }, [enemy.skin, enemy.shirt, enemy.pants])

  useEffect(() => {
    return () => {
      materials.skin.dispose()
      materials.shirt.dispose()
      materials.pants.dispose()
      materials.eye.dispose()
    }
  }, [materials])

  useEffect(() => {
    const g = root.current
    if (!g) return
    g.userData.enemyId = enemy.id
    registerEnemyTarget(enemy.id, g)
    return () => {
      unregisterEnemyTarget(enemy.id)
      if (!useGameStore.getState().enemies.some((e) => e.id === enemy.id)) {
        clearEnemyRuntime(enemy.id)
      }
    }
  }, [enemy.id])

  useFrame(({ clock }) => {
    const g = root.current
    const b = body.current
    if (!g || !b) return

    const rt: EnemyRuntime | undefined = getEnemyRuntime(enemy.id)
    if (!rt) {
      g.visible = false
      return
    }
    g.visible = true

    const now = performance.now()
    g.position.set(rt.x, 0, rt.z)
    g.rotation.y = rt.yaw

    if (rt.deadAt > 0) {
      // Collapse forward and fade the corpse out.
      const t = Math.min(1, (now - rt.deadAt) / 700)
      const ease = 1 - (1 - t) * (1 - t)
      b.rotation.x = ease * (Math.PI / 2) * 0.92
      b.rotation.z = ease * 0.25 * rt.fallSide
      b.position.y = -ease * 0.35
      const fade = Math.max(0, 1 - (now - rt.deadAt) / ENEMY.corpseFadeMs)
      materials.skin.opacity = fade
      materials.shirt.opacity = fade
      materials.pants.opacity = fade
      materials.eye.opacity = fade * 0.4
      return
    }

    // Rise out of the floor as they enter the arena.
    const age = now - enemy.spawnAt
    const rise = THREE.MathUtils.clamp(age / ENEMY.spawnRiseMs, 0, 1)
    b.position.y = (rise - 1) * 1.4
    b.rotation.x = 0
    b.rotation.z = 0

    const t = clock.elapsedTime
    const cadence = 7.5 + rt.speed
    const swing = rt.grabbing ? 0 : Math.sin(t * cadence + rt.phase) * 0.7

    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing

    // Arms reach out to grab as they close in.
    const reach = rt.grabbing ? -1.45 : -1.15 - Math.abs(swing) * 0.1
    const grabWobble = rt.grabbing ? Math.sin(t * 12 + rt.phase) * 0.12 : 0
    if (armL.current) armL.current.rotation.x = reach + grabWobble
    if (armR.current) armR.current.rotation.x = reach - grabWobble
  })

  const h = enemy.height

  return (
    <group ref={root} userData={{ enemyId: enemy.id }}>
      <group ref={body}>
        {/* Legs */}
        <group ref={legL} position={[-0.13, 0.82 * h, 0]}>
          <mesh material={materials.pants} position={[0, -0.41 * h, 0]}>
            <capsuleGeometry args={[0.1, 0.52 * h, 4, 8]} />
          </mesh>
        </group>
        <group ref={legR} position={[0.13, 0.82 * h, 0]}>
          <mesh material={materials.pants} position={[0, -0.41 * h, 0]}>
            <capsuleGeometry args={[0.1, 0.52 * h, 4, 8]} />
          </mesh>
        </group>

        {/* Hips + torso */}
        <mesh material={materials.pants} position={[0, 0.86 * h, 0]}>
          <boxGeometry args={[0.38, 0.2, 0.24]} />
        </mesh>
        <mesh material={materials.shirt} position={[0, 1.16 * h, 0]}>
          <capsuleGeometry args={[0.21, 0.36 * h, 4, 10]} />
        </mesh>

        {/* Arms reaching for the player */}
        <group ref={armL} position={[-0.3, 1.34 * h, 0]}>
          <mesh material={materials.shirt} position={[0, -0.2 * h, 0]}>
            <capsuleGeometry args={[0.075, 0.3 * h, 4, 8]} />
          </mesh>
          <mesh material={materials.skin} position={[0, -0.42 * h, 0]}>
            <sphereGeometry args={[0.085, 8, 8]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.3, 1.34 * h, 0]}>
          <mesh material={materials.shirt} position={[0, -0.2 * h, 0]}>
            <capsuleGeometry args={[0.075, 0.3 * h, 4, 8]} />
          </mesh>
          <mesh material={materials.skin} position={[0, -0.42 * h, 0]}>
            <sphereGeometry args={[0.085, 8, 8]} />
          </mesh>
        </group>

        {/* Neck + head */}
        <mesh material={materials.skin} position={[0, 1.42 * h, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.1, 8]} />
        </mesh>
        <group position={[0, 1.6 * h, 0]} userData={{ part: 'head', enemyId: enemy.id }}>
          <mesh material={materials.skin} userData={{ part: 'head' }}>
            <sphereGeometry args={[0.17, 12, 12]} />
          </mesh>
          <mesh material={materials.eye} position={[-0.06, 0.03, 0.15]} userData={{ part: 'head' }}>
            <sphereGeometry args={[0.026, 6, 6]} />
          </mesh>
          <mesh material={materials.eye} position={[0.06, 0.03, 0.15]} userData={{ part: 'head' }}>
            <sphereGeometry args={[0.026, 6, 6]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
