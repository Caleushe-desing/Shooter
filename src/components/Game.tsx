import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useGameStore } from '../store/gameStore'
import { MobileControls } from './ui/MobileControls'
import { Minimap } from './ui/Minimap'
import { PlayerController } from './scene/PlayerController'
import { ProceduralMap } from './scene/ProceduralMap'

function Scene() {
  return (
    <>
      <color attach="background" args={['#0a0618']} />
      <fog attach="fog" args={['#1a0a3a', 55, 140]} />
      <hemisphereLight intensity={0.42} color="#c8a0ff" groundColor="#2a1830" />
      <directionalLight
        castShadow
        position={[18, 36, 12]}
        intensity={0.85}
        color="#ffb8e0"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.035}
        shadow-camera-far={110}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
      />
      <directionalLight position={[-20, 18, -10]} intensity={0.35} color="#60d0ff" />
      <ambientLight intensity={0.28} color="#b090e8" />
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
      <Minimap />
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
      <Canvas shadows camera={{ fov: 60, near: 0.1, far: 320, position: [0, 4, 8] }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Hud />
      <MobileControls />
    </div>
  )
}
