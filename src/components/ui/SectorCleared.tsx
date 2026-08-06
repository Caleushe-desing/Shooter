import { useGameStore } from '../../store/gameStore'

export function SectorCleared() {
  const cleared = useGameStore((s) => s.sectorCleared)
  const score = useGameStore((s) => s.score)
  const resetRound = useGameStore((s) => s.resetRound)

  if (!cleared) return null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <div className="sector-panel w-full max-w-md border border-[#00FF00]/60 bg-black/80 px-6 py-8 text-center shadow-[0_0_40px_rgba(0,255,0,0.25)]">
        <div className="pulse-glow text-3xl tracking-[0.2em] text-[#00FF00] sm:text-4xl">
          SECTOR CLEARED
        </div>
        <p className="mt-3 text-sm tracking-widest text-white/80">
          ALL TARGETS DESTROYED
        </p>
        <p className="mt-6 text-xs tracking-[0.3em] text-white/60">TOTAL SCORE</p>
        <p className="mt-1 text-2xl tracking-widest text-white">{score}</p>
        <button
          type="button"
          onClick={resetRound}
          className="mt-8 w-full border border-[#00FF00] bg-[#00FF00]/10 px-4 py-3 text-sm tracking-[0.35em] text-[#00FF00] transition hover:bg-[#00FF00]/25 active:scale-[0.98]"
        >
          NEXT SECTOR
        </button>
      </div>
    </div>
  )
}
