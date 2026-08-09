/**
 * Real concrete footstep samples (Kenney Impact Sounds, CC0).
 * Synced to Mixamo walk/run cycle phases — not a fixed timer.
 */
import { loadAudioBuffer, playBuffer, prefetchAudio, unlockAudio } from './context'

export type FootstepKind = 'walk' | 'run'

const STEP_URLS = [
  '/audio/footstep_concrete_000.ogg',
  '/audio/footstep_concrete_001.ogg',
  '/audio/footstep_concrete_002.ogg',
  '/audio/footstep_concrete_003.ogg',
  '/audio/footstep_concrete_004.ogg',
] as const

const buffers: (AudioBuffer | null)[] = []
let nextStep = 0

export function prefetchFootsteps() {
  prefetchAudio(STEP_URLS)
  void Promise.all(STEP_URLS.map((u) => loadAudioBuffer(u))).then((bufs) => {
    for (let i = 0; i < bufs.length; i++) buffers[i] = bufs[i]
  })
}

prefetchFootsteps()

/**
 * Play one real foot plant. `distance` attenuates distant enemies (meters).
 * Pass 0 for the local player.
 */
export function playFootstep(kind: FootstepKind = 'walk', distance = 0) {
  unlockAudio()

  const distGain = distance <= 0 ? 1 : Math.max(0, 1 - distance / 26)
  if (distGain < 0.05) return

  const i = nextStep % STEP_URLS.length
  nextStep++
  const cached = buffers[i]
  if (cached) {
    const run = kind === 'run'
    playBuffer(cached, {
      gain: (run ? 0.95 : 0.72) * distGain,
      playbackRate: (run ? 1.05 : 0.96) + (Math.random() * 0.08 - 0.04),
    })
    return
  }

  void loadAudioBuffer(STEP_URLS[i]).then((buffer) => {
    if (!buffer) return
    buffers[i] = buffer
    const run = kind === 'run'
    playBuffer(buffer, {
      gain: (run ? 0.95 : 0.72) * distGain,
      playbackRate: (run ? 1.05 : 0.96) + (Math.random() * 0.08 - 0.04),
    })
  })
}

/**
 * Sync footsteps to an AnimationAction cycle.
 * Mixamo walk/run plant near ~0.12 and ~0.62 of the loop.
 */
export function createAnimFootstepSync(phases: number[] = [0.12, 0.62]) {
  let lastPhase = -1
  return {
    update(
      action: { time: number; getClip: () => { duration: number } } | null | undefined,
      moving: boolean,
      kind: FootstepKind,
      play: (kind: FootstepKind) => void,
    ) {
      if (!action || !moving) {
        lastPhase = -1
        return
      }
      const dur = action.getClip().duration
      if (dur <= 1e-4) return
      const phase = (action.time % dur) / dur
      if (lastPhase >= 0) {
        for (const p of phases) {
          const crossed =
            phase >= lastPhase
              ? lastPhase < p && phase >= p
              : lastPhase < p || phase >= p
          if (crossed) play(kind)
        }
      }
      lastPhase = phase
    },
    reset() {
      lastPhase = -1
    },
  }
}
