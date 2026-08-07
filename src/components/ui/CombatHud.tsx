import { COMBAT } from '../../constants'
import { useGameStore } from '../../store/gameStore'

/** Health, kills, camera mode toggle, and death / restart overlay. */
export function CombatHud() {
  const health = useGameStore((s) => s.health)
  const kills = useGameStore((s) => s.kills)
  const alive = useGameStore((s) => s.alive)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const restartRun = useGameStore((s) => s.restartRun)
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode)

  const pct = Math.max(0, Math.min(100, (health / COMBAT.maxHealth) * 100))
  const low = health <= 30
  const isFirst = cameraMode === 'first'

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-1.5">
        <div className="rounded bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-white/70">VIDA</div>
          <div className="h-2.5 w-40 overflow-hidden rounded-sm bg-black/50">
            <div
              className="h-full rounded-sm transition-[width] duration-150"
              style={{
                width: `${pct}%`,
                background: low ? '#E24A3A' : '#6FCF5A',
              }}
            />
          </div>
        </div>
        <div className="rounded bg-black/45 px-2.5 py-1 text-[11px] tracking-[0.12em] text-white/85 backdrop-blur-sm">
          BAJAS <span className="font-semibold text-[#F2E08A]">{kills}</span>
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
          {isFirst ? '1ª PERSONA' : '3ª PERSONA'}
          <span className="mt-0.5 block text-[9px] font-normal tracking-[0.08em] text-white/55">
            TOCÁ · V
          </span>
        </button>
      </div>

      {!alive && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#1A1010]/72 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="text-3xl font-semibold tracking-[0.18em] text-[#F2C6C0]">HAS MUERTO</div>
            <div className="text-sm tracking-[0.08em] text-white/75">
              Bajas: <span className="text-[#F2E08A]">{kills}</span>
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
