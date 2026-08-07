import { CAMERA } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { useWorldStore } from '../../store/worldStore'

/**
 * Hip-fire reticle — off-center OTS (character left, mira right).
 * Hitscan uses the same NDC. Hidden while scoped / map / inventory.
 */
export function Crosshair() {
  const scoped = useGameStore((s) => s.scoped)
  const inventoryOpen = useWorldStore((s) => s.inventoryOpen)
  const mapOpen = useWorldStore((s) => s.mapOpen)
  if (scoped || inventoryOpen || mapOpen) return null

  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${CAMERA.aimLeftPct}%`, top: `${CAMERA.aimTopPct}%` }}
    >
      <div className="relative h-7 w-7">
        <div className="absolute left-1/2 top-0 h-2.5 w-px -translate-x-1/2 bg-[#6FE04A]" />
        <div className="absolute bottom-0 left-1/2 h-2.5 w-px -translate-x-1/2 bg-[#6FE04A]" />
        <div className="absolute left-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-[#6FE04A]" />
        <div className="absolute right-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-[#6FE04A]" />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF7A59]" />
      </div>
    </div>
  )
}
