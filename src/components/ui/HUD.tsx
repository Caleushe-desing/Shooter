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
        <div className="select-none">
          <div className="text-[10px] tracking-[0.35em] text-white/70 sm:text-xs">SCORE</div>
          <div className="pulse-glow text-2xl leading-none tracking-widest text-[#00FF00] sm:text-3xl">
            {String(score).padStart(5, '0')}
          </div>
        </div>

        <div className="select-none text-right">
          <div className="text-[10px] tracking-[0.35em] text-white/70 sm:text-xs">
            WAVE {round}
          </div>
          <div className="text-lg tracking-widest text-white sm:text-xl">
            HOSTILES <span className="text-[#FF3B30]">{left}</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-14 left-1/2 z-30 w-44 -translate-x-1/2 select-none sm:bottom-10 sm:w-56">
        <div className="mb-1 flex items-end justify-between text-[9px] tracking-[0.3em] text-white/60">
          <span>VITALS</span>
          <span className={critical ? 'text-[#FF3B30]' : 'text-white/70'}>{healthPct}%</span>
        </div>
        <div className="h-1.5 w-full border border-white/30 bg-black/60">
          <div
            className={`h-full transition-[width] duration-150 ${
              critical ? 'bg-[#FF3B30]' : 'bg-[#00FF00]'
            }`}
            style={{ width: `${healthPct}%` }}
          />
        </div>
      </div>
    </>
  )
}
