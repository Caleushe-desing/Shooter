import { useCallback, useEffect, useState } from 'react'
import { useWorldStore } from '../../store/worldStore'

function isFullscreen() {
  return Boolean(document.fullscreenElement)
}

async function enterFullscreen() {
  const el = document.documentElement
  if (el.requestFullscreen) await el.requestFullscreen()
  const webkit = el as HTMLElement & { webkitRequestFullscreen?: () => void }
  if (!document.fullscreenElement && webkit.webkitRequestFullscreen) {
    webkit.webkitRequestFullscreen()
  }
}

async function exitFullscreen() {
  if (document.exitFullscreen && document.fullscreenElement) {
    await document.exitFullscreen()
  }
}

/** Browser fullscreen toggle — game + inventory fill the whole screen. */
export function FullscreenButton() {
  const [active, setActive] = useState(false)
  const inventoryOpen = useWorldStore((s) => s.inventoryOpen)

  useEffect(() => {
    const sync = () => setActive(isFullscreen())
    sync()
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (isFullscreen()) await exitFullscreen()
      else await enterFullscreen()
    } catch {
      // User gesture / browser policy may block; ignore.
    }
  }, [])

  if (inventoryOpen) return null

  return (
    <button
      type="button"
      onClick={toggle}
      className="pointer-events-auto absolute top-3 right-3 z-30 rounded-md border border-white/20 bg-black/60 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur-sm sm:top-4 sm:right-4"
      aria-pressed={active}
    >
      {active ? 'Salir pantalla' : 'Pantalla completa'}
    </button>
  )
}
