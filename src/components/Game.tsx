import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Arena } from './scene/Arena'
import { Sky } from './scene/Sky'
import { PlayerController } from './scene/PlayerController'
import { Tracers } from './scene/Tracers'
import { Fauna } from './scene/Fauna'
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
      <fog attach="fog" args={[COLORS.skyHaze, 120, 520]} />
      <ambientLight intensity={0.55} color="#D8E0E4" />
      <hemisphereLight args={['#8AABBE', '#4A5A3A', 0.55]} />
      <directionalLight position={[40, 60, 20]} intensity={1.15} color="#F0E4C8" castShadow={false} />
      <directionalLight position={[-20, 18, -14]} intensity={0.28} color="#6A8AAA" />
      <Sky />
      <Arena />
      <Fauna />
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
        WASD · E RECOGER · V CAVAR · C ESCANEAR · I INVENTARIO · Q DUCHA · R PESCAR
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-md bg-black/35 px-3 py-1 text-[9px] tracking-[0.1em] text-white/75 sm:hidden">
        MOVER · I INVENTARIO · E RECOGER · V CAVAR
      </div>
    </div>
  )
}
