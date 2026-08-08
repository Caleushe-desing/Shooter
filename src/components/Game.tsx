import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PlayerController } from './scene/PlayerController'
import { ProceduralMap } from './scene/ProceduralMap'

function Scene() {
  return (
    <>
      <color attach="background" args={['#c8d0d8']} />
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

/** Clean TPS canvas — no HUD overlays (minimap / compass come next). */
export function Game() {
  return (
    <div className="game-root">
      <Canvas shadows camera={{ fov: 58, near: 0.1, far: 200, position: [0, 4, 8] }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
