import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settings'
import { useWorldStore } from '../../store/worldStore'
import { PLAYER, TOUCH_FIRE } from '../../constants'

/**
 * Mobile controls:
 * - Left: virtual joystick for movement
 * - Right half: drag to look; hard finger pressure fires (light drag does not)
 * Desktop: controls are handled in PlayerController (WASD + pointer lock).
 */
export function MobileControls() {
  const [isTouch, setIsTouch] = useState(false)
  const setMove = useGameStore((s) => s.setMove)
  const addLook = useGameStore((s) => s.addLook)
  const queueFire = useGameStore((s) => s.queueFire)
  const caught = useGameStore((s) => s.caught)
  const settingsOpen = useSettingsStore((s) => s.open)
  const mapOpen = useWorldStore((s) => s.mapOpen)
  const inventoryOpen = useWorldStore((s) => s.inventoryOpen)

  useEffect(() => {
    const touch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    setIsTouch(touch)
  }, [])

  if (!isTouch || caught || settingsOpen || mapOpen || inventoryOpen) return null

  return (
    <div className="absolute inset-0 z-30">
      <Joystick setMove={setMove} />
      <LocomotionPad />
      <LookAndFireZone addLook={addLook} onFire={queueFire} />
      <div className="pointer-events-none absolute bottom-3 right-4 rounded-full bg-black/25 px-3 py-1 text-[9px] font-bold tracking-[0.22em] text-white/75">
        PRESS HARD TO FIRE · DRAG TO LOOK
      </div>
    </div>
  )
}

