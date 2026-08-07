import * as THREE from 'three'

export type SurfaceKind =
  | 'grass'
  | 'cobble'
  | 'brick'
  | 'wood'
  | 'stone'
  | 'plaster'
  | 'roof'
  | 'sand'

type Rgb = [number, number, number]

function hash2(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const a = hash2(x0, y0, seed)
  const b = hash2(x0 + 1, y0, seed)
  const c = hash2(x0, y0 + 1, seed)
  const d = hash2(x0 + 1, y0 + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number, seed: number, octaves = 4) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(x * freq, y * freq, seed + i * 19) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function putPixel(
  data: Uint8ClampedArray,
  i: number,
  rgb: Rgb,
  a = 255,
) {
  const o = i * 4
  data[o] = rgb[0]
  data[o + 1] = rgb[1]
  data[o + 2] = rgb[2]
  data[o + 3] = a
}

function canvasTexture(
  size: number,
  paint: (ctx: CanvasRenderingContext2D, data: ImageData) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const image = ctx.createImageData(size, size)
  paint(ctx, image)
  ctx.putImageData(image, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

function paintGrass(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const base: Rgb = [72, 118, 52]
  const tip: Rgb = [118, 158, 68]
  const dirt: Rgb = [58, 78, 40]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x * 0.07, y * 0.07, 11)
      const blade = fbm(x * 0.35, y * 0.08, 22)
      const streak = ((x * 3 + y * 17) % 9) / 9
      let c = mixRgb(dirt, base, 0.55 + n * 0.45)
      c = mixRgb(c, tip, blade * 0.55 + streak * 0.15)
      // Fine vertical blade ticks
      if ((x + Math.floor(y * 0.4)) % 4 === 0) {
        c = mixRgb(c, tip, 0.35)
      }
      putPixel(px, y * w + x, c)
    }
  }
}

function paintCobble(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const mortar: Rgb = [92, 86, 78]
  const stoneA: Rgb = [148, 138, 122]
  const stoneB: Rgb = [118, 112, 102]
  const stoneC: Rgb = [168, 156, 138]
  const cell = 18
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const row = Math.floor(y / cell)
      const offset = (row % 2) * (cell * 0.5)
      const cx = Math.floor((x + offset) / cell)
      const cy = row
      const lx = (x + offset) % cell
      const ly = y % cell
      const edge = Math.min(lx, ly, cell - 1 - lx, cell - 1 - ly)
      const n = hash2(cx, cy, 41)
      let stone = n < 0.33 ? stoneA : n < 0.66 ? stoneB : stoneC
      const grain = fbm(x * 0.2, y * 0.2, 7)
      stone = mixRgb(stone, mortar, grain * 0.18)
      const c = edge < 1.6 ? mortar : mixRgb(stone, mortar, edge < 2.4 ? 0.35 : 0)
      putPixel(px, y * w + x, c)
    }
  }
}

function paintBrick(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const mortar: Rgb = [196, 186, 170]
  const brickA: Rgb = [168, 78, 54]
  const brickB: Rgb = [148, 68, 48]
  const brickC: Rgb = [186, 96, 66]
  const bw = 28
  const bh = 12
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const row = Math.floor(y / bh)
      const off = (row % 2) * (bw * 0.5)
      const bx = Math.floor((x + off) / bw)
      const by = row
      const lx = (x + off) % bw
      const ly = y % bh
      const mortarGap = lx < 1.4 || ly < 1.2
      if (mortarGap) {
        putPixel(px, y * w + x, mortar)
        continue
      }
      const n = hash2(bx, by, 63)
      let c = n < 0.34 ? brickA : n < 0.67 ? brickB : brickC
      const grain = fbm(x * 0.25, y * 0.25, 9)
      c = mixRgb(c, mortar, grain * 0.12)
      putPixel(px, y * w + x, c)
    }
  }
}

function paintWood(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const dark: Rgb = [92, 56, 32]
  const mid: Rgb = [138, 86, 48]
  const light: Rgb = [168, 118, 72]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const plank = Math.floor(x / 32)
      const seam = x % 32 < 1.5
      const grain = fbm(plank * 3 + x * 0.015, y * 0.22, 31)
      const ring = Math.sin(y * 0.09 + grain * 6 + plank) * 0.5 + 0.5
      let c = mixRgb(dark, mid, grain)
      c = mixRgb(c, light, ring * 0.35)
      if (seam) c = mixRgb(c, dark, 0.65)
      // Knots
      const kx = (x % 32) - 16
      const ky = ((y + plank * 40) % 64) - 32
      if (kx * kx + ky * ky * 2.2 < 18) c = mixRgb(c, dark, 0.45)
      putPixel(px, y * w + x, c)
    }
  }
}

function paintStone(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const a: Rgb = [150, 138, 122]
  const b: Rgb = [112, 102, 92]
  const c0: Rgb = [176, 164, 148]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x * 0.08, y * 0.08, 17)
      const cracks = fbm(x * 0.4, y * 0.4, 28)
      let c = mixRgb(b, a, n)
      c = mixRgb(c, c0, cracks * 0.35)
      if (cracks > 0.72) c = mixRgb(c, b, 0.55)
      putPixel(px, y * w + x, c)
    }
  }
}

