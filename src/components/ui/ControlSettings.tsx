import { useEffect } from 'react'
import { SETTINGS_RANGE, useSettingsStore } from '../../store/settings'
import { useGameStore } from '../../store/gameStore'

/** Gear button + panel to tune movement and look stick speed. */
export function ControlSettings() {
  const open = useSettingsStore((s) => s.open)
  const setOpen = useSettingsStore((s) => s.setOpen)
  const moveSpeed = useSettingsStore((s) => s.moveSpeed)
  const lookSpeed = useSettingsStore((s) => s.lookSpeed)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const setMoveSpeed = useSettingsStore((s) => s.setMoveSpeed)
  const setLookSpeed = useSettingsStore((s) => s.setLookSpeed)
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume)
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)
  const reset = useSettingsStore((s) => s.reset)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      if (useSettingsStore.getState().open) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  return (
    <>
      <button
        type="button"
        aria-label="Control settings"
        onClick={() => {
          // Free the cursor so the sliders are usable on desktop.
          if (document.pointerLockElement) document.exitPointerLock()
          useGameStore.getState().setScoped(false)
          setOpen(true)
        }}
        className="absolute left-1/2 top-3 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-[#1A2430]/70 px-4 py-1.5 text-[9px] font-bold tracking-[0.28em] text-[#6FE04A] shadow-md backdrop-blur-md transition hover:bg-[#1A2430]/90 active:scale-[0.98] sm:top-4 sm:text-[10px]"
      >
        CONTROLS
      </button>

      {open && (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#4BA3E3]/35 px-4 py-6 backdrop-blur-sm">
          <div className="sector-panel sims-panel w-full max-w-sm px-6 py-6">
            <div className="text-center text-lg font-extrabold tracking-[0.22em] text-[#6FE04A]">
              CONTROLS
            </div>

            <SpeedSlider
              label="MOVE STICK"
              hint="Joystick / WASD"
              value={moveSpeed}
              onChange={setMoveSpeed}
            />
            <SpeedSlider
              label="LOOK STICK"
              hint="Drag zone / mouse"
              value={lookSpeed}
              onChange={setLookSpeed}
            />
            <SpeedSlider
              label="MUSIC"
              hint="Ambient soundtrack"
              value={musicVolume}
              onChange={setMusicVolume}
              min={0}
              max={1}
              step={0.05}
              format="percent"
            />
            <SpeedSlider
              label="SFX"
              hint="Gunshots and impacts"
              value={sfxVolume}
              onChange={setSfxVolume}
              min={0}
              max={1}
              step={0.05}
              format="percent"
            />

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-full border border-white/25 px-3 py-2.5 text-xs font-bold tracking-[0.22em] text-white/80 transition hover:bg-white/10 active:scale-[0.98]"
              >
                RESET
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-[#6FE04A]/70 bg-[#6FE04A] px-3 py-2.5 text-xs font-bold tracking-[0.22em] text-[#1A2430] transition hover:bg-[#7EF05A] active:scale-[0.98]"
              >
                RESUME
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SpeedSlider({
  label,
  hint,
  value,
  onChange,
  min = SETTINGS_RANGE.min,
  max = SETTINGS_RANGE.max,
  step = SETTINGS_RANGE.step,
  format = 'multiplier',
}: {
  label: string
  hint: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  format?: 'multiplier' | 'percent'
}) {
  const display =
    format === 'percent' ? `${Math.round(value * 100)}%` : `${value.toFixed(2)}x`

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold tracking-[0.26em] text-white/85">{label}</span>
        <span className="text-sm font-extrabold tracking-widest text-[#6FE04A]">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="stick-slider mt-2 w-full"
      />
      <div className="mt-1 text-[9px] tracking-[0.22em] text-white/45">{hint}</div>
    </div>
  )
}
