import { useGameStore } from '../../store/gameStore'

/** Survival HUD: orbs left, revolver ammo, camera toggle, win/lose. */
export function CombatHud() {
  const cameraMode = useGameStore((s) => s.cameraMode)
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode)
  const orbsRemaining = useGameStore((s) => s.orbsRemaining)
  const orbsTotal = useGameStore((s) => s.orbsTotal)
  const ammo = useGameStore((s) => s.ammo)
  const ammoMax = useGameStore((s) => s.ammoMax)
  const score = useGameStore((s) => s.score)
  const status = useGameStore((s) => s.status)
  const restartRun = useGameStore((s) => s.restartRun)
  const ammoLow = ammo <= 1

  const camLabel =
    cameraMode === 'top' ? 'VISTA 2D' : cameraMode === 'first' ? '1ª PERSONA' : '3ª PERSONA'

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-1.5">
        <div className="rounded bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/65">
            ORBES
          </div>
          <div className="text-lg font-bold tracking-wide text-[#F2E08A]">
            {orbsRemaining}
            <span className="ml-1 text-sm font-normal text-white/50">/ {orbsTotal}</span>
          </div>
        </div>
        <div className="rounded bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/65">
            MUNICIÓN
          </div>
          <div
            className={`text-lg font-bold tracking-wide ${
              ammoLow ? 'text-[#E24A3A]' : 'text-[#E8F0FF]'
            }`}
          >
            {ammo}
            <span className="ml-1 text-sm font-normal text-white/50">/ {ammoMax}</span>
          </div>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: ammoMax }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-2.5 rounded-sm ${
                  i < ammo ? 'bg-[#E8C86A]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="rounded bg-black/45 px-2.5 py-1 text-[11px] tracking-[0.12em] text-white/80 backdrop-blur-sm">
          PUNTOS <span className="font-semibold text-[#F2E08A]">{score}</span>
        </div>
        <div className="rounded bg-black/40 px-2.5 py-1 text-[10px] tracking-[0.12em] text-white/60 backdrop-blur-sm">
          {status === 'playing' && 'EN CURSO'}
          {status === 'won' && 'VICTORIA'}
          {status === 'lost' && 'DERROTA'}
        </div>
      </div>

      <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
        <button
          type="button"
          className="pointer-events-auto rounded border border-white/40 bg-black/50 px-3 py-2 text-[11px] font-bold tracking-[0.14em] text-white/90 shadow-md backdrop-blur-sm hover:border-[#E8C86A]/80 hover:text-[#F2E08A] active:scale-95"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleCameraMode()
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
          }}
        >
          {camLabel}
          <span className="mt-0.5 block text-[9px] font-normal tracking-[0.08em] text-white/55">
            TOCÁ · V
          </span>
        </button>
      </div>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#101418]/72 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div
              className={`text-3xl font-semibold tracking-[0.16em] ${
                status === 'won' ? 'text-[#F2E08A]' : 'text-[#F2C6C0]'
              }`}
            >
              {status === 'won' ? '¡VICTORIA!' : 'GAME OVER'}
            </div>
            <div className="text-sm tracking-[0.08em] text-white/75">
              {status === 'won'
                ? 'Recogiste todos los orbes dorados.'
                : 'Un zombie te atrapó.'}
            </div>
            <div className="text-sm tracking-[0.08em] text-white/70">
              Puntos: <span className="text-[#F2E08A]">{score}</span>
            </div>
            <button
              type="button"
              className="rounded border border-[#E8C86A]/80 bg-[#3A2A10]/90 px-5 py-2.5 text-sm font-bold tracking-[0.16em] text-[#F2E08A] shadow-md hover:bg-[#E8C86A] hover:text-[#1A1408]"
              onClick={() => restartRun()}
            >
              REINTENTAR
            </button>
          </div>
        </div>
      )}
    </>
  )
}
