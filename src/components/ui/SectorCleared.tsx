import { useGameStore } from '../../store/gameStore'

/** Colonist game-over when needs / vitality collapse. */
export function SectorCleared() {
  const caught = useGameStore((s) => s.caught)
  const restartGame = useGameStore((s) => s.restartGame)

  if (!caught) return null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#4BA3E3]/40 px-4 backdrop-blur-sm">
      <div className="sector-panel sims-panel w-full max-w-md px-6 py-8 text-center">
        <div className="pulse-glow text-3xl font-extrabold tracking-[0.18em] text-[#FF7A59] sm:text-4xl">
          AGOTADO
        </div>
        <p className="mt-3 text-sm font-bold tracking-widest text-white/80">
          El colono no resistió
        </p>
        <p className="mt-4 text-sm text-white/65">
          Come, bebe y dúchate en el lago. Construye un refugio para tu ciudad.
        </p>
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
