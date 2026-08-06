import { useGameStore } from '../../store/gameStore'

/** Optics overlay drawn while the telescopic sight is engaged. */
export function ScopeOverlay() {
  const scoped = useGameStore((s) => s.scoped)
  if (!scoped) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* Blackout around the eyepiece */}
      <div className="scope-mask absolute inset-0" />

      <div className="absolute left-1/2 top-1/2 h-[68vmin] w-[68vmin] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-full border-2 border-black/80" />
        <div className="absolute inset-[3%] rounded-full border border-[#00FF00]/25" />

        {/* Crosshairs */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/70" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black/70" />

        {/* Mil-dot ladder below the centre */}
        {[10, 18, 26, 34].map((offset) => (
          <div
            key={offset}
            className="absolute left-1/2 h-px -translate-x-1/2 bg-black/70"
            style={{ top: `calc(50% + ${offset}%)`, width: offset > 26 ? '9%' : '6%' }}
          />
        ))}
        {[-34, -26, -18, -10, 10, 18, 26, 34].map((offset) => (
          <div
            key={`h-${offset}`}
            className="absolute top-1/2 w-px -translate-y-1/2 bg-black/70"
            style={{ left: `calc(50% + ${offset}%)`, height: '4%' }}
          />
        ))}

        {/* Aiming pip */}
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF3B30]" />
      </div>

      <div className="absolute bottom-[16vmin] left-1/2 -translate-x-1/2 text-[10px] tracking-[0.35em] text-[#00FF00]/70">
        SCOPE 3.4x
      </div>
    </div>
  )
}

/** Toggle button; also bound to right click and Z on desktop. */
export function ScopeButton() {
  const scoped = useGameStore((s) => s.scoped)
  const toggleScope = useGameStore((s) => s.toggleScope)
  const caught = useGameStore((s) => s.caught)
  const sectorCleared = useGameStore((s) => s.sectorCleared)

  if (caught || sectorCleared) return null

  return (
    <button
      type="button"
      aria-pressed={scoped}
      aria-label="Toggle telescopic sight"
      onPointerDown={(e) => {
        // Keep the look/fire zone underneath from stealing the gesture.
        e.preventDefault()
        e.stopPropagation()
        toggleScope()
      }}
      className={`absolute bottom-28 right-4 z-40 select-none border px-4 py-3 text-[10px] tracking-[0.3em] transition active:scale-[0.97] sm:bottom-24 sm:right-6 ${
        scoped
          ? 'border-[#FF3B30] bg-[#FF3B30]/25 text-[#FF3B30]'
          : 'border-[#00FF00]/70 bg-black/55 text-[#00FF00]'
      }`}
    >
      {scoped ? 'HIP FIRE' : 'SCOPE'}
    </button>
  )
}
