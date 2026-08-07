import { useEffect, useMemo, useRef } from 'react'
import { WORLD } from '../../world/catalog'
import { sampleHeight } from '../../world/heightmap'
import { useWorldStore } from '../../store/worldStore'
import { getPlayerPosition } from '../../store/enemyRuntime'

const MAP_SIZE = 640

function worldToMap(x: number, z: number, size: number) {
  const half = WORLD.half
  return {
    mx: ((x + half) / (half * 2)) * size,
    my: ((z + half) / (half * 2)) * size,
  }
}

/** Fullscreen top-down colonist map with player marker. */
export function WorldMap() {
  const open = useWorldStore((s) => s.mapOpen)
  const toggle = useWorldStore((s) => s.toggleMap)
  const playerYaw = useWorldStore((s) => s.playerYaw)
  const lakes = useWorldStore((s) => s.lakes)
  const orchards = useWorldStore((s) => s.orchards)
  const mines = useWorldStore((s) => s.mines)
  const buildings = useWorldStore((s) => s.buildings)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const yawRef = useRef(0)

  useEffect(() => {
    yawRef.current = playerYaw
  }, [playerYaw])

  const terrain = useMemo(() => {
    const size = MAP_SIZE
    const data = new Uint8ClampedArray(size * size * 4)
    const step = (WORLD.half * 2) / size
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const wx = -WORLD.half + px * step
        const wz = -WORLD.half + py * step
        const h = sampleHeight(wx, wz)
        const t = Math.min(1, h / 42)
        const i = (py * size + px) * 4
        // Low = green meadow, high = rock/snow
        data[i] = Math.floor(55 + t * 140)
        data[i + 1] = Math.floor(95 - t * 35 + (1 - t) * 40)
        data[i + 2] = Math.floor(45 + t * 70)
        data[i + 3] = 255
      }
    }
    return { size, data }
  }, [])

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new ImageData(terrain.data.slice(), terrain.size, terrain.size)
    const base = document.createElement('canvas')
    base.width = terrain.size
    base.height = terrain.size
    const bctx = base.getContext('2d')
    if (!bctx) return
    bctx.putImageData(img, 0, 0)

    for (const lake of lakes) {
      const { mx, my } = worldToMap(lake.x, lake.z, terrain.size)
      const r = (lake.radius / (WORLD.half * 2)) * terrain.size
      bctx.fillStyle = '#2A6A98'
      bctx.beginPath()
      bctx.arc(mx, my, Math.max(3, r), 0, Math.PI * 2)
      bctx.fill()
    }
    for (const o of orchards) {
      const { mx, my } = worldToMap(o.x, o.z, terrain.size)
      const r = (o.radius / (WORLD.half * 2)) * terrain.size
      bctx.strokeStyle = '#8A9A3A'
      bctx.lineWidth = 2
      bctx.beginPath()
      bctx.arc(mx, my, Math.max(4, r), 0, Math.PI * 2)
      bctx.stroke()
      bctx.fillStyle = '#6A8A30'
      bctx.fillRect(mx - 2, my - 2, 4, 4)
    }
    for (const m of mines) {
      const { mx, my } = worldToMap(m.x, m.z, terrain.size)
      bctx.fillStyle = m.kind.includes('diamante')
        ? '#A8E8FF'
        : m.kind.includes('carbon')
          ? '#222'
          : '#B87333'
      bctx.fillRect(mx - 4, my - 4, 8, 8)
      bctx.strokeStyle = '#fff8'
      bctx.strokeRect(mx - 4, my - 4, 8, 8)
    }
    for (const b of buildings) {
      const { mx, my } = worldToMap(b.x, b.z, terrain.size)
      bctx.fillStyle = '#C4A070'
      bctx.fillRect(mx - 3, my - 3, 6, 6)
    }

    {
      const { mx, my } = worldToMap(0, 8, terrain.size)
      bctx.fillStyle = '#ffffff88'
      bctx.beginPath()
      bctx.arc(mx, my, 3, 0, Math.PI * 2)
      bctx.fill()
    }

    let raf = 0
    const draw = () => {
      const p = getPlayerPosition()
      ctx.drawImage(base, 0, 0, canvas.width, canvas.height)
      const { mx, my } = worldToMap(p.x, p.z, canvas.width)

      ctx.strokeStyle = '#6FE04A'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(mx, my, 8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#FF7A59'
      ctx.beginPath()
      ctx.arc(mx, my, 4, 0, Math.PI * 2)
      ctx.fill()

      const yaw = yawRef.current
      const len = 14
      const fx = mx + Math.sin(yaw) * len
      const fy = my - Math.cos(yaw) * len
      ctx.strokeStyle = '#6FE04A'
      ctx.beginPath()
      ctx.moveTo(mx, my)
      ctx.lineTo(fx, fy)
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [open, lakes, orchards, mines, buildings, terrain])

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="pointer-events-auto absolute bottom-24 right-3 z-20 rounded-md border border-white/20 bg-black/65 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg sm:bottom-6 sm:right-4"
      >
        Mapa · M
      </button>
    )
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[200] flex h-[100dvh] w-screen flex-col bg-[#0c1014]">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
            Cartografía
          </p>
          <h2 className="text-xl font-bold tracking-wide text-[#d8c8a8] sm:text-2xl">
            Mapa del valle
          </h2>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="min-h-11 rounded-md border border-white/20 bg-white/5 px-4 text-sm font-bold uppercase tracking-wider text-white"
        >
          Cerrar · Esc / M
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-auto p-3 sm:p-5">
        <canvas
          ref={canvasRef}
          width={MAP_SIZE}
          height={MAP_SIZE}
          className="max-h-[min(72vh,720px)] max-w-full rounded-md border border-white/15 shadow-2xl"
        />
        <ul className="flex flex-wrap justify-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FF7A59]" /> Tú
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2A6A98]" /> Lago
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[#6A8A30]" /> Huerto
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[#B87333]" /> Mina
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[#C4A070]" /> Construcción
          </li>
        </ul>
      </div>
    </div>
  )
}
