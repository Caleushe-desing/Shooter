import { useEffect, useState } from 'react'

/** Soft prompt when the device is in portrait orientation. */
export function LandscapeGate() {
  const [portrait, setPortrait] = useState(false)

  useEffect(() => {
    const check = () => {
      const isPortrait =
        window.matchMedia('(orientation: portrait)').matches ||
        window.innerHeight > window.innerWidth
      setPortrait(isPortrait && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  if (!portrait) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#7EC8F5] px-6 text-center">
      <div className="sims-panel px-8 py-10">
        <div className="mx-auto mb-6 h-16 w-10 rounded-lg border-2 border-[#6FE04A] opacity-90" />
        <p className="pulse-glow text-lg font-extrabold tracking-[0.22em] text-[#6FE04A]">
          ROTATE DEVICE
        </p>
        <p className="mt-3 text-xs font-bold tracking-widest text-white/75">
          LANDSCAPE MODE REQUIRED
        </p>
      </div>
    </div>
  )
}
