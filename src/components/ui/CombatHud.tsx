import { useGameStore } from '../../store/gameStore'

/** Camera mode toggle (combat vitals removed while focusing on the map). */
export function CombatHud() {
  const cameraMode = useGameStore((s) => s.cameraMode)
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode)
  const isFirst = cameraMode === 'first'

  return (
    <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
      <button
        type="button"
        className="pointer-events-auto rounded border border-white/40 bg-black/50 px-3 py-2 text-[11px] font-bold tracking-[0.14em] text-white/90 shadow-md backdrop-blur-sm hover:border-[#E8C86A]/80 hover:text-[#F2E08A] active:scale-95"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleCameraMode()
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
      >
        {isFirst ? '1ª PERSONA' : '3ª PERSONA'}
        <span className="mt-0.5 block text-[9px] font-normal tracking-[0.08em] text-white/55">
          TOCÁ · V
        </span>
      </button>
    </div>
  )
}
