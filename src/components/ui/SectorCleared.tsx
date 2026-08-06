import { useGameStore } from '../../store/gameStore'

/** Survival game-over only — no wave / level clear screen. */
export function SectorCleared() {
  const caught = useGameStore((s) => s.caught)
  const score = useGameStore((s) => s.score)
  const startedAt = useGameStore((s) => s.startedAt)
  const restartGame = useGameStore((s) => s.restartGame)

  if (!caught) return null

  const survivedSec = Math.max(0, Math.floor((performance.now() - startedAt) / 1000))
  const mins = Math.floor(survivedSec / 60)
  const secs = survivedSec % 60
  const timeLabel = `${mins}:${String(secs).padStart(2, '0')}`

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#4BA3E3]/40 px-4 backdrop-blur-sm">
      <div className="sector-panel sims-panel w-full max-w-md px-6 py-8 text-center">
        <div className="pulse-glow text-3xl font-extrabold tracking-[0.18em] text-[#FF7A59] sm:text-4xl">
          CAÍSTE
        </div>
        <p className="mt-3 text-sm font-bold tracking-widest text-white/80">
          MODO SUPERVIVENCIA
        </p>
        <p className="mt-6 text-xs font-bold tracking-[0.28em] text-white/55">TIEMPO VIVO</p>
        <p className="mt-1 text-2xl font-extrabold tracking-widest text-white">{timeLabel}</p>
        <p className="mt-4 text-xs font-bold tracking-[0.28em] text-white/55">PUNTAJE</p>
        <p className="mt-1 text-2xl font-extrabold tracking-widest text-[#6FE04A]">{score}</p>
        <button
          type="button"
          onClick={restartGame}
          className="mt-8 w-full rounded-full border border-[#FF7A59] bg-[#FF7A59] px-4 py-3 text-sm font-extrabold tracking-[0.3em] text-white shadow-md transition active:scale-[0.98]"
        >
          REINTENTAR
        </button>
      </div>
    </div>
  )
}
