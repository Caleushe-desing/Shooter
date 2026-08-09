/**
 * Real pistol samples (Mixkit free SFX) + light procedural UI cues.
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
  '/audio/pistol_1659.ogg',
  '/audio/pistol_1665.ogg',
  '/audio/pistol_1668.ogg',
  '/audio/pistol_1670.ogg',
  '/audio/pistol_223.ogg',
] as const

const pistolBuffers: (AudioBuffer | null)[] = []
let pistolIndex = 0

prefetchAudio(PISTOL_URLS)
void Promise.all(PISTOL_URLS.map((u) => loadAudioBuffer(u))).then((bufs) => {
  for (let i = 0; i < bufs.length; i++) pistolBuffers[i] = bufs[i]
})

/** Loud real pistol crack. */
export function playGunshot() {
  unlockAudio()
  const ctx = getAudioContext()
  if (!ctx) return

  const i = pistolIndex % PISTOL_URLS.length
  pistolIndex++
  const cached = pistolBuffers[i]
  if (cached) {
    playBuffer(cached, {
      gain: 1.9,
      playbackRate: 0.96 + Math.random() * 0.1,
    })
    return
  }

  void loadAudioBuffer(PISTOL_URLS[i]).then((buffer) => {
    if (!buffer) {
      playProceduralFallback()
      return
    }
    pistolBuffers[i] = buffer
    playBuffer(buffer, {
      gain: 1.9,
      playbackRate: 0.96 + Math.random() * 0.1,
    })
  })
}

function playProceduralFallback() {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  const thump = ctx.createOscillator()
  const thumpGain = ctx.createGain()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(140, now)
  thump.frequency.exponentialRampToValueAtTime(45, now + 0.12)
  thumpGain.gain.setValueAtTime(0.7, now)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
  thump.connect(thumpGain)
  thumpGain.connect(ctx.destination)
  thump.start(now)
  thump.stop(now + 0.15)
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

export function playOrbPickup() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(880, now)
  o.frequency.exponentialRampToValueAtTime(1320, now + 0.08)
  g.gain.setValueAtTime(0.16, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(now)
  o.stop(now + 0.2)
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
