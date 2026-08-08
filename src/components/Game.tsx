import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { COLORS } from '../constants'
import { useGameStore } from '../store/gameStore'
import { MobileControls } from './ui/MobileControls'
import { PlayerController } from './scene/PlayerController'
import { ProceduralMap } from './scene/ProceduralMap'

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={COLORS.ground} roughness={0.95} metalness={0.02} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={[COLORS.sky, 28, 70]} />
      <hemisphereLight intensity={0.55} color="#dfe7ef" groundColor="#3a4038" />
      <directionalLight
        castShadow
        position={[12, 22, 8]}
        intensity={1.15}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <ambientLight intensity={0.22} />
      <Ground />
      <ProceduralMap />
      <PlayerController />
    </>
  )
}

function Hud() {
  const mode = useGameStore((s) => s.cameraMode)
  const stamina = useGameStore((s) => s.stamina)
  const recovering = useGameStore((s) => s.staminaRecovering)
  const toggle = useGameStore((s) => s.toggleCameraMode)
  const regenerateMap = useGameStore((s) => s.regenerateMap)

  return (
    <div className="hud">
      <button type="button" className="camera-hint" onClick={toggle}>
        Cámara: {mode.toUpperCase()} (V)
      </button>
      <button type="button" className="map-regen" onClick={regenerateMap}>
        Nuevo mapa (R)
      </button>
      <div className="stamina">
        <div className="stamina-label">{recovering ? 'Recuperando' : 'Resistencia'}</div>
        <div className="stamina-track">
          <div
            className={`stamina-fill${recovering ? ' recovering' : ''}`}
            style={{ width: `${Math.round(stamina * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function Game() {
  return (
    <div className="game-root">
      <Canvas shadows camera={{ fov: 60, near: 0.1, far: 120, position: [0, 4, 8] }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Hud />
      <MobileControls />
    </div>
  )
}
