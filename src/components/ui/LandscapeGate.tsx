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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black px-6 text-center">
      <div>
        <div className="mx-auto mb-6 h-16 w-10 border-2 border-[#00FF00] opacity-80" />
        <p className="pulse-glow text-lg tracking-[0.25em] text-[#00FF00]">ROTATE DEVICE</p>
        <p className="mt-3 text-xs tracking-widest text-white/70">
          LANDSCAPE MODE REQUIRED
        </p>
      </div>
    </div>
  )
}
