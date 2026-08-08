import type { SyntheticEvent } from 'react'
import { CAMERA } from '../../constants'
import { useGameStore } from '../../store/gameStore'

/**
 * Fixed HUD zones (no overlap across camera modes):
 * - Top-left: vitals
 * - Top-right: camera + zoom (2D only)
 * - Center overlay: win / lose
 */
export function CombatHud() {
  const cameraMode = useGameStore((s) => s.cameraMode)
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode)
  const adjustTopZoom = useGameStore((s) => s.adjustTopZoom)
  const topCamHeight = useGameStore((s) => s.topCamHeight)
  const orbsRemaining = useGameStore((s) => s.orbsRemaining)
  const orbsTotal = useGameStore((s) => s.orbsTotal)
  const ammo = useGameStore((s) => s.ammo)
  const ammoMax = useGameStore((s) => s.ammoMax)
  const stamina = useGameStore((s) => s.stamina)
  const staminaRecovering = useGameStore((s) => s.staminaRecovering)
  const isSprinting = useGameStore((s) => s.isSprinting)
  const score = useGameStore((s) => s.score)
  const ghostCount = useGameStore((s) => s.ghostCount)
  const status = useGameStore((s) => s.status)
  const restartRun = useGameStore((s) => s.restartRun)
  const ammoLow = ammo <= 1
  const staminaPct = Math.round(stamina * 100)
  const staminaLow = stamina <= 0.25

  const camLabel =
    cameraMode === 'top' ? 'VISTA 2D' : cameraMode === 'first' ? '1ª PERSONA' : '3ª PERSONA'

  const zoomPct = Math.round(
    (1 -
      (topCamHeight - CAMERA.topHeightMin) /
        (CAMERA.topHeightMax - CAMERA.topHeightMin)) *
      100,
  )

  const stop = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      {/* TOP-LEFT — stats only */}
      <div className="pointer-events-none absolute left-3 top-3 z-50 flex max-w-[42vw] flex-col gap-1.5 sm:max-w-none">
        <div className="rounded bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/65">ORBES</div>
          <div className="text-lg font-bold tracking-wide text-[#F2E08A]">
            {orbsRemaining}
            <span className="ml-1 text-sm font-normal text-white/50">/ {orbsTotal}</span>
          </div>
        </div>
        <div className="rounded bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/65">
            MUNICIÓN
          </div>
          <div
            className={`text-lg font-bold tracking-wide ${
              ammoLow ? 'text-[#E24A3A]' : 'text-[#E8F0FF]'
            }`}
          >
            {ammo}
            <span className="ml-1 text-sm font-normal text-white/50">/ {ammoMax}</span>
          </div>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: ammoMax }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-2.5 rounded-sm ${
                  i < ammo ? 'bg-[#E8C86A]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="rounded bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-white/65">
              STAMINA
            </div>
            <div
              className={`text-[10px] font-semibold tracking-[0.08em] ${
                staminaRecovering
                  ? 'text-[#7EC8FF]'
                  : isSprinting
                    ? 'text-[#B8F080]'
                    : staminaLow
                      ? 'text-[#E24A3A]'
                      : 'text-white/55'
              }`}
            >
              {staminaRecovering ? 'RECUPERA' : isSprinting ? 'CORRIENDO' : `${staminaPct}%`}
            </div>
          </div>
          <div className="mt-1.5 h-2 w-36 overflow-hidden rounded-sm bg-white/15 sm:w-40">
            <div
              className={`h-full rounded-sm transition-[width] duration-75 ${
                staminaRecovering
                  ? 'bg-[#5AA8E8]'
                  : staminaLow
                    ? 'bg-[#E24A3A]'
                    : 'bg-[#8FD45A]'
              }`}
              style={{ width: `${staminaPct}%` }}
            />
          </div>
        </div>
        <div className="rounded bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/65">
            SOLDADOS
          </div>
          <div className="text-lg font-bold tracking-wide text-[#C9B6FF]">{ghostCount}</div>
        </div>
        <div className="rounded bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[10px] font-semibold tracking-[0.14em] text-white/65">
            MISIÓN
          </div>
          <div className="text-[11px] font-semibold tracking-[0.06em] text-[#F2E08A]">
            Rescatar a la prisionera
          </div>
        </div>
        <div className="rounded bg-black/45 px-2.5 py-1 text-[11px] tracking-[0.12em] text-white/80 backdrop-blur-sm">
          PUNTOS <span className="font-semibold text-[#F2E08A]">{score}</span>
        </div>
        <div className="rounded bg-black/40 px-2.5 py-1 text-[10px] tracking-[0.12em] text-white/60 backdrop-blur-sm">
          {status === 'playing' && 'EN CURSO'}
          {status === 'won' && 'VICTORIA'}
          {status === 'lost' && 'DERROTA'}
        </div>
      </div>

      {/* TOP-RIGHT — only buttons capture input (wrapper never blocks look). */}
      <div className="pointer-events-none absolute right-3 top-3 z-50 flex flex-col items-end gap-2">
        <button
          type="button"
          className="pointer-events-auto rounded border border-white/40 bg-black/50 px-3 py-2 text-[11px] font-bold tracking-[0.14em] text-white/90 shadow-md backdrop-blur-sm hover:border-[#E8C86A]/80 hover:text-[#F2E08A] active:scale-95"
          onClick={(e) => {
            stop(e)
            toggleCameraMode()
          }}
          onPointerDown={stop}
        >
          {camLabel}
          <span className="mt-0.5 block text-[9px] font-normal tracking-[0.08em] text-white/55">
            TOCÁ · V
          </span>
        </button>

        {cameraMode === 'top' && (
          <div
            className="pointer-events-auto flex items-center gap-1 rounded border border-white/30 bg-black/50 p-1 backdrop-blur-sm"
            onPointerDown={stop}
          >
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded text-lg font-bold text-white/90 hover:bg-white/10 active:scale-95"
              aria-label="Acercar"
              onClick={(e) => {
                stop(e)
                adjustTopZoom(-CAMERA.topZoomStep)
              }}
              onPointerDown={stop}
            >
              +
            </button>
            <div className="min-w-[3.2rem] text-center text-[10px] tracking-[0.1em] text-white/70">
              ZOOM
              <div className="text-[11px] font-semibold text-[#F2E08A]">{zoomPct}%</div>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded text-lg font-bold text-white/90 hover:bg-white/10 active:scale-95"
              aria-label="Alejar"
              onClick={(e) => {
                stop(e)
                adjustTopZoom(CAMERA.topZoomStep)
              }}
              onPointerDown={stop}
            >
              −
            </button>
          </div>
        )}
      </div>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#101418]/72 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div
              className={`text-3xl font-semibold tracking-[0.16em] ${
                status === 'won' ? 'text-[#F2E08A]' : 'text-[#F2C6C0]'
              }`}
            >
              {status === 'won' ? '¡MISIÓN CUMPLIDA!' : 'GAME OVER'}
            </div>
            <div className="text-sm tracking-[0.08em] text-white/75">
              {status === 'won'
                ? 'Rescataste a la prisionera de la celda.'
                : 'Un soldado enemigo te atrapó.'}
            </div>
            <div className="text-sm tracking-[0.08em] text-white/70">
              Puntos: <span className="text-[#F2E08A]">{score}</span>
            </div>
            <button
              type="button"
              className="pointer-events-auto rounded border border-[#E8C86A]/80 bg-[#3A2A10]/90 px-5 py-2.5 text-sm font-bold tracking-[0.16em] text-[#F2E08A] shadow-md hover:bg-[#E8C86A] hover:text-[#1A1408]"
              onClick={() => restartRun()}
            >
              REINTENTAR
            </button>
          </div>
        </div>
      )}
    </>
  )
}
