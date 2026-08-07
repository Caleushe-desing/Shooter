import { Canvas } from '@react-three/fiber'
import { Cloud, Clouds, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { Arena } from './scene/Arena'
import { PlayerController } from './scene/PlayerController'
import { MobileControls } from './ui/MobileControls'
import { Crosshair } from './ui/Crosshair'
import { CombatHud } from './ui/CombatHud'
import { useIsMobile } from '../hooks/useIsMobile'
import { COLORS } from '../constants'

function Scene() {
  return (
    <>
      <fog attach="fog" args={[COLORS.skyHaze, 55, 145]} />
      <Sky
        sunPosition={[48, 28, 18]}
        turbidity={4.5}
        rayleigh={1.15}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
        inclination={0.48}
        azimuth={0.22}
      />
      <Clouds material={THREE.MeshBasicMaterial} limit={24}>
        <Cloud
          seed={1}
          position={[-18, 42, -28]}
          speed={0.08}
          opacity={0.55}
          segments={18}
          bounds={[28, 6, 12]}
          volume={8}
          color="#F4F7FA"
        />
        <Cloud
          seed={4}
          position={[22, 48, 8]}
          speed={0.06}
          opacity={0.48}
          segments={16}
          bounds={[24, 5, 14]}
          volume={7}
          color="#EEF3F8"
        />
        <Cloud
          seed={9}
          position={[0, 46, 36]}
          speed={0.05}
          opacity={0.42}
          segments={14}
          bounds={[30, 5, 10]}
          volume={6}
          color="#F7FAFC"
        />
        <Cloud
          seed={12}
          position={[-30, 40, 20]}
          speed={0.07}
          opacity={0.4}
          segments={12}
          bounds={[18, 4, 10]}
          volume={5}
          color="#F0F4F8"
        />
      </Clouds>
      <ambientLight intensity={0.5} color="#E8EEF2" />
      <hemisphereLight args={['#B8D0E0', '#6A8A50', 0.5]} />
      <directionalLight
        position={[28, 42, 18]}
        intensity={1.25}
        color="#FFF2D8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={2}
        shadow-camera-far={120}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0002}
      />
      <Arena />
      <PlayerController />
    </>
  )
}

function ControlsHint() {
  const mobile = useIsMobile()
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-black/40 px-3 py-1.5 text-[11px] tracking-[0.12em] text-white/85">
      {mobile
        ? 'IZQ MOVER · DER MIRAR · 1ª/3ª · SALTAR · CORRER'
        : 'CLIC MIRAR · WASD · SHIFT · SPACE · V VISTA'}
    </div>
  )
}

export function Game() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#7BA8C4]">
      <Canvas
        className="absolute inset-0 h-full w-full touch-none"
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        onCreated={({ gl }) => {
          gl.setClearColor(COLORS.sky, 1)
        }}
      >
        <Scene />
      </Canvas>

      <Crosshair />
      <CombatHud />
      <MobileControls />
      <ControlsHint />
    </div>
  )
}
