import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PlayerController } from './scene/PlayerController'
import { ProceduralMap } from './scene/ProceduralMap'

function Scene() {
  return (
    <>
      <color attach="background" args={['#d8d2c8']} />
      <fog attach="fog" args={['#d8d2c8', 55, 95]} />
      <hemisphereLight intensity={0.7} color="#fff8f0" groundColor="#b8a888" />
      <ambientLight intensity={0.5} color="#f4eee6" />
      {/* Warm window light from the east */}
      <directionalLight
        castShadow
        position={[28, 22, 8]}
        intensity={0.85}
        color="#ffe8c8"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.04}
        shadow-camera-far={80}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
      />
      <directionalLight position={[-16, 14, -10]} intensity={0.22} color="#e8f0ff" />
      <pointLight position={[2, 12, -18]} intensity={0.55} color="#fff2d8" distance={40} />
      <ProceduralMap />
      <PlayerController />
    </>
  )
}

/** Clean TPS canvas — plastic soldier in a giant house. */
export function Game() {
  return (
    <div className="game-root">
      <Canvas shadows camera={{ fov: 58, near: 0.1, far: 220, position: [0, 4, 8] }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
