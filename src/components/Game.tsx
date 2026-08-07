import { Canvas } from '@react-three/fiber'
import { Arena } from './scene/Arena'
import { PlayerController } from './scene/PlayerController'
import { COLORS } from '../constants'
import { useGameStore } from '../store/gameStore'

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

function Hud() {
  const status = useGameStore((s) => s.avatarStatus)
  const crouched = useGameStore((s) => s.crouched)

  return (
    <>
      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-md bg-black/55 px-4 py-2 text-sm tracking-[0.14em] text-white">
            CARGANDO PERSONAJE…
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-md bg-red-900/80 px-3 py-1.5 text-xs text-white">
          No se pudo cargar el modelo humano
        </div>
      )}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-black/40 px-3 py-1.5 text-[11px] tracking-[0.12em] text-white/85">
        CLIC · WASD · SHIFT CORRER · CTRL AGACHAR
        {crouched ? ' · AGACHADO' : ''}
      </div>
    </>
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
      <Hud />
    </div>
  )
}
