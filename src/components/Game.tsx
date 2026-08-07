import { Canvas } from '@react-three/fiber'
import { Arena } from './scene/Arena'
import { PlayerController } from './scene/PlayerController'
import { EnemySystem } from './scene/EnemySystem'
import { MobileControls } from './ui/MobileControls'
import { Crosshair } from './ui/Crosshair'
import { CombatHud } from './ui/CombatHud'
import { useIsMobile } from '../hooks/useIsMobile'
import { COLORS } from '../constants'

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={[COLORS.skyHaze, 45, 130]} />
      <ambientLight intensity={0.55} color="#E8EEF2" />
      <hemisphereLight args={['#B8D0E0', '#6A8A50', 0.55]} />
      <directionalLight
        position={[28, 42, 18]}
        intensity={1.35}
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
      <EnemySystem />
    </>
  )
}

function ControlsHint() {
  const mobile = useIsMobile()
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-black/40 px-3 py-1.5 text-[11px] tracking-[0.12em] text-white/85">
      {mobile
        ? 'IZQ MOVER · DER DISPARO/MIRAR · 1ª/3ª · SALTAR · CORRER'
        : 'CLIC MIRAR/DISPARAR · WASD · SHIFT · SPACE · V VISTA'}
    </div>
  )
}

export function Game() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#6FA8C8]">
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
