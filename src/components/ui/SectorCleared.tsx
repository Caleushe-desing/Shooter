import { useGameStore } from '../../store/gameStore'

export function SectorCleared() {
  const cleared = useGameStore((s) => s.sectorCleared)
  const caught = useGameStore((s) => s.caught)
  const score = useGameStore((s) => s.score)
  const round = useGameStore((s) => s.round)
  const resetRound = useGameStore((s) => s.resetRound)
  const restartGame = useGameStore((s) => s.restartGame)

  if (!cleared && !caught) return null

  const accent = caught ? '#FF7A59' : '#6FE04A'
  const accentInk = caught ? '#FFFFFF' : '#1A2430'

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#4BA3E3]/40 px-4 backdrop-blur-sm">
      <div className="sector-panel sims-panel w-full max-w-md px-6 py-8 text-center">
        <div
          className="pulse-glow text-3xl font-extrabold tracking-[0.18em] sm:text-4xl"
          style={{ color: accent }}
        >
          {caught ? 'YOU WERE CAUGHT' : 'WAVE CLEARED'}
        </div>
        <p className="mt-3 text-sm font-bold tracking-widest text-white/80">
          {caught ? 'THE HORDE GOT YOU' : 'ALL HOSTILES DOWN'}
        </p>
        <p className="mt-6 text-xs font-bold tracking-[0.28em] text-white/55">
          {caught ? `SURVIVED ${round} WAVE${round > 1 ? 'S' : ''}` : 'TOTAL SCORE'}
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-widest text-white">{score}</p>
        <button
          type="button"
          onClick={caught ? restartGame : resetRound}
          className="mt-8 w-full rounded-full border px-4 py-3 text-sm font-extrabold tracking-[0.3em] shadow-md transition active:scale-[0.98]"
          style={{
            borderColor: accent,
            color: accentInk,
            backgroundColor: accent,
          }}
        >
          {caught ? 'TRY AGAIN' : 'NEXT WAVE'}
        </button>
      </div>
    </div>
  )
}
