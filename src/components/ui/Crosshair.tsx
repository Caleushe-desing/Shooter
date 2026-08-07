import { WEAPON } from '../../constants'

/** Off-center TPS reticle (over-the-shoulder). */
export function Crosshair() {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: `calc(50% + ${WEAPON.crosshairOffsetX}px)`,
        top: `calc(50% + ${WEAPON.crosshairOffsetY}px)`,
        transform: 'translate(-50%, -50%)',
      }}
      aria-hidden
    >
      <div className="relative h-7 w-7">
        <span className="absolute left-1/2 top-0 h-2 w-[2px] -translate-x-1/2 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
        <span className="absolute bottom-0 left-1/2 h-2 w-[2px] -translate-x-1/2 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
        <span className="absolute left-0 top-1/2 h-[2px] w-2 -translate-y-1/2 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
        <span className="absolute right-0 top-1/2 h-[2px] w-2 -translate-y-1/2 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
        <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6FE04A]" />
      </div>
    </div>
  )
}
