import { useCallback, useRef, useState } from 'react'
import { PLAYER } from '../../constants'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useGameStore } from '../../store/gameStore'

/** Push stick this far forward (0–1) to lock sprint. */
const SPRINT_ENGAGE = 0.82
/** Keep sprint while still this far forward (hysteresis). */
const SPRINT_HOLD = 0.45
/** Stick must also be near the rim to engage run. */
const SPRINT_RIM = 0.88

/**
 * Android / tablet overlay:
 * - Left: virtual joystick (move). Push fully forward to lock run.
 * - Right half: drag to look
 * Desktop uses WASD + mouse in PlayerController; this component stays hidden.
 */
export function MobileControls() {
  const mobile = useIsMobile()
  if (!mobile) return null

  return (
    <div className="absolute inset-0 z-30">
      <Joystick />
      <LookZone />
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/35 px-2 py-1 text-[9px] tracking-[0.14em] text-white/75">
        JOYSTICK · ARRIBA A TOPE = CORRER
      </div>
    </div>
  )
}

function Joystick() {
  const setMove = useGameStore((s) => s.setMove)
  const setSprint = useGameStore((s) => s.setSprint)
  const sprint = useGameStore((s) => s.input.sprint)
  const baseRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef(false)
  const pointerId = useRef<number | null>(null)
  const sprintLocked = useRef(false)
  const radius = 52

  const applySprint = useCallback(
    (nx: number, ny: number) => {
      // ny < 0 = forward on screen / in game.
      const forward = -ny
      const mag = Math.hypot(nx, ny)

      if (!sprintLocked.current) {
        if (mag >= SPRINT_RIM && forward >= SPRINT_ENGAGE) {
          sprintLocked.current = true
          setSprint(true)
        } else {
          setSprint(false)
        }
      } else if (mag < 0.12 || forward < SPRINT_HOLD) {
        // Released or pulled back / sideways — unlock run.
        sprintLocked.current = false
        setSprint(false)
      } else {
        setSprint(true)
      }
    },
    [setSprint],
  )

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
      const nx = dx / radius
      const ny = dy / radius
      // Screen up → negative Y → forward (same as keyboard W = moveZ -1).
      setMove(nx, ny)
      applySprint(nx, ny)
    },
    [applySprint, setMove],
  )

  const reset = useCallback(() => {
    active.current = false
    pointerId.current = null
    sprintLocked.current = false
    setKnob({ x: 0, y: 0 })
    setMove(0, 0)
    setSprint(false)
  }, [setMove, setSprint])

  return (
    <div
      ref={baseRef}
      className="absolute bottom-6 left-6 h-32 w-32 touch-none sm:bottom-8 sm:left-8"
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
      <div
        className={`absolute inset-0 rounded-full border backdrop-blur-sm ${
          sprint
            ? 'border-[#6FE04A]/70 bg-[#6FE04A]/20'
            : 'border-white/30 bg-[#1A2430]/40'
        }`}
      />
      {/* Forward sprint zone hint */}
      <div className="pointer-events-none absolute top-1 left-1/2 h-3 w-8 -translate-x-1/2 rounded-full bg-[#6FE04A]/35" />
      <div
        className={`absolute inset-3 rounded-full border ${
          sprint ? 'border-[#6FE04A]/60' : 'border-[#6FE04A]/35'
        }`}
      />
      <div
        className={`absolute h-12 w-12 rounded-full border-2 shadow-md ${
          sprint
            ? 'border-white bg-[#6FE04A]'
            : 'border-white/80 bg-[#6FE04A]/85'
        }`}
        style={{
          left: `calc(50% + ${knob.x}px)`,
          top: `calc(50% + ${knob.y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      {sprint && (
        <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.16em] text-[#d8ffc8]">
          CORRER
        </div>
      )}
    </div>
  )
}

function LookZone() {
  const addLook = useGameStore((s) => s.addLook)
  const active = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const pointerId = useRef<number | null>(null)

  const end = () => {
    active.current = false
    pointerId.current = null
  }

  return (
    <div
      className="absolute bottom-0 right-0 top-0 w-1/2 touch-none"
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        active.current = true
        pointerId.current = e.pointerId
        last.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        if (!active.current || pointerId.current !== e.pointerId) return
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        addLook(dx * PLAYER.lookSensitivityMobile, dy * PLAYER.lookSensitivityMobile)
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    />
  )
}
