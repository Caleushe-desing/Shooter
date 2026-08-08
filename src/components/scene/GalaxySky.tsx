import { useMemo } from 'react'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

/** Procedural high-saturation galaxy equirectangular sky. */
function createGalaxyTexture() {
  const w = 2048
  const h = 1024
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#0a0618')
  base.addColorStop(0.35, '#1a0a3a')
  base.addColorStop(0.55, '#12082e')
  base.addColorStop(1, '#050210')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  const nebulas: Array<[number, number, number, string, string]> = [
    [0.28, 0.42, 0.55, 'rgba(255,40,160,0.55)', 'rgba(80,0,120,0)'],
    [0.62, 0.38, 0.48, 'rgba(40,180,255,0.5)', 'rgba(0,40,100,0)'],
    [0.48, 0.55, 0.42, 'rgba(180,60,255,0.45)', 'rgba(40,0,80,0)'],
    [0.78, 0.48, 0.35, 'rgba(255,120,40,0.4)', 'rgba(80,20,0,0)'],
    [0.18, 0.58, 0.3, 'rgba(60,255,200,0.35)', 'rgba(0,60,40,0)'],
    [0.55, 0.28, 0.38, 'rgba(255,80,200,0.4)', 'rgba(60,0,80,0)'],
  ]

  for (const [ux, uy, radius, c0, c1] of nebulas) {
    const x = ux * w
    const y = uy * h
    const r = radius * h
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, c0)
    g.addColorStop(1, c1)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  // Milky band
  ctx.save()
  ctx.translate(w * 0.5, h * 0.48)
  ctx.rotate(-0.25)
  const band = ctx.createLinearGradient(0, -h * 0.08, 0, h * 0.08)
  band.addColorStop(0, 'rgba(0,0,0,0)')
  band.addColorStop(0.5, 'rgba(220,180,255,0.22)')
  band.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = band
  ctx.fillRect(-w, -h * 0.1, w * 2, h * 0.2)
  ctx.restore()

  // Stars
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = Math.random() * 1.4 + 0.3
    const a = 0.45 + Math.random() * 0.55
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // Bright tinted stars
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const tint = ['#ff8ad8', '#8ad4ff', '#ffe08a', '#c8ff9a'][i % 4]!
    ctx.fillStyle = tint
    ctx.beginPath()
    ctx.arc(x, y, 1.2 + Math.random() * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

export function GalaxySky() {
  const texture = useMemo(() => createGalaxyTexture(), [])

  return (
    <group>
      <mesh>
        <sphereGeometry args={[280, 48, 32]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <Stars radius={120} depth={60} count={1800} factor={3.2} saturation={0.9} fade speed={0.35} />
    </group>
  )
}