function paintPlaster(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const base: Rgb = [214, 200, 178]
  const shade: Rgb = [188, 174, 154]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x * 0.12, y * 0.12, 5)
      const c = mixRgb(base, shade, n * 0.7)
      putPixel(px, y * w + x, c)
    }
  }
}

function paintRoof(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const tileA: Rgb = [110, 72, 54]
  const tileB: Rgb = [88, 58, 44]
  const tileC: Rgb = [130, 86, 64]
  const gap: Rgb = [70, 48, 38]
  const tw = 16
  const th = 10
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const row = Math.floor(y / th)
      const off = (row % 2) * (tw * 0.5)
      const lx = (x + off) % tw
      const ly = y % th
      if (lx < 1.2 || ly < 1) {
        putPixel(px, y * w + x, gap)
        continue
      }
      const n = hash2(Math.floor((x + off) / tw), row, 44)
      let c = n < 0.33 ? tileA : n < 0.66 ? tileB : tileC
      const shade = ly / th
      c = mixRgb(c, gap, shade * 0.25)
      putPixel(px, y * w + x, c)
    }
  }
}

function paintSand(data: ImageData) {
  const { width: w, height: h, data: px } = data
  const a: Rgb = [198, 178, 138]
  const b: Rgb = [170, 152, 116]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x * 0.1, y * 0.1, 3)
      putPixel(px, y * w + x, mixRgb(a, b, n))
    }
  }
}

const painters: Record<SurfaceKind, (data: ImageData) => void> = {
  grass: paintGrass,
  cobble: paintCobble,
  brick: paintBrick,
  wood: paintWood,
  stone: paintStone,
  plaster: paintPlaster,
  roof: paintRoof,
  sand: paintSand,
}

const TEX_SIZE: Record<SurfaceKind, number> = {
  grass: 256,
  cobble: 256,
  brick: 256,
  wood: 256,
  stone: 256,
  plaster: 128,
  roof: 256,
  sand: 128,
}

/** Meters per texture tile (world-space repeat). */
const TILE_METERS: Record<SurfaceKind, number> = {
  grass: 4.5,
  cobble: 2.2,
  brick: 1.6,
  wood: 1.4,
  stone: 2.4,
  plaster: 3.2,
  roof: 1.8,
  sand: 3.5,
}

const ROUGHNESS: Record<SurfaceKind, number> = {
  grass: 0.95,
  cobble: 0.92,
  brick: 0.9,
  wood: 0.86,
  stone: 0.9,
  plaster: 0.94,
  roof: 0.88,
  sand: 0.96,
}

const textureCache = new Map<SurfaceKind, THREE.CanvasTexture>()

export function getSurfaceTexture(kind: SurfaceKind): THREE.CanvasTexture {
  let tex = textureCache.get(kind)
  if (tex) return tex
  const size = TEX_SIZE[kind]
  tex = canvasTexture(size, (_ctx, data) => painters[kind](data))
  textureCache.set(kind, tex)
  return tex
}

/** Shared base materials (clone before assigning per-mesh repeat). */
const materialCache = new Map<SurfaceKind, THREE.MeshStandardMaterial>()

function baseMaterial(kind: SurfaceKind): THREE.MeshStandardMaterial {
  let mat = materialCache.get(kind)
  if (mat) return mat
  const map = getSurfaceTexture(kind)
  mat = new THREE.MeshStandardMaterial({
    map,
    roughness: ROUGHNESS[kind],
    metalness: 0.02,
    color: '#ffffff',
  })
  materialCache.set(kind, mat)
  return mat
}

/**
 * Material for a mesh of given world size.
 * Clones map so each mesh can have its own UV repeat.
 */
export function surfaceMaterial(
  kind: SurfaceKind,
  sizeU: number,
  sizeV: number,
): THREE.MeshStandardMaterial {
  const base = baseMaterial(kind)
  const mat = base.clone()
  const src = getSurfaceTexture(kind)
  const map = src.clone()
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.RepeatWrapping
  map.anisotropy = 8
  const tile = TILE_METERS[kind]
  map.repeat.set(Math.max(0.35, sizeU / tile), Math.max(0.35, sizeV / tile))
  map.needsUpdate = true
  mat.map = map
  mat.needsUpdate = true
  return mat
}

/** Infer surface from legacy color / role. */
export function surfaceFromColor(color: string): SurfaceKind {
  switch (color) {
    case '#C96A4A':
      return 'brick'
    case '#8B5A3C':
      return 'wood'
    case '#B8A890':
      return 'stone'
    case '#8A7A68':
      return 'stone'
    case '#D8C8B0':
      return 'plaster'
    case '#6B4A3A':
    case '#4A6B52':
      return 'roof'
    case '#C4B48A':
      return 'cobble'
    case '#5A8A48':
      return 'grass'
    default:
      return 'stone'
  }
}
