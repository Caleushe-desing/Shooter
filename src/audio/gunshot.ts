/**
 * Real firearm samples (Michel Baradari / OpenGameArt, CC-BY 3.0)
 * plus light procedural UI cues.
 */
import {
  getAudioContext,
  loadAudioBuffer,
  playBuffer,
  prefetchAudio,
  unlockAudio,
} from './context'

export { unlockAudio }

const PISTOL_URLS = [
  '/audio/pistol_0.ogg',
  '/audio/pistol_1.ogg',
  '/audio/pistol_2.ogg',
  '/audio/pistol_3.ogg',
  '/audio/pistol_4.ogg',
  '/audio/pistol_5.ogg',
] as const

const pistolBuffers: (AudioBuffer | null)[] = []
let pistolIndex = 0

prefetchAudio(PISTOL_URLS)
void Promise.all(PISTOL_URLS.map((u) => loadAudioBuffer(u))).then((bufs) => {
  for (let i = 0; i < bufs.length; i++) pistolBuffers[i] = bufs[i]
})

/** Loud real gunshot crack. */
export function playGunshot() {
  unlockAudio()
  const ctx = getAudioContext()
  if (!ctx) return

  const i = pistolIndex % PISTOL_URLS.length
  pistolIndex++
  const cached = pistolBuffers[i]
  if (cached) {
    playBuffer(cached, {
      gain: 2.15,
      playbackRate: 0.97 + Math.random() * 0.08,
    })
    return
  }

  void loadAudioBuffer(PISTOL_URLS[i]).then((buffer) => {
    if (!buffer) {
      playProceduralGunshot()
      return
    }
    pistolBuffers[i] = buffer
    playBuffer(buffer, {
      gain: 2.15,
      playbackRate: 0.97 + Math.random() * 0.08,
    })
  })
}

/** Fallback layered pistol crack if samples fail to load. */
function playProceduralGunshot() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime

  // Sharp transient crack
  const crack = ctx.createOscillator()
  const crackG = ctx.createGain()
  crack.type = 'square'
  crack.frequency.setValueAtTime(1800, now)
  crack.frequency.exponentialRampToValueAtTime(120, now + 0.04)
  crackG.gain.setValueAtTime(0.55, now)
  crackG.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
  crack.connect(crackG)
  crackG.connect(ctx.destination)
  crack.start(now)
  crack.stop(now + 0.06)

  // Body boom
  const boom = ctx.createOscillator()
  const boomG = ctx.createGain()
  boom.type = 'sine'
  boom.frequency.setValueAtTime(160, now)
  boom.frequency.exponentialRampToValueAtTime(40, now + 0.18)
  boomG.gain.setValueAtTime(0.9, now)
  boomG.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
  boom.connect(boomG)
  boomG.connect(ctx.destination)
  boom.start(now)
  boom.stop(now + 0.23)

  // Noise blast
  const n = Math.floor(ctx.sampleRate * 0.16)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) {
    const env = Math.pow(1 - i / n, 1.6)
    data[i] = (Math.random() * 2 - 1) * env
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1400
  bp.Q.value = 0.55
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.85, now)
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
  noise.connect(bp)
  bp.connect(ng)
  ng.connect(ctx.destination)
  noise.start(now)
}

export function playImpact() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(220, now)
  o.frequency.exponentialRampToValueAtTime(70, now + 0.08)
  g.gain.setValueAtTime(0.22, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(now)
  o.stop(now + 0.11)
}

export function playAmmoPickup() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(180, now)
  o.frequency.exponentialRampToValueAtTime(90, now + 0.1)
  g.gain.setValueAtTime(0.14, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(now)
  o.stop(now + 0.13)
}

export function playEmptyClick() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.setValueAtTime(180, now)
  o.frequency.exponentialRampToValueAtTime(60, now + 0.04)
  g.gain.setValueAtTime(0.1, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(now)
  o.stop(now + 0.06)
}
