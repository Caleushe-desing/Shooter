import { useGameStore } from '../../store/gameStore'

/** Hip-fire reticle — hidden while looking through the telescopic sight. */
export function Crosshair() {
  const scoped = useGameStore((s) => s.scoped)
  if (scoped) return null

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
      <div className="relative h-6 w-6">
        <div className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-[#00FF00]" />
        <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-[#00FF00]" />
        <div className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#00FF00]" />
        <div className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#00FF00]" />
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00BFFF]" />
      </div>
    </div>
  )
}
