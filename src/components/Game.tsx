import { Canvas } from '@react-three/fiber'
import { Arena } from './scene/Arena'
import { PlayerController } from './scene/PlayerController'
import { MobileControls } from './ui/MobileControls'
import { useIsMobile } from '../hooks/useIsMobile'
import { COLORS } from '../constants'

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={[COLORS.skyHaze, 30, 70]} />
      <ambientLight intensity={0.7} color="#E8EEF2" />
      <hemisphereLight args={['#B8D0E0', '#6A8A50', 0.55]} />
      <directionalLight position={[12, 22, 10]} intensity={1.15} color="#FFF2D8" />
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
        ? 'JOYSTICK · BOTÓN CORRER · DEDO DERECHO MIRAR'
        : 'CLIC · WASD · SHIFT CORRER'}
    </div>
  )
}

export function Game() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#6FA8C8]">
      <Canvas
        className="absolute inset-0 h-full w-full touch-none"
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        onCreated={({ gl }) => {
          gl.setClearColor(COLORS.sky, 1)
        }}
      >
        <Scene />
      </Canvas>

      <MobileControls />
      <ControlsHint />
    </div>
  )
}
