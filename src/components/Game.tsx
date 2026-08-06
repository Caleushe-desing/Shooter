import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Arena } from './scene/Arena'
import { Sky } from './scene/Sky'
import { PlayerController } from './scene/PlayerController'
import { Tracers } from './scene/Tracers'
import { Enemies } from './scene/Enemies'
import { Fauna } from './scene/Fauna'
import { Explosions } from './scene/Explosions'
import { PierceHoles } from './scene/PierceHoles'
import { CRTOverlay } from './ui/CRTOverlay'
import { HUD } from './ui/HUD'
import { InventoryHUD } from './ui/InventoryHUD'
import { Crosshair } from './ui/Crosshair'
import { ScopeButton, ScopeOverlay } from './ui/Scope'
import { MobileControls } from './ui/MobileControls'
import { ControlSettings } from './ui/ControlSettings'
import { AudioBoot } from './ui/AudioBoot'
import { SectorCleared } from './ui/SectorCleared'
import { LandscapeGate } from './ui/LandscapeGate'
import { COLORS } from '../constants'

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={[COLORS.skyHaze, 70, 220]} />
      <ambientLight intensity={0.95} color="#FFF8F0" />
      <hemisphereLight args={['#B8E4FF', '#8BCF6E', 0.7]} />
      <directionalLight position={[14, 22, 10]} intensity={1.35} color="#FFE7B8" castShadow={false} />
      <directionalLight position={[-10, 8, -6]} intensity={0.35} color="#A8D4FF" />
      <Sky />
      <Arena />
      <Fauna />
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
    <div className="relative h-full w-full overflow-hidden bg-[#7EC8F5]">
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
          gl.toneMappingExposure = 1.18
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <CRTOverlay />
      <Crosshair />
      <ScopeOverlay />
      <ScopeButton />
      <HUD />
      <InventoryHUD />
      <MobileControls />
      <ControlSettings />
      <AudioBoot />
      <SectorCleared />
      <LandscapeGate />

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 hidden -translate-x-1/2 rounded-full bg-black/25 px-3 py-1 text-[10px] tracking-[0.18em] text-white/80 sm:block">
        WASD · MIRAR · DISPARAR · E RECOGER · I MOCHILA · Z MIRA
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/25 px-3 py-1 text-[9px] tracking-[0.16em] text-white/75 sm:hidden">
        MOVER · MIRAR · DISPARAR · RECOGER
      </div>
    </div>
  )
}
