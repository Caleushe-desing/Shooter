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
      <color attach="background" args={['#c8d0d8']} />
      {/* Soft distant haze only — keeps colors vivid up close */}
      <fog attach="fog" args={['#d0d6dc', 90, 160]} />
      <hemisphereLight intensity={0.75} color="#fff6ea" groundColor="#9aaa88" />
      <ambientLight intensity={0.55} color="#f2f4f8" />
      <directionalLight
        castShadow
        position={[14, 30, 10]}
        intensity={0.65}
        color="#fff4e6"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.04}
        shadow-camera-far={90}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
      />
      <directionalLight position={[-12, 20, -8]} intensity={0.28} color="#e8f0ff" />
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
      <Canvas shadows camera={{ fov: 60, near: 0.1, far: 200, position: [0, 4, 8] }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Hud />
      <MobileControls />
    </div>
  )
}
