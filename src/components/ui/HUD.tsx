import { PLAYER } from '../../constants'
import { useGameStore } from '../../store/gameStore'
import { useWorldStore } from '../../store/worldStore'
import { useEffect, useState } from 'react'
import { getPlayerPosition } from '../../store/enemyRuntime'

function NeedBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  const critical = value <= 25
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-0.5 flex justify-between text-[9px] font-bold tracking-[0.14em] text-white/65">
        <span>{label}</span>
        <span className={critical ? 'text-[#FF7A59]' : 'text-white/70'}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/15 bg-black/35">
        <div
          className="h-full rounded-full transition-[width] duration-150"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  )
}

/** Colonist HUD: needs, biome, scan status. */
export function HUD() {
  const health = useGameStore((s) => s.health)
  const hunger = useGameStore((s) => s.hunger)
  const thirst = useGameStore((s) => s.thirst)
  const hygiene = useGameStore((s) => s.hygiene)
  const scanActive = useWorldStore((s) => s.scanActive)
  const biomeLabelAt = useWorldStore((s) => s.biomeLabelAt)
  const buildings = useWorldStore((s) => s.buildings)
  const [biome, setBiome] = useState('Pradera')

  const healthPct = Math.max(0, Math.round((health / PLAYER.maxHealth) * 100))
  const critical = healthPct <= 30

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = getPlayerPosition()
      setBiome(biomeLabelAt(p.x, p.z))
    }, 400)
    return () => window.clearInterval(id)
  }, [biomeLabelAt])

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="sims-panel select-none px-4 py-2.5">
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/60 sm:text-xs">
            SIMULADOR COLONO
          </div>
          <div className="text-lg font-extrabold tracking-wide text-[#6FE04A] sm:text-xl">
            {biome}
          </div>
        </div>

        <div className="sims-panel select-none px-4 py-2.5 text-right">
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/60 sm:text-xs">
            ASENTAMIENTO
          </div>
          <div className="text-lg font-extrabold tracking-wide text-white sm:text-xl">
            {buildings.length}{' '}
            <span className="text-white/50">obras</span>
            {scanActive && <span className="ml-2 text-[#6FE04A]">ESCÁNER</span>}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-14 left-1/2 z-30 w-[min(92vw,28rem)] -translate-x-1/2 select-none sm:bottom-10">
        <div className="sims-panel space-y-2 px-3 py-2">
          <div className="flex items-end justify-between text-[9px] font-bold tracking-[0.18em] text-white/65">
            <span>VITALIDAD</span>
            <span className={critical ? 'text-[#FF7A59]' : 'text-[#6FE04A]'}>{healthPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-white/20 bg-black/35">
            <div
              className={`h-full rounded-full transition-[width] duration-150 ${
                critical ? 'bg-[#FF7A59]' : 'bg-[#6FE04A]'
              }`}
              style={{ width: `${healthPct}%` }}
            />
          </div>
          <div className="flex gap-2">
            <NeedBar label="HAMBRE" value={hunger} color="#E8A050" />
            <NeedBar label="SED" value={thirst} color="#4AA8E8" />
            <NeedBar label="HIGIENE" value={hygiene} color="#B8E0C8" />
          </div>
        </div>
      </div>
    </>
  )
}
