import { PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'

export function HUD() {
  const score = useGameStore((s) => s.score)
  const enemies = useGameStore((s) => s.enemies)
  const round = useGameStore((s) => s.round)
  const health = useGameStore((s) => s.health)
  const left = enemies.filter((e) => e.alive).length
  const healthPct = Math.max(0, Math.round((health / PLAYER.maxHealth) * 100))
  const critical = healthPct <= 30

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="sims-panel select-none px-4 py-2.5">
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/60 sm:text-xs">
            SCORE
          </div>
          <div className="pulse-glow text-2xl font-extrabold leading-none tracking-wide text-[#6FE04A] sm:text-3xl">
            {String(score).padStart(5, '0')}
          </div>
        </div>

        <div className="sims-panel select-none px-4 py-2.5 text-right">
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/60 sm:text-xs">
            WAVE {round}
          </div>
          <div className="text-lg font-extrabold tracking-wide text-white sm:text-xl">
            HOSTILES <span className="text-[#FF7A59]">{left}</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-14 left-1/2 z-30 w-48 -translate-x-1/2 select-none sm:bottom-10 sm:w-60">
        <div className="sims-panel px-3 py-2">
          <div className="mb-1.5 flex items-end justify-between text-[9px] font-bold tracking-[0.18em] text-white/65">
            <span>VITALS</span>
            <span className={critical ? 'text-[#FF7A59]' : 'text-[#6FE04A]'}>{healthPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/20 bg-black/35">
            <div
              className={`h-full rounded-full transition-[width] duration-150 ${
                critical ? 'bg-[#FF7A59]' : 'bg-[#6FE04A]'
              }`}
              style={{ width: `${healthPct}%` }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
