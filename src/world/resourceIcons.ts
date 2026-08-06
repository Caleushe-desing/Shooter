import * as THREE from 'three'
import type { ResourceId } from './catalog'

type IconSpec = {
  bg: string
  fg: string
  /** Simple geometric mark drawn into a canvas icon. */
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

function leaf(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.52, size * 0.28, size * 0.38, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1A3A20'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.22)
  ctx.lineTo(size * 0.5, size * 0.82)
  ctx.stroke()
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

function meat(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#E85A5A'
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.55, size * 0.3, size * 0.22, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#F8D9BC'
  ctx.beginPath()
  ctx.arc(size * 0.28, size * 0.42, size * 0.1, 0, Math.PI * 2)
  ctx.fill()
}

const SPECS: Record<ResourceId, IconSpec> = {
  maqui: {
    bg: '#2A1840',
    fg: '#6B2A8A',
    draw: (ctx, s) => berry(ctx, s, '#6B2A8A'),
  },
  pinon: {
    bg: '#3A2A18',
    fg: '#C4A35A',
    draw: (ctx, s) => {
      ctx.fillStyle = '#C4A35A'
      ctx.beginPath()
      ctx.ellipse(s * 0.5, s * 0.55, s * 0.22, s * 0.32, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#8A6A30'
      ctx.stroke()
    },
  },
  copihue: {
    bg: '#3A1020',
    fg: '#E23A4A',
    draw: (ctx, s) => {
      ctx.fillStyle = '#E23A4A'
      ctx.beginPath()
      ctx.moveTo(s * 0.5, s * 0.2)
      ctx.quadraticCurveTo(s * 0.85, s * 0.45, s * 0.5, s * 0.85)
      ctx.quadraticCurveTo(s * 0.15, s * 0.45, s * 0.5, s * 0.2)
      ctx.fill()
    },
  },
  fruta_quillay: {
    bg: '#2A3A18',
    fg: '#C45A4A',
    draw: (ctx, s) => berry(ctx, s, '#C45A4A'),
  },
  hoja_boldo: {
    bg: '#1A3020',
    fg: '#4A7A3A',
    draw: (ctx, s) => leaf(ctx, s, '#4A7A3A'),
  },
  madera: {
    bg: '#2A1C12',
    fg: '#8B5A3C',
    draw: (ctx, s) => {
      ctx.fillStyle = '#8B5A3C'
      ctx.fillRect(s * 0.28, s * 0.22, s * 0.44, s * 0.56)
      ctx.strokeStyle = '#5A3A28'
      ctx.strokeRect(s * 0.28, s * 0.22, s * 0.44, s * 0.56)
      ctx.beginPath()
      ctx.moveTo(s * 0.28, s * 0.4)
      ctx.lineTo(s * 0.72, s * 0.4)
      ctx.stroke()
    },
  },
  carne: {
    bg: '#3A1818',
    fg: '#E85A5A',
    draw: (ctx, s) => meat(ctx, s),
  },
  lana: {
    bg: '#2A2A30',
    fg: '#F2F0EA',
    draw: (ctx, s) => {
      ctx.fillStyle = '#F2F0EA'
      for (const [x, y] of [
        [0.35, 0.45],
        [0.55, 0.4],
        [0.45, 0.6],
        [0.62, 0.58],
      ]) {
        ctx.beginPath()
        ctx.arc(s * x, s * y, s * 0.16, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  },
  cuero: {
    bg: '#2A1A10',
    fg: '#8B5A2B',
    draw: (ctx, s) => {
      ctx.fillStyle = '#8B5A2B'
      ctx.beginPath()
      ctx.moveTo(s * 0.2, s * 0.35)
      ctx.lineTo(s * 0.8, s * 0.3)
      ctx.lineTo(s * 0.75, s * 0.75)
      ctx.lineTo(s * 0.25, s * 0.7)
      ctx.closePath()
      ctx.fill()
    },
  },
  cobre: {
    bg: '#2A2018',
    fg: '#B87333',
    draw: (ctx, s) => nugget(ctx, s, '#B87333'),
  },
  litio: {
    bg: '#1A2428',
    fg: '#D0D8E0',
    draw: (ctx, s) => {
      ctx.fillStyle = '#E8E0D0'
      ctx.fillRect(s * 0.22, s * 0.45, s * 0.56, s * 0.28)
      ctx.fillStyle = '#D0D8E0'
      ctx.fillRect(s * 0.3, s * 0.35, s * 0.4, s * 0.12)
    },
  },
  oro: {
    bg: '#2A2410',
    fg: '#E8C84A',
    draw: (ctx, s) => nugget(ctx, s, '#E8C84A'),
  },
  salitre: {
    bg: '#282820',
    fg: '#F4F0E4',
    draw: (ctx, s) => {
      ctx.fillStyle = '#F4F0E4'
      ctx.beginPath()
      ctx.arc(s * 0.4, s * 0.55, s * 0.16, 0, Math.PI * 2)
      ctx.arc(s * 0.58, s * 0.48, s * 0.14, 0, Math.PI * 2)
      ctx.arc(s * 0.55, s * 0.65, s * 0.12, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  piedra: {
    bg: '#222224',
    fg: '#9A9A96',
    draw: (ctx, s) => nugget(ctx, s, '#9A9A96'),
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

/** Canvas-drawn icon URL for inventory HUD. */
export function getResourceIconUrl(id: ResourceId, size = 64): string {
  const hit = urlCache.get(id)
  if (hit) return hit

  const canvas = paintIcon(id, size)
  if (!canvas) return ''

  const url = canvas.toDataURL('image/png')
  urlCache.set(id, url)
  return url
}

/** Shared Three.js sprite texture for world resource markers. */
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

export const RESOURCE_ICON_COLORS: Record<ResourceId, string> = Object.fromEntries(
  (Object.keys(SPECS) as ResourceId[]).map((id) => [id, SPECS[id].fg]),
) as Record<ResourceId, string>
