import { useGameStore } from '../../store/gameStore'

export function SectorCleared() {
  const cleared = useGameStore((s) => s.sectorCleared)
  const caught = useGameStore((s) => s.caught)
  const score = useGameStore((s) => s.score)
  const round = useGameStore((s) => s.round)
  const resetRound = useGameStore((s) => s.resetRound)
  const restartGame = useGameStore((s) => s.restartGame)

  if (!cleared && !caught) return null

  const accent = caught ? '#FF3B30' : '#00FF00'

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <div
        className="sector-panel w-full max-w-md border bg-black/80 px-6 py-8 text-center"
        style={{ borderColor: `${accent}99`, boxShadow: `0 0 40px ${accent}40` }}
      >
        <div
          className="pulse-glow text-3xl tracking-[0.2em] sm:text-4xl"
          style={{ color: accent }}
        >
          {caught ? 'YOU WERE CAUGHT' : 'WAVE CLEARED'}
        </div>
        <p className="mt-3 text-sm tracking-widest text-white/80">
          {caught ? 'THE HORDE GOT YOU' : 'ALL HOSTILES DOWN'}
        </p>
        <p className="mt-6 text-xs tracking-[0.3em] text-white/60">
          {caught ? `SURVIVED ${round} WAVE${round > 1 ? 'S' : ''}` : 'TOTAL SCORE'}
        </p>
        <p className="mt-1 text-2xl tracking-widest text-white">{score}</p>
        <button
          type="button"
          onClick={caught ? restartGame : resetRound}
          className="mt-8 w-full border px-4 py-3 text-sm tracking-[0.35em] transition active:scale-[0.98]"
          style={{ borderColor: accent, color: accent, backgroundColor: `${accent}1A` }}
        >
          {caught ? 'TRY AGAIN' : 'NEXT WAVE'}
        </button>
      </div>
    </div>
  )
}
