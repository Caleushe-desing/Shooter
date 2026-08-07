/** Shared height field for mountains, hills and valleys. */

function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

function smoothNoise(x: number, z: number) {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const xf = x - xi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = zf * zf * (3 - 2 * zf)
  const a = hash2(xi, zi)
  const b = hash2(xi + 1, zi)
  const c = hash2(xi, zi + 1)
  const d = hash2(xi + 1, zi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, z: number, octaves = 5) {
  let amp = 1
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(x * freq, z * freq) * amp
    norm += amp
    amp *= 0.5
    freq *= 2.05
  }
  return sum / norm
}

/**
 * World height in meters. Spawn stays near-flat; distant ranges rise into mountains.
 */
export function sampleHeight(x: number, z: number): number {
  // Soft bowl so the spawn clearing stays walkable.
  const dist = Math.hypot(x, z)
  const spawnFlatten = Math.max(0, 1 - dist / 55)

  const rolling = fbm(x * 0.0045, z * 0.0045, 5) * 14
  const ridges = Math.pow(Math.abs(fbm(x * 0.0022 + 20, z * 0.0022 - 8, 4) * 2 - 1), 1.35) * 38
  const peaks = Math.pow(Math.max(0, fbm(x * 0.0014 - 3, z * 0.0014 + 11, 3) - 0.55), 2) * 70
  const detail = fbm(x * 0.02, z * 0.02, 2) * 1.6

  // Mountain rings away from center.
  const mountainMask = Math.min(1, Math.max(0, (dist - 90) / 220))
  let h = rolling * (1 - spawnFlatten * 0.85) + ridges * mountainMask + peaks * mountainMask + detail

  // Carve gentle valleys for lakes / orchards (negative dips).
  const valley = fbm(x * 0.003 + 50, z * 0.003 - 40, 3)
  if (valley < 0.38) h -= (0.38 - valley) * 10

  h *= 1 - spawnFlatten * 0.92
  return Math.max(0, h)
}

export function sampleNormal(x: number, z: number): [number, number, number] {
  const e = 1.2
  const hL = sampleHeight(x - e, z)
  const hR = sampleHeight(x + e, z)
  const hD = sampleHeight(x, z - e)
  const hU = sampleHeight(x, z + e)
  const nx = hL - hR
  const nz = hD - hU
  const ny = 2 * e
  const len = Math.hypot(nx, ny, nz) || 1
  return [nx / len, ny / len, nz / len]
}

/** Slope 0 = flat, 1 = steep — used to keep trees off cliffs. */
export function sampleSlope(x: number, z: number): number {
  const [, ny] = sampleNormal(x, z)
  return 1 - Math.max(0, Math.min(1, ny))
}
