import * as THREE from 'three'
import { COLORS } from '../constants'

/**
 * Canvas-generated environment textures with a bright, toy-like Sims finish.
 * Produced locally so the game stays offline-friendly.
 */

function createCanvas(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return { canvas, ctx }
}

function finish(canvas: HTMLCanvasElement, repeat: number) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

let brickTexture: THREE.Texture | null = null
let grassTexture: THREE.Texture | null = null
let skyTexture: THREE.Texture | null = null
let cloudTexture: THREE.Texture | null = null

/** Warm suburban brick — soft mortar, saturated clay. */
export function getBrickTexture(): THREE.Texture {
  if (brickTexture) return brickTexture

  const size = 512
  const { canvas, ctx } = createCanvas(size)

  ctx.fillStyle = COLORS.mortar
  ctx.fillRect(0, 0, size, size)

  const rows = 8
  const brickH = size / rows
  const brickW = size / 4
  const mortar = 8
  const tones = ['#C96A4A', '#D47A58', '#B85C40', '#E08968', '#C46A4E']

  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : -brickW / 2
    for (let col = -1; col <= 4; col++) {
      const x = col * brickW + offset + mortar / 2
      const y = row * brickH + mortar / 2
      const w = brickW - mortar
      const h = brickH - mortar

      // Rounded rect so bricks feel soft / toy-like.
      const r = 6
      ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)]
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = 'rgba(255,255,255,0.16)'
      ctx.fillRect(x + 3, y + 2, w - 6, 3)
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(x + 3, y + h - 5, w - 6, 3)
    }
  }

  brickTexture = finish(canvas, 1)
  return brickTexture
}

/** Natural meadow grass — muted earth tones, denser blades. */
export function getGrassTexture(): THREE.Texture {
  if (grassTexture) return grassTexture

  const size = 512
  const { canvas, ctx } = createCanvas(size)

  ctx.fillStyle = COLORS.grass
  ctx.fillRect(0, 0, size, size)

  const patches = [COLORS.grassLight, COLORS.grassDark, '#3F6A32', '#5A7A40', '#4A6030']
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = patches[Math.floor(Math.random() * patches.length)]
    ctx.globalAlpha = 0.22
    ctx.beginPath()
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      20 + Math.random() * 80,
      14 + Math.random() * 50,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const blades = ['#3A5A2E', '#4A6A38', '#2E4A28', '#5A7040']
  for (let i = 0; i < 5200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const len = 2 + Math.random() * 5
    const lean = (Math.random() - 0.5) * 2
    ctx.strokeStyle = blades[Math.floor(Math.random() * blades.length)]
    ctx.lineWidth = Math.random() > 0.85 ? 1.4 : 0.9
    ctx.globalAlpha = 0.55 + Math.random() * 0.35
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + lean, y - len)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Sparse dirt flecks for realism.
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#5A4A30' : '#3A3428'
    ctx.globalAlpha = 0.25
    ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 4, 1 + Math.random() * 3)
  }
  ctx.globalAlpha = 1

  grassTexture = finish(canvas, 1)
  return grassTexture
}

/** Bright Sims sky gradient. */
export function getSkyTexture(): THREE.Texture {
  if (skyTexture) return skyTexture

  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, COLORS.skyZenith)
  grad.addColorStop(0.45, COLORS.sky)
  grad.addColorStop(0.78, '#9BB8C8')
  grad.addColorStop(1, COLORS.skyHorizon)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  skyTexture = texture
  return texture
}

/** Soft cotton-puff cloud sprite. */
export function getCloudTexture(): THREE.Texture {
  if (cloudTexture) return cloudTexture

  const size = 256
  const { canvas, ctx } = createCanvas(size)
  const half = size / 2

  const grad = ctx.createRadialGradient(half, half, size * 0.04, half, half, half)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.92)')
  grad.addColorStop(0.7, 'rgba(245,250,255,0.35)')
  grad.addColorStop(1, 'rgba(245,250,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  cloudTexture = texture
  return texture
}
