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
      <fog attach="fog" args={[COLORS.sky, 40, 95]} />
      <hemisphereLight intensity={0.48} color="#d9e2e8" groundColor="#4a4030" />
      <directionalLight
        castShadow
        position={[22, 34, 14]}
        intensity={1.05}
        color="#f2e6d4"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.035}
        shadow-camera-far={100}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
      <ambientLight intensity={0.2} />
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
