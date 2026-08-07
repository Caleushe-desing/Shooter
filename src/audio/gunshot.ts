/** Procedural gunshot via Web Audio (no asset files). */
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  return audioCtx
}

/** Unlock audio on first user gesture (required by browsers). */
export function unlockAudio() {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
}

export function playGunshot() {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime

  // Body thump
  const thump = ctx.createOscillator()
  const thumpGain = ctx.createGain()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(140, now)
  thump.frequency.exponentialRampToValueAtTime(45, now + 0.12)
  thumpGain.gain.setValueAtTime(0.55, now)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
  thump.connect(thumpGain)
  thumpGain.connect(ctx.destination)
  thump.start(now)
  thump.stop(now + 0.15)

  // Crack / snap
  const crack = ctx.createOscillator()
  const crackGain = ctx.createGain()
  crack.type = 'square'
  crack.frequency.setValueAtTime(920, now)
  crack.frequency.exponentialRampToValueAtTime(180, now + 0.05)
  crackGain.gain.setValueAtTime(0.18, now)
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  crack.connect(crackGain)
  crackGain.connect(ctx.destination)
  crack.start(now)
  crack.stop(now + 0.07)

  // Noise burst (hiss of the shot)
  const duration = 0.12
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const env = 1 - i / bufferSize
    data[i] = (Math.random() * 2 - 1) * env * env
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 1800
  noiseFilter.Q.value = 0.7
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.4, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(now)
}

export function playImpact() {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(220, now)
  o.frequency.exponentialRampToValueAtTime(70, now + 0.08)
  g.gain.setValueAtTime(0.2, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(now)
  o.stop(now + 0.11)
}
