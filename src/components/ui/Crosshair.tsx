import { WEAPON } from '../../constants'
import { useGameStore } from '../../store/gameStore'

/** Off-center TPS reticle (over-the-shoulder) with shot kick. */
export function Crosshair() {
  const shotId = useGameStore((s) => s.shotId)

  return (
    <>
      <div
        className="pointer-events-none absolute z-20"
        style={{
          left: `calc(50% + ${WEAPON.crosshairOffsetX}px)`,
          top: `calc(50% + ${WEAPON.crosshairOffsetY}px)`,
          transform: 'translate(-50%, -50%)',
        }}
        aria-hidden
      >
        <div key={shotId} className="relative h-7 w-7" style={{ animation: shotId ? 'crossKick 0.09s ease-out' : undefined }}>
          <span className="absolute left-1/2 top-0 h-2.5 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
          <span className="absolute bottom-0 left-1/2 h-2.5 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
          <span className="absolute left-0 top-1/2 h-[2px] w-2.5 -translate-y-1/2 bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
          <span className="absolute right-0 top-1/2 h-[2px] w-2.5 -translate-y-1/2 bg-white shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6FE04A]" />
        </div>
      </div>
      {shotId > 0 && (
        <div
          key={`flash-${shotId}`}
          className="pointer-events-none absolute inset-0 z-10 bg-[#FFF6C8]/20"
          style={{ animation: 'shotVeil 0.1s ease-out forwards' }}
        />
      )}
      <style>{`
        @keyframes crossKick {
          0% { transform: scale(1.4); opacity: 0.65; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shotVeil {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
