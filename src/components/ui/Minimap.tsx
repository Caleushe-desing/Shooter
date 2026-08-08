import { useEffect, useRef } from 'react'
import { viewState } from '../../input/viewState'
import { useGameStore } from '../../store/gameStore'

/**
 * Circular schematic minimap + rotating compass (N = world −Z).
 * Map stays north-up; player arrow rotates with camera yaw.
 */
export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const roseRef = useRef<HTMLDivElement>(null)
  const minimap = useGameStore((s) => s.map.minimap)
  const flag = useGameStore((s) => s.map.flag)
  const seed = useGameStore((s) => s.map.seed)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const size = canvas.width
    const half = size * 0.5
    const world = minimap.size
    const scale = (size * 0.86) / world

    const toMap = (x: number, z: number) => ({
      // North (−Z) toward top of minimap
      mx: half + x * scale,
      my: half + z * scale,
    })

    const draw = () => {
      raf = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, size, size)

      // Disk background
      ctx.save()
      ctx.beginPath()
      ctx.arc(half, half, half - 2, 0, Math.PI * 2)
      ctx.clip()

      ctx.fillStyle = 'rgba(12, 18, 28, 0.82)'
      ctx.fillRect(0, 0, size, size)

      // Zone bands
      ctx.fillStyle = 'rgba(95, 122, 74, 0.35)'
      ctx.fillRect(0, half + 8 * scale, size, 26 * scale)
      ctx.fillStyle = 'rgba(122, 104, 72, 0.28)'
      ctx.fillRect(0, half - 10 * scale, size, 18 * scale)
      ctx.fillStyle = 'rgba(140, 120, 90, 0.32)'
      ctx.fillRect(0, 0, size, half - 10 * scale)

      // Rubik border hint
      ctx.strokeStyle = 'rgba(244, 81, 30, 0.55)'
      ctx.lineWidth = 3
      const pad = half - (world * 0.5) * scale
      ctx.strokeRect(pad, pad, world * scale, world * scale)

      // Buildings
      for (const b of minimap.buildings) {
        const p = toMap(b.x - b.w * 0.5, b.z - b.d * 0.5)
        ctx.fillStyle = 'rgba(180, 170, 150, 0.85)'
        ctx.fillRect(p.mx, p.my, b.w * scale, b.d * scale)
      }

      // Arena
      const a = toMap(minimap.arena.x, minimap.arena.z)
      ctx.beginPath()
      ctx.arc(a.mx, a.my, minimap.arena.r * scale, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(194, 168, 120, 0.7)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(220, 80, 60, 0.95)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Flag
      const f = toMap(flag.x, flag.z)
      ctx.fillStyle = '#e05040'
      ctx.beginPath()
      ctx.arc(f.mx, f.my, 3.2, 0, Math.PI * 2)
      ctx.fill()

      // Player
      const p = toMap(viewState.x, viewState.z)
      ctx.save()
      ctx.translate(p.mx, p.my)
      // yaw=0 faces −Z (up on map); canvas +Y is down so rotate carefully
      ctx.rotate(viewState.lookYaw)
      ctx.fillStyle = '#6fe04a'
      ctx.beginPath()
      ctx.moveTo(0, -7)
      ctx.lineTo(5, 6)
      ctx.lineTo(0, 3)
      ctx.lineTo(-5, 6)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      ctx.restore()

      // Outer ring
      ctx.beginPath()
      ctx.arc(half, half, half - 1.5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2
      ctx.stroke()

      if (roseRef.current) {
        // Compass rose rotates opposite to yaw so N stays world-north relative to view.
        roseRef.current.style.transform = `rotate(${(-viewState.lookYaw * 180) / Math.PI}deg)`
      }
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [minimap, flag, seed])

  return (
    <div className="minimap-wrap">
      <div className="minimap-compass" ref={roseRef} aria-hidden>
        <span className="minimap-n">N</span>
        <span className="minimap-e">E</span>
        <span className="minimap-s">S</span>
        <span className="minimap-w">W</span>
      </div>
      <canvas ref={canvasRef} className="minimap-canvas" width={168} height={168} />
    </div>
  )
}
