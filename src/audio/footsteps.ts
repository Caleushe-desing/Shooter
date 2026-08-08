/** Procedural footsteps via Web Audio (no asset files). */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  return audioCtx
}

export type FootstepKind = 'walk' | 'run'

/**
 * Short dusty thud. `distance` attenuates distant enemy steps (meters).
 * Pass distance=0 for the local player.
 */
export function playFootstep(kind: FootstepKind = 'walk', distance = 0) {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  // Soft distance falloff — silent past ~28 m.
  const distGain = distance <= 0 ? 1 : Math.max(0, 1 - distance / 28)
  if (distGain < 0.04) return

  const now = ctx.currentTime
  const run = kind === 'run'
  const base = (run ? 0.22 : 0.14) * distGain

  // Low body thud
  const thump = ctx.createOscillator()
  const thumpGain = ctx.createGain()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(run ? 110 : 90, now)
  thump.frequency.exponentialRampToValueAtTime(48, now + 0.07)
  thumpGain.gain.setValueAtTime(base * 0.85, now)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
  thump.connect(thumpGain)
  thumpGain.connect(ctx.destination)
  thump.start(now)
  thump.stop(now + 0.1)

  // Noise scuff (gravel / boot)
  const duration = run ? 0.07 : 0.09
  const n = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < n; i++) {
    const env = 1 - i / n
    data[i] = (Math.random() * 2 - 1) * env * env
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = run ? 650 : 480
  filter.Q.value = 0.85
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(base * 0.7, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  noise.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(now)
}

/** Cadence helper — call each frame while moving on the ground. */
export function createFootstepClock(intervalWalk = 0.38, intervalRun = 0.26) {
  let acc = 0
  return {
    tick(dt: number, moving: boolean, running: boolean, play: (kind: FootstepKind) => void) {
      if (!moving) {
        acc = 0
        return
      }
      acc += dt
      const interval = running ? intervalRun : intervalWalk
      if (acc >= interval) {
        acc -= interval
        play(running ? 'run' : 'walk')
      }
    },
    reset() {
      acc = 0
    },
  }
}
