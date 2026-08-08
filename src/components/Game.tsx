import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { COLORS } from '../constants'
import { useGameStore } from '../store/gameStore'
import { MobileControls } from './ui/MobileControls'
import { PlayerController } from './scene/PlayerController'
import { ProceduralMap } from './scene/ProceduralMap'

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={[COLORS.sky, 35, 90]} />
      <hemisphereLight intensity={0.55} color="#dfe7ef" groundColor="#3a4038" />
      <directionalLight
        castShadow
        position={[16, 28, 10]}
        intensity={1.15}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <ambientLight intensity={0.22} />
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
