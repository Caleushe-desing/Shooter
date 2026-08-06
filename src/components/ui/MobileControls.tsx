import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { PLAYER } from '../../constants'

/**
 * Mobile controls:
 * - Left: virtual joystick for movement
 * - Right half: drag to look; tap/touch fires the weapon
 * Desktop: controls are handled in PlayerController (WASD + pointer lock).
 */
export function MobileControls() {
  const [isTouch, setIsTouch] = useState(false)
  const setMove = useGameStore((s) => s.setMove)
  const addLook = useGameStore((s) => s.addLook)
  const queueFire = useGameStore((s) => s.queueFire)
  const sectorCleared = useGameStore((s) => s.sectorCleared)

  useEffect(() => {
    const touch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    setIsTouch(touch)
  }, [])

  if (!isTouch || sectorCleared) return null

  return (
    <div className="absolute inset-0 z-30">
      <Joystick setMove={setMove} />
      <LookAndFireZone addLook={addLook} onFire={queueFire} />
      <div className="pointer-events-none absolute bottom-3 right-4 text-[9px] tracking-[0.25em] text-[#00BFFF]/70">
        TAP TO FIRE · DRAG TO LOOK
      </div>
    </div>
  )
}

function Joystick({ setMove }: { setMove: (x: number, z: number) => void }) {
  const baseRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef(false)
  const pointerId = useRef<number | null>(null)
  const radius = 48

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      let dx = clientX - cx
      let dy = clientY - cy
      const len = Math.hypot(dx, dy)
      if (len > radius) {
        dx = (dx / len) * radius
        dy = (dy / len) * radius
      }
      setKnob({ x: dx, y: dy })
      setMove(dx / radius, dy / radius)
    },
    [setMove],
  )

  const reset = useCallback(() => {
    active.current = false
    pointerId.current = null
    setKnob({ x: 0, y: 0 })
    setMove(0, 0)
  }, [setMove])

  return (
    <div
      ref={baseRef}
      className="absolute bottom-6 left-6 h-28 w-28 touch-none sm:bottom-8 sm:left-8"
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        active.current = true
        pointerId.current = e.pointerId
        updateFromEvent(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (!active.current || pointerId.current !== e.pointerId) return
        updateFromEvent(e.clientX, e.clientY)
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
    >
      <div className="absolute inset-0 rounded-full border border-[#00FF00]/50 bg-[#00FF00]/5" />
      <div className="absolute inset-3 rounded-full border border-[#00FF00]/25" />
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00FF00] bg-[#00FF00]/20"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  )
}

function LookAndFireZone({
  addLook,
  onFire,
}: {
  addLook: (dx: number, dy: number) => void
  onFire: () => void
}) {
  const active = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const pointerId = useRef<number | null>(null)

  return (
    <div
      className="absolute bottom-0 right-0 top-0 w-1/2 touch-none"
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        active.current = true
        pointerId.current = e.pointerId
        last.current = { x: e.clientX, y: e.clientY }
        // Tap / touch on the look zone fires immediately
        onFire()
      }}
      onPointerMove={(e) => {
        if (!active.current || pointerId.current !== e.pointerId) return
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        addLook(dx * PLAYER.lookSensitivityMobile, dy * PLAYER.lookSensitivityMobile)
      }}
      onPointerUp={() => {
        active.current = false
        pointerId.current = null
      }}
      onPointerCancel={() => {
        active.current = false
        pointerId.current = null
      }}
    />
  )
}
