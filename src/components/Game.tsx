import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Arena } from './scene/Arena'
import { PlayerController } from './scene/PlayerController'
import { Tracers } from './scene/Tracers'
import { Enemies } from './scene/Enemies'
import { Explosions } from './scene/Explosions'
import { PierceHoles } from './scene/PierceHoles'
import { CRTOverlay } from './ui/CRTOverlay'
import { HUD } from './ui/HUD'
import { Crosshair } from './ui/Crosshair'
import { MobileControls } from './ui/MobileControls'
import { SectorCleared } from './ui/SectorCleared'
import { LandscapeGate } from './ui/LandscapeGate'
import { COLORS } from '../constants'

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.black]} />
      <fog attach="fog" args={[COLORS.black, 14, 40]} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#9fe8c0', '#0a1410', 0.7]} />
      <directionalLight position={[6, 12, 4]} intensity={0.8} />
      <Arena />
      <PlayerController />
      <Enemies />
      <Tracers />
      <Explosions />
      <PierceHoles />
    </>
  )
}

export function Game() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Canvas
        className="absolute inset-0 h-full w-full touch-none"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.75]}
        onCreated={({ gl }) => {
          gl.setClearColor(COLORS.black, 1)
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <CRTOverlay />
      <Crosshair />
      <HUD />
      <MobileControls />
      <SectorCleared />
      <LandscapeGate />

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 hidden -translate-x-1/2 text-[10px] tracking-[0.3em] text-white/40 sm:block">
        WASD MOVE · MOUSE LOOK · CLICK / F FIRE
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 text-[9px] tracking-[0.25em] text-white/35 sm:hidden">
        JOYSTICK · DRAG LOOK · PRESS HARD TO FIRE
      </div>
    </div>
  )
}
