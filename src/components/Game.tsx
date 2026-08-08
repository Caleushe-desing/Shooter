import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PlayerController } from './scene/PlayerController'
import { ProceduralMap } from './scene/ProceduralMap'

function Scene() {
  return (
    <>
      <color attach="background" args={['#cfc7bb']} />
      <fog attach="fog" args={['#cfc7bb', 48, 88]} />
      <hemisphereLight intensity={0.55} color="#f2ebe2" groundColor="#8a8070" />
      <ambientLight intensity={0.38} color="#ebe4da" />
      {/* Soft window key — warm, not blown out */}
      <directionalLight
        castShadow
        position={[24, 20, 10]}
        intensity={0.95}
        color="#f0e2cc"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.035}
        shadow-camera-far={75}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
      />
      <directionalLight position={[-18, 12, -8]} intensity={0.2} color="#d8dde6" />
      <pointLight position={[0, 10, -10]} intensity={0.35} color="#f2e8d8" distance={36} />
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
