import * as THREE from 'three'
import type { ResourceId } from './catalog'

type IconSpec = {
  bg: string
  fg: string
  draw: (ctx: CanvasRenderingContext2D, size: number) => void
}

function berry(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(size * 0.5, size * 0.55, size * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2F6B3A'
  ctx.fillRect(size * 0.42, size * 0.18, size * 0.16, size * 0.22)
}

function nugget(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(size * 0.25, size * 0.65)
  ctx.lineTo(size * 0.35, size * 0.3)
  ctx.lineTo(size * 0.7, size * 0.28)
  ctx.lineTo(size * 0.82, size * 0.6)
  ctx.lineTo(size * 0.55, size * 0.8)
  ctx.closePath()
  ctx.fill()
}

function drop(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.18)
  ctx.quadraticCurveTo(size * 0.85, size * 0.55, size * 0.5, size * 0.85)
  ctx.quadraticCurveTo(size * 0.15, size * 0.55, size * 0.5, size * 0.18)
  ctx.fill()
}

function bar(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(size * 0.22, size * 0.35, size * 0.56, size * 0.32)
}

const SPECS: Record<ResourceId, IconSpec> = {
  bayas: { bg: '#2A1020', fg: '#C43A5A', draw: (c, s) => berry(c, s, '#C43A5A') },
  carne: {
    bg: '#3A1818',
    fg: '#E85A5A',
    draw: (c, s) => {
      c.fillStyle = '#E85A5A'
      c.beginPath()
      c.ellipse(s * 0.5, s * 0.55, s * 0.3, s * 0.22, -0.3, 0, Math.PI * 2)
      c.fill()
    },
  },
  pez: {
    bg: '#102838',
    fg: '#5AB0D0',
    draw: (c, s) => {
      c.fillStyle = '#5AB0D0'
      c.beginPath()
      c.ellipse(s * 0.48, s * 0.52, s * 0.28, s * 0.16, 0, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.moveTo(s * 0.72, s * 0.52)
      c.lineTo(s * 0.88, s * 0.38)
      c.lineTo(s * 0.88, s * 0.66)
      c.closePath()
      c.fill()
    },
  },
  agua: { bg: '#102848', fg: '#4AA8E8', draw: (c, s) => drop(c, s, '#4AA8E8') },
  comida_cocida: {
    bg: '#3A2810',
    fg: '#E8A050',
    draw: (c, s) => {
      c.fillStyle = '#E8A050'
      c.beginPath()
      c.arc(s * 0.5, s * 0.55, s * 0.28, 0, Math.PI * 2)
      c.fill()
    },
  },
  madera: {
    bg: '#2A1C12',
    fg: '#8B5A3C',
    draw: (c, s) => {
      c.fillStyle = '#8B5A3C'
      c.fillRect(s * 0.28, s * 0.22, s * 0.44, s * 0.56)
    },
  },
  lena: {
    bg: '#241810',
    fg: '#A07040',
    draw: (c, s) => {
      c.fillStyle = '#A07040'
      c.fillRect(s * 0.2, s * 0.42, s * 0.6, s * 0.16)
      c.fillRect(s * 0.28, s * 0.28, s * 0.5, s * 0.14)
    },
  },
  fibra: {
    bg: '#1A3020',
    fg: '#7AAA4A',
    draw: (c, s) => {
      c.strokeStyle = '#7AAA4A'
      c.lineWidth = 3
      for (let i = 0; i < 4; i++) {
        c.beginPath()
        c.moveTo(s * (0.3 + i * 0.1), s * 0.8)
        c.quadraticCurveTo(s * (0.35 + i * 0.1), s * 0.4, s * (0.28 + i * 0.1), s * 0.2)
        c.stroke()
      }
    },
  },
  cuero: {
    bg: '#2A1A10',
    fg: '#8B5A2B',
    draw: (c, s) => {
      c.fillStyle = '#8B5A2B'
      c.fillRect(s * 0.25, s * 0.3, s * 0.5, s * 0.45)
    },
  },
  lana: {
    bg: '#2A2A30',
    fg: '#F2F0EA',
    draw: (c, s) => {
      c.fillStyle = '#F2F0EA'
      for (const [x, y] of [
        [0.35, 0.45],
        [0.55, 0.4],
        [0.45, 0.6],
      ]) {
        c.beginPath()
        c.arc(s * x, s * y, s * 0.16, 0, Math.PI * 2)
        c.fill()
      }
    },
  },
  piedra: { bg: '#222224', fg: '#9A9A96', draw: (c, s) => nugget(c, s, '#9A9A96') },
  arena: { bg: '#3A3020', fg: '#E8D5A8', draw: (c, s) => nugget(c, s, '#E8D5A8') },
  arcilla: { bg: '#2A1810', fg: '#A06848', draw: (c, s) => nugget(c, s, '#A06848') },
  caliza: { bg: '#2A2A28', fg: '#E8E4D8', draw: (c, s) => nugget(c, s, '#E8E4D8') },
  carbon: { bg: '#141416', fg: '#4A4A4C', draw: (c, s) => nugget(c, s, '#4A4A4C') },
  hierro: { bg: '#241810', fg: '#8A5A48', draw: (c, s) => nugget(c, s, '#8A5A48') },
  cobre: { bg: '#2A2018', fg: '#B87333', draw: (c, s) => nugget(c, s, '#B87333') },
  oro: { bg: '#2A2410', fg: '#E8C84A', draw: (c, s) => nugget(c, s, '#E8C84A') },
  sal: {
    bg: '#282820',
    fg: '#F4F0E4',
    draw: (c, s) => {
      c.fillStyle = '#F4F0E4'
      c.beginPath()
      c.arc(s * 0.4, s * 0.55, s * 0.14, 0, Math.PI * 2)
      c.arc(s * 0.58, s * 0.48, s * 0.12, 0, Math.PI * 2)
      c.fill()
    },
  },
  tablas: {
    bg: '#2A1C12',
    fg: '#C4A070',
    draw: (c, s) => {
      c.fillStyle = '#C4A070'
      c.fillRect(s * 0.2, s * 0.28, s * 0.6, s * 0.12)
      c.fillRect(s * 0.2, s * 0.44, s * 0.6, s * 0.12)
      c.fillRect(s * 0.2, s * 0.6, s * 0.6, s * 0.12)
    },
  },
  ladrillo: {
    bg: '#2A1814',
    fg: '#C96A4A',
    draw: (c, s) => {
      c.fillStyle = '#C96A4A'
      c.fillRect(s * 0.22, s * 0.3, s * 0.56, s * 0.2)
      c.fillRect(s * 0.22, s * 0.55, s * 0.56, s * 0.2)
    },
  },
  cemento: { bg: '#242428', fg: '#A8A8A4', draw: (c, s) => bar(c, s, '#A8A8A4') },
  concreto: { bg: '#202024', fg: '#8A8A88', draw: (c, s) => bar(c, s, '#8A8A88') },
  cuerda: {
    bg: '#2A2418',
    fg: '#C4A35A',
    draw: (c, s) => {
      c.strokeStyle = '#C4A35A'
      c.lineWidth = 4
      c.beginPath()
      c.moveTo(s * 0.25, s * 0.7)
      c.quadraticCurveTo(s * 0.5, s * 0.2, s * 0.75, s * 0.7)
      c.stroke()
    },
  },
  clavo: {
    bg: '#222228',
    fg: '#9AA0A8',
    draw: (c, s) => {
      c.fillStyle = '#9AA0A8'
      c.fillRect(s * 0.45, s * 0.22, s * 0.1, s * 0.5)
      c.fillRect(s * 0.35, s * 0.2, s * 0.3, s * 0.1)
    },
  },
  lingote_hierro: { bg: '#1A1A20', fg: '#6A7080', draw: (c, s) => bar(c, s, '#6A7080') },
  herramienta: {
    bg: '#1A2018',
    fg: '#C4A070',
    draw: (c, s) => {
      c.fillStyle = '#8B5A3C'
      c.fillRect(s * 0.45, s * 0.35, s * 0.1, s * 0.45)
      c.fillStyle = '#9A9A96'
      c.beginPath()
      c.moveTo(s * 0.25, s * 0.4)
      c.lineTo(s * 0.75, s * 0.25)
      c.lineTo(s * 0.75, s * 0.45)
      c.closePath()
      c.fill()
    },
  },
  jabon: {
    bg: '#203028',
    fg: '#B8E0C8',
    draw: (c, s) => {
      c.fillStyle = '#B8E0C8'
      c.fillRect(s * 0.28, s * 0.35, s * 0.44, s * 0.32)
    },
  },
}

const urlCache = new Map<ResourceId, string>()
const texCache = new Map<ResourceId, THREE.CanvasTexture>()

function paintIcon(id: ResourceId, size: number): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const spec = SPECS[id]
  ctx.fillStyle = spec.bg
  ctx.beginPath()
  const r = size * 0.22
  ctx.moveTo(r, 0)
  ctx.arcTo(size, 0, size, size, r)
  ctx.arcTo(size, size, 0, size, r)
  ctx.arcTo(0, size, 0, 0, r)
  ctx.arcTo(0, 0, size, 0, r)
  ctx.closePath()
  ctx.fill()
  spec.draw(ctx, size)
  return canvas
}

export function getResourceIconUrl(id: ResourceId, size = 64): string {
  const hit = urlCache.get(id)
  if (hit) return hit
  const canvas = paintIcon(id, size)
  if (!canvas) return ''
  const url = canvas.toDataURL('image/png')
  urlCache.set(id, url)
  return url
}

export function getResourceTexture(id: ResourceId, size = 64): THREE.CanvasTexture {
  const hit = texCache.get(id)
  if (hit) return hit
  const canvas = paintIcon(id, size) ?? document.createElement('canvas')
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  texCache.set(id, tex)
  return tex
}
