import { useCallback, useRef, useState } from 'react'
import { PLAYER } from '../../constants'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useGameStore } from '../../store/gameStore'
import { unlockAudio } from '../../audio/gunshot'

/**
 * Android / tablet overlay:
 * - Left: virtual joystick (move)
 * - Right half: tap anywhere to fire + drag to look; SALTAR / CORRER buttons
 * Desktop uses WASD + Shift + Space + click in PlayerController; this stays hidden.
 */
export function MobileControls() {
  const mobile = useIsMobile()
  if (!mobile) return null

  return (
    <div className="absolute inset-0 z-30">
      <Joystick />
      <RightLookAndFire />
      <RightHandButtons />
    </div>
  )
}

function Joystick() {
  const setMove = useGameStore((s) => s.setMove)
  const baseRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef(false)
  const pointerId = useRef<number | null>(null)
  const radius = 52

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
      // Screen up → negative Y → forward (same as keyboard W = moveZ -1).
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
      className="absolute bottom-6 left-6 z-40 h-32 w-32 touch-none sm:bottom-8 sm:left-8"
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
      onLostPointerCapture={reset}
    >
      <div className="absolute inset-0 rounded-full border border-white/30 bg-[#1A2430]/40 backdrop-blur-sm" />
      <div className="absolute inset-3 rounded-full border border-[#6FE04A]/35" />
      <div
        className="absolute h-12 w-12 rounded-full border-2 border-white/80 bg-[#6FE04A]/85 shadow-md"
        style={{
          left: `calc(50% + ${knob.x}px)`,
          top: `calc(50% + ${knob.y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}

/** Jump + sprint only — fire is the whole right half. */
function RightHandButtons() {
  const sprint = useGameStore((s) => s.input.sprint)
  const toggleSprint = useGameStore((s) => s.toggleSprint)
  const requestJump = useGameStore((s) => s.requestJump)

  return (
    <div className="absolute bottom-6 right-6 z-40 flex touch-none flex-col items-center gap-3 sm:bottom-8 sm:right-8">
      <button
        type="button"
        className="flex h-14 w-14 select-none items-center justify-center rounded-full border-2 border-white/50 bg-[#1A2430]/55 text-[10px] font-bold tracking-[0.12em] text-white/90 shadow-md backdrop-blur-sm active:scale-95 active:border-white active:bg-[#6FE04A] active:text-[#143018]"
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          requestJump()
        }}
      >
        SALTAR
      </button>
      <button
        type="button"
        className={`flex h-16 w-16 select-none items-center justify-center rounded-full border-2 text-[11px] font-bold tracking-[0.14em] shadow-md ${
          sprint
            ? 'border-white bg-[#6FE04A] text-[#143018]'
            : 'border-white/50 bg-[#1A2430]/55 text-white/90 backdrop-blur-sm'
        }`}
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleSprint()
        }}
      >
        CORRER
      </button>
    </div>
  )
}

/**
 * Entire right half of the screen:
 * - tap / press → fire
 * - hold finger offset from press → keep looking that way (no lift needed)
 * - also reacts to drag deltas for snappy corrections
 * SALTAR / CORRER sit above this and stopPropagation so they don't shoot.
 */
function RightLookAndFire() {
  const addLook = useGameStore((s) => s.addLook)
  const requestFire = useGameStore((s) => s.requestFire)
  const active = useRef(false)
  const origin = useRef({ x: 0, y: 0 })
  const finger = useRef({ x: 0, y: 0 })
  const last = useRef({ x: 0, y: 0 })
  const pointerId = useRef<number | null>(null)
  const raf = useRef(0)

  const stopLoop = () => {
    if (raf.current) {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }

  const end = () => {
    active.current = false
    pointerId.current = null
    stopLoop()
  }

  const tick = useCallback(
    (prevTime: number) => {
      if (!active.current) {
        raf.current = 0
        return
      }
      const now = performance.now()
      const dt = Math.min(0.05, (now - prevTime) / 1000)

      // Continuous look from finger offset vs press point (hold to keep turning).
      let ox = finger.current.x - origin.current.x
      let oy = finger.current.y - origin.current.y
      const dist = Math.hypot(ox, oy)
      if (dist > PLAYER.lookStickDeadzone) {
        const scale = Math.min(1, (dist - PLAYER.lookStickDeadzone) / PLAYER.lookStickMax)
        const nx = ox / dist
        const ny = oy / dist
        const rate = PLAYER.lookStickRate * scale
        addLook(nx * rate * dt * 60, ny * rate * dt * 60)
      }

      raf.current = requestAnimationFrame(() => tick(now))
    },
    [addLook],
  )

  return (
    <div
      className="absolute bottom-0 right-0 top-0 z-30 w-1/2 touch-none"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        active.current = true
        pointerId.current = e.pointerId
        origin.current = { x: e.clientX, y: e.clientY }
        finger.current = { x: e.clientX, y: e.clientY }
        last.current = { x: e.clientX, y: e.clientY }
        unlockAudio()
        requestFire()
        stopLoop()
        raf.current = requestAnimationFrame(() => tick(performance.now()))
      }}
      onPointerMove={(e) => {
        if (!active.current || pointerId.current !== e.pointerId) return
        // Extra snappy response to movement while also feeding the hold-stick.
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        finger.current = { x: e.clientX, y: e.clientY }
        addLook(dx * PLAYER.lookSensitivityMobile, dy * PLAYER.lookSensitivityMobile)
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    />
  )
}
