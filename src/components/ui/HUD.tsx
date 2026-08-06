import { useGameStore } from '../../store/gameStore'

export function HUD() {
  const score = useGameStore((s) => s.score)
  const plates = useGameStore((s) => s.plates)
  const round = useGameStore((s) => s.round)
  const left = plates.length

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="select-none">
        <div className="text-[10px] tracking-[0.35em] text-white/70 sm:text-xs">SCORE</div>
        <div className="pulse-glow text-2xl leading-none tracking-widest text-[#00FF00] sm:text-3xl">
          {String(score).padStart(5, '0')}
        </div>
      </div>

      <div className="select-none text-right">
        <div className="text-[10px] tracking-[0.35em] text-white/70 sm:text-xs">
          SECTOR {round}
        </div>
        <div className="text-lg tracking-widest text-white sm:text-xl">
          TARGETS <span className="text-[#00FF00]">{left}</span>
        </div>
      </div>
    </div>
  )
}
