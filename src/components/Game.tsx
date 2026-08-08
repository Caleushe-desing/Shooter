import { Canvas } from '@react-three/fiber'
import { Cloud, Clouds, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { Arena } from './scene/Arena'
import { PlayerController } from './scene/PlayerController'
import { PickupSystem } from './scene/PickupSystem'
import { GhostSystem } from './scene/GhostSystem'
import { PortalSystem } from './scene/PortalSystem'
import { MobileControls } from './ui/MobileControls'
import { Crosshair } from './ui/Crosshair'
import { CombatHud } from './ui/CombatHud'
import { useIsMobile } from '../hooks/useIsMobile'
import { COLORS, VIEW_RANGE } from '../constants'

function Scene() {
  return (
    <>
      <fog attach="fog" args={[COLORS.skyHaze, VIEW_RANGE, VIEW_RANGE + 90]} />
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
      <PickupSystem />
      <PortalSystem />
      <GhostSystem />
      <PlayerController />
    </>
  )
}

function ControlsHint() {
  const mobile = useIsMobile()
  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-20 max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-md bg-black/40 px-3 py-1.5 text-center text-[10px] tracking-[0.1em] text-white/85 sm:text-[11px] sm:tracking-[0.12em] ${
        mobile ? 'bottom-36' : 'bottom-4'
      }`}
    >
      {mobile
        ? 'IZQ MOVER · DER MIRAR/DISPARO · ARRIBA VISTA'
        : 'CLIC+ARRASTRAR MIRAR · WASD · V VISTA · RUEDA ZOOM'}
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
      <MobileControls />
      {/* HUD above touch fire layer so zoom / camera buttons aren't treated as shots. */}
      <CombatHud />
      <ControlsHint />
    </div>
  )
}
