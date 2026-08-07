import { WEAPON } from '../../constants'
import { useGameStore } from '../../store/gameStore'

/** Aim point — centered in FPS / top-down, off-center in TPS. */
export function Crosshair() {
  const shotId = useGameStore((s) => s.shotId)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const centered = cameraMode === 'first' || cameraMode === 'top'
  const ox = centered ? 0 : WEAPON.crosshairOffsetX
  const oy = centered ? 0 : WEAPON.crosshairOffsetY

  return (
    <>
      <div
        className="pointer-events-none absolute z-20"
        style={{
          left: `calc(50% + ${ox}px)`,
          top: `calc(50% + ${oy}px)`,
          transform: 'translate(-50%, -50%)',
        }}
        aria-hidden
      >
        <span
          key={shotId}
          className="block h-[3px] w-[3px] rounded-full bg-white"
          style={{
            boxShadow: '0 0 0 1px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.45)',
            animation: shotId ? 'crossKick 0.06s ease-out' : undefined,
          }}
        />
      </div>
      {shotId > 0 && (
        <div
          key={`flash-${shotId}`}
          className="pointer-events-none absolute inset-0 z-10 bg-[#FFF6C8]/10"
          style={{ animation: 'shotVeil 0.07s ease-out forwards' }}
        />
      )}
      <style>{`
        @keyframes crossKick {
          0% { transform: scale(2.2); opacity: 0.45; }
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
