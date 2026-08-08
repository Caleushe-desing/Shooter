import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { CAMERA } from '../constants'
import { Crosshair } from './hud/Crosshair'
import { PlayerController } from './scene/PlayerController'
import { ProceduralMap } from './scene/ProceduralMap'

function Scene() {
  return (
    <>
      <color attach="background" args={['#cfc7bb']} />
      <fog attach="fog" args={['#cfc7bb', 55, 110]} />
      <hemisphereLight intensity={0.55} color="#f2ebe2" groundColor="#8a8070" />
      <ambientLight intensity={0.4} color="#ebe4da" />
      <directionalLight
        castShadow
        position={[26, 28, 12]}
        intensity={0.95}
        color="#f0e2cc"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.035}
        shadow-camera-far={90}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <directionalLight position={[-18, 16, -8]} intensity={0.22} color="#d8dde6" />
      <pointLight position={[0, 12, -10]} intensity={0.4} color="#f2e8d8" distance={48} />
      <ProceduralMap />
      <PlayerController />
    </>
  )
}

/** Wide TPS canvas — plastic soldier in a multi-level giant house. */
export function Game() {
  return (
    <div className="game-root">
      <Canvas
        shadows
        camera={{
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
          position: [0, 6, 14],
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Crosshair />
    </div>
  )
}
