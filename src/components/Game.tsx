import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Arena } from './scene/Arena'
import { Sky } from './scene/Sky'
import { PlayerController } from './scene/PlayerController'
import { Tracers } from './scene/Tracers'
import { Explosions } from './scene/Explosions'
import { PierceHoles } from './scene/PierceHoles'
import { HUD } from './ui/HUD'
import { InventoryHUD } from './ui/InventoryHUD'
import { Crosshair } from './ui/Crosshair'
import { ScopeButton, ScopeOverlay } from './ui/Scope'
import { MobileControls } from './ui/MobileControls'
import { ControlSettings } from './ui/ControlSettings'
import { AudioBoot } from './ui/AudioBoot'
import { SectorCleared } from './ui/SectorCleared'
import { LandscapeGate } from './ui/LandscapeGate'
import { FullscreenButton } from './ui/FullscreenButton'
import { COLORS } from '../constants'

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={[COLORS.skyHaze, 18, 55]} />
      <ambientLight intensity={0.62} color="#E8EEF2" />
      <hemisphereLight args={['#B8D0E0', '#6A8A50', 0.55]} />
      <directionalLight position={[12, 22, 10]} intensity={1.2} color="#FFF2D8" castShadow={false} />
      <directionalLight position={[-10, 10, -8]} intensity={0.3} color="#8AACC4" />
      <Sky />
      <Arena />
      <PlayerController />
      <Tracers />
      <Explosions />
      <PierceHoles />
    </>
  )
}

export function Game() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#6FA8C8]">
      <Canvas
        className="absolute inset-0 h-full w-full touch-none"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.75]}
        onCreated={({ gl }) => {
          gl.setClearColor(COLORS.sky, 1)
          gl.toneMappingExposure = 1.02
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <Crosshair />
      <ScopeOverlay />
      <ScopeButton />
      <HUD />
      <FullscreenButton />
      <InventoryHUD />
      <MobileControls />
      <ControlSettings />
      <AudioBoot />
      <SectorCleared />
      <LandscapeGate />

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 hidden -translate-x-1/2 rounded-md bg-black/35 px-3 py-1 text-[10px] tracking-[0.12em] text-white/80 sm:block">
        WASD · SHIFT CORRER · ALT LENTO · CTRL AGACHAR · X ACOSTAR · ESPACIO SALTAR · F DISPARAR
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-md bg-black/35 px-3 py-1 text-[9px] tracking-[0.1em] text-white/75 sm:hidden">
        JOYSTICK · CORRER / LENTO / AGACHAR / ACOSTAR / SALTAR
      </div>
    </div>
  )
}
