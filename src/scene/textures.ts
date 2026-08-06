import * as THREE from 'three'

/**
 * Canvas-generated environment textures. Everything is produced locally so the
 * game keeps working offline (no CDN/asset fetches).
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

/** Red brick courses with mortar joints. */
export function getBrickTexture(): THREE.Texture {
  if (brickTexture) return brickTexture

  const size = 512
  const { canvas, ctx } = createCanvas(size)

  ctx.fillStyle = '#9c948a'
  ctx.fillRect(0, 0, size, size)

  const rows = 8
  const brickH = size / rows
  const brickW = size / 4
  const mortar = 6
  const tones = ['#8f3a2c', '#a4472f', '#7c3227', '#9b4433', '#88372b']

  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : -brickW / 2
    for (let col = -1; col <= 4; col++) {
      const x = col * brickW + offset + mortar / 2
      const y = row * brickH + mortar / 2
      const w = brickW - mortar
      const h = brickH - mortar

      ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)]
      ctx.fillRect(x, y, w, h)

      // Weathering speckles so bricks don't read as flat rectangles.
      for (let i = 0; i < 26; i++) {
        const alpha = Math.random() * 0.16
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`
        ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 3, 2)
      }

      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      ctx.fillRect(x, y, w, 2)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(x, y + h - 2, w, 2)
    }
  }

  brickTexture = finish(canvas, 1)
  return brickTexture
}

/** Mown lawn with blade detail and patchy tone variation. */
export function getGrassTexture(): THREE.Texture {
  if (grassTexture) return grassTexture

  const size = 512
  const { canvas, ctx } = createCanvas(size)

  ctx.fillStyle = '#3e7a30'
  ctx.fillRect(0, 0, size, size)

  // Broad patches for large-scale variation.
  const patches = ['#356d2a', '#478536', '#2f6526', '#4f8f3b']
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = patches[Math.floor(Math.random() * patches.length)]
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      20 + Math.random() * 60,
      14 + Math.random() * 40,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const blades = ['#2c5f22', '#5aa043', '#68b04c', '#3b7a2e']
  for (let i = 0; i < 5200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const len = 3 + Math.random() * 7
    const lean = (Math.random() - 0.5) * 3
    ctx.strokeStyle = blades[Math.floor(Math.random() * blades.length)]
    ctx.lineWidth = Math.random() > 0.75 ? 1.6 : 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + lean, y - len)
    ctx.stroke()
  }

  grassTexture = finish(canvas, 1)
  return grassTexture
}

/** Vertical gradient for the sky dome (zenith blue → pale horizon). */
export function getSkyTexture(): THREE.Texture {
  if (skyTexture) return skyTexture

  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, '#1c69c9')
  grad.addColorStop(0.42, '#5aa4e6')
  grad.addColorStop(0.72, '#9ccbf2')
  grad.addColorStop(1, '#dcecf8')
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

/** Soft round puff used to build billboarded clouds. */
export function getCloudTexture(): THREE.Texture {
  if (cloudTexture) return cloudTexture

  const size = 256
  const { canvas, ctx } = createCanvas(size)
  const half = size / 2

  const grad = ctx.createRadialGradient(half, half, size * 0.05, half, half, half)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.45, 'rgba(255,255,255,0.85)')
  grad.addColorStop(0.75, 'rgba(240,246,252,0.32)')
  grad.addColorStop(1, 'rgba(240,246,252,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  cloudTexture = texture
  return texture
}