function LocomotionPad() {
  const stance = useGameStore((s) => s.stance)
  const sprint = useGameStore((s) => s.input.sprint)
  const slow = useGameStore((s) => s.input.slow)
  const setSprint = useGameStore((s) => s.setSprint)
  const setSlow = useGameStore((s) => s.setSlow)
  const toggleCrouch = useGameStore((s) => s.toggleCrouch)
  const toggleProne = useGameStore((s) => s.toggleProne)
  const queueJump = useGameStore((s) => s.queueJump)

  const btn =
    'pointer-events-auto min-h-11 min-w-11 rounded-md border border-white/25 bg-black/55 px-2 text-[10px] font-bold uppercase tracking-wider text-white active:bg-[#6FE04A]/35'
  const on = 'border-[#6FE04A]/70 bg-[#6FE04A]/25 text-[#d8ffc8]'

  return (
    <div className="absolute bottom-36 left-3 z-40 flex flex-col gap-2 sm:bottom-40 sm:left-8">
      <div className="flex gap-2">
        <button
          type="button"
          className={`${btn} ${sprint ? on : ''}`}
          onPointerDown={(e) => {
            e.preventDefault()
            setSprint(true)
          }}
          onPointerUp={() => setSprint(false)}
          onPointerCancel={() => setSprint(false)}
          onPointerLeave={() => setSprint(false)}
        >
          Correr
        </button>
        <button
          type="button"
          className={`${btn} ${slow ? on : ''}`}
          onPointerDown={(e) => {
            e.preventDefault()
            setSlow(true)
          }}
          onPointerUp={() => setSlow(false)}
          onPointerCancel={() => setSlow(false)}
          onPointerLeave={() => setSlow(false)}
        >
          Lento
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${btn} ${stance === 'crouch' ? on : ''}`}
          onClick={(e) => {
            e.preventDefault()
            toggleCrouch()
          }}
        >
          Agachar
        </button>
        <button
          type="button"
          className={`${btn} ${stance === 'prone' ? on : ''}`}
          onClick={(e) => {
            e.preventDefault()
            toggleProne()
          }}
        >
          Acostar
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={(e) => {
            e.preventDefault()
            queueJump()
          }}
        >
          Saltar
        </button>
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
      onLostPointerCapture={reset}
    >
      <div className="absolute inset-0 rounded-full border border-white/30 bg-[#1A2430]/35 backdrop-blur-sm" />
      <div className="absolute inset-3 rounded-full border border-[#6FE04A]/35" />
      {/*
        Position with left/top only — do NOT mix Tailwind translate-* utilities with
        inline transform. Tailwind v4 uses the separate `translate` CSS property, so
        both would apply and park the knob up-left at rest.
      */}
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

function readTouchForce(e: TouchEvent, id: number | null): number | null {
  for (let i = 0; i < e.touches.length; i++) {
    const t = e.touches.item(i)
    if (!t) continue
    // Touch.identifier aligns with pointerId on most mobile browsers.
    if (id != null && t.identifier !== id) continue
    if (typeof t.force === 'number') return t.force
  }
  const t0 = e.touches.item(0)
  if (t0 && typeof t0.force === 'number') return t0.force
  return null
}

/** True when the sample looks like a real analog force reading (not 0 / 0.5 / 1 stubs). */
function isAnalogPressure(pressure: number) {
  return pressure > 0.02 && pressure < 0.98 && Math.abs(pressure - 0.5) > 0.02
}

/**
 * Right-half look pad:
 * - Light drag → look only
 * - Harder press (analog PointerEvent.pressure / Touch.force) → fire
 * - Devices without force sensors: short stationary tap still fires
 */
function LookAndFireZone({
  addLook,
  onFire,
}: {
  addLook: (dx: number, dy: number) => void
  onFire: () => void
}) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const active = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const pointerId = useRef<number | null>(null)
  const baselinePressure = useRef(0)
  const hasAnalogPressure = useRef(false)
  const firedThisPress = useRef(false)
  const dragDistance = useRef(0)
  const startedAt = useRef(0)
  const lastFireAt = useRef(0)

  const tryFireFromPressure = useCallback(
    (pressure: number) => {
      if (!active.current) return
      if (isAnalogPressure(pressure)) hasAnalogPressure.current = true
      // Binary 0/1 stubs (common on Android) must not fire while looking.
      if (!hasAnalogPressure.current) return

      const hardEnough =
        pressure >= TOUCH_FIRE.pressureThreshold &&
        pressure >= baselinePressure.current + TOUCH_FIRE.pressureDelta

      if (!hardEnough) return

      const now = performance.now()
      // Sustained hard-press can re-fire around the weapon cooldown.
      if (firedThisPress.current && now - lastFireAt.current < 160) return
      firedThisPress.current = true
      lastFireAt.current = now
      onFire()
    },
    [onFire],
  )

  const endGesture = useCallback(() => {
    if (!active.current) return

    // Fallback when the device has no real force sensor: short firm tap only.
    // Dragging to look never counts as a tap.
    if (
      !firedThisPress.current &&
      !hasAnalogPressure.current &&
      dragDistance.current < TOUCH_FIRE.dragCancelPx &&
      performance.now() - startedAt.current <= TOUCH_FIRE.tapMaxMs
    ) {
      onFire()
    }

    active.current = false
    pointerId.current = null
    firedThisPress.current = false
    hasAnalogPressure.current = false
    dragDistance.current = 0
  }, [onFire])

  useEffect(() => {
    const el = zoneRef.current
    if (!el) return

    const onTouchForce = (e: TouchEvent) => {
      if (!active.current) return
      const force = readTouchForce(e, pointerId.current)
      if (force != null) tryFireFromPressure(force)
    }

    // iOS reports continuous force here more reliably than pointermove.
    el.addEventListener('touchforcechange', onTouchForce as EventListener, { passive: true })
    el.addEventListener('touchmove', onTouchForce, { passive: true })
    return () => {
      el.removeEventListener('touchforcechange', onTouchForce as EventListener)
      el.removeEventListener('touchmove', onTouchForce)
    }
  }, [tryFireFromPressure])

  return (
    <div
      ref={zoneRef}
      className="absolute bottom-0 right-0 top-0 w-1/2 touch-none"
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        active.current = true
        pointerId.current = e.pointerId
        last.current = { x: e.clientX, y: e.clientY }
        startedAt.current = performance.now()
        dragDistance.current = 0
        firedThisPress.current = false
        hasAnalogPressure.current = isAnalogPressure(e.pressure)
        baselinePressure.current = e.pressure > 0 ? e.pressure : 0.08
        // Never fire on contact — light touch is only for looking.
      }}
      onPointerMove={(e) => {
        if (!active.current || pointerId.current !== e.pointerId) return
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        dragDistance.current += Math.hypot(dx, dy)
        const sensitivity =
          PLAYER.lookSensitivityMobile * useSettingsStore.getState().lookSpeed
        addLook(dx * sensitivity, dy * sensitivity)
        tryFireFromPressure(e.pressure)
      }}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onLostPointerCapture={endGesture}
    />
  )
}
