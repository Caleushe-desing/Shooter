/**
 * Procedural audio engine (Web Audio API).
 *
 * Every sound is synthesised at runtime, so the game ships no audio files and
 * works offline. The context is only created after a user gesture because
 * browsers block autoplay.
 */

type Buses = {
  ctx: AudioContext
  master: GainNode
  music: GainNode
  sfx: GainNode
  reverb: ConvolverNode
  noise: AudioBuffer
}

const MINOR_PENTATONIC = [220, 261.63, 293.66, 329.63, 392.0, 440.0]

/** Am · F · Dm · E — a slow, unresolved loop that keeps the tension up. */
const PROGRESSION: number[][] = [
  [110.0, 130.81, 164.81],
  [87.31, 110.0, 130.81],
  [73.42, 87.31, 110.0],
  [82.41, 103.83, 123.47],
]

function makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

function makeImpulseResponse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return buffer
}

class GameAudio {
  private buses: Buses | null = null
  private musicTimer: number | null = null
  private nextChordTime = 0
  private nextNoteTime = 0
  private chordIndex = 0
  private musicVolume = 0.5
  private sfxVolume = 0.75
  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = []
  private lastPlayed = new Map<string, number>()

  /** Rate-limits sounds that can be requested many times per second. */
  private throttled(key: string, minGapMs: number) {
    const now = performance.now()
    const last = this.lastPlayed.get(key) ?? 0
    if (now - last < minGapMs) return true
    this.lastPlayed.set(key, now)
    return false
  }

  /** Safe to call repeatedly; only the first gesture actually boots audio. */
  start() {
    if (this.buses) {
      void this.buses.ctx.resume()
      return
    }

    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return

    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)

    const reverb = ctx.createConvolver()
    reverb.buffer = makeImpulseResponse(ctx, 2.4, 2.6)
    const reverbGain = ctx.createGain()
    reverbGain.gain.value = 0.55
    reverb.connect(reverbGain)
    reverbGain.connect(master)

    const music = ctx.createGain()
    music.gain.value = this.musicVolume
    music.connect(master)
    music.connect(reverb)

    const sfx = ctx.createGain()
    sfx.gain.value = this.sfxVolume
    sfx.connect(master)

    this.buses = { ctx, master, music, sfx, reverb, noise: makeNoiseBuffer(ctx, 2) }
    void ctx.resume()
    this.startMusic()
  }

  setMusicVolume(value: number) {
    this.musicVolume = Math.min(1, Math.max(0, value))
    if (this.buses) this.buses.music.gain.value = this.musicVolume
  }

  setSfxVolume(value: number) {
    this.sfxVolume = Math.min(1, Math.max(0, value))
    if (this.buses) this.buses.sfx.gain.value = this.sfxVolume
  }

  private noiseSource(buses: Buses, duration: number) {
    const src = buses.ctx.createBufferSource()
    src.buffer = buses.noise
    src.loop = true
    src.playbackRate.value = 0.8 + Math.random() * 0.4
    src.start()
    src.stop(buses.ctx.currentTime + duration)
    return src
  }

  /** Sharp revolver crack: transient click, noise body and a low thump. */
  gunshot() {
    const buses = this.buses
    if (!buses) return
    const { ctx, sfx } = buses
    const t = ctx.currentTime

    const bodyGain = ctx.createGain()
    bodyGain.gain.setValueAtTime(0.9, t)
    bodyGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.22)

    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(1800, t)
    bandpass.frequency.exponentialRampToValueAtTime(320, t + 0.2)
    bandpass.Q.value = 0.8

    const noise = this.noiseSource(buses, 0.26)
    noise.connect(bandpass)
    bandpass.connect(bodyGain)
    bodyGain.connect(sfx)

    const thump = ctx.createOscillator()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(190, t)
    thump.frequency.exponentialRampToValueAtTime(48, t + 0.16)
    const thumpGain = ctx.createGain()
    thumpGain.gain.setValueAtTime(0.75, t)
    thumpGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.2)
    thump.connect(thumpGain)
    thumpGain.connect(sfx)
    thump.start(t)
    thump.stop(t + 0.22)

    const crack = ctx.createOscillator()
    crack.type = 'square'
    crack.frequency.setValueAtTime(1400, t)
    const crackGain = ctx.createGain()
    crackGain.gain.setValueAtTime(0.18, t)
    crackGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.04)
    crack.connect(crackGain)
    crackGain.connect(sfx)
    crack.start(t)
    crack.stop(t + 0.05)
  }

  /** Wet impact plus a falling groan when a hostile goes down. */
  enemyDown(head: boolean) {
    const buses = this.buses
    if (!buses) return
    const { ctx, sfx, reverb } = buses
    const t = ctx.currentTime

    const splatFilter = ctx.createBiquadFilter()
    splatFilter.type = 'lowpass'
    splatFilter.frequency.setValueAtTime(head ? 2600 : 1300, t)
    splatFilter.frequency.exponentialRampToValueAtTime(200, t + 0.3)

    const splatGain = ctx.createGain()
    splatGain.gain.setValueAtTime(head ? 0.85 : 0.6, t)
    splatGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.34)

    const noise = this.noiseSource(buses, 0.36)
    noise.connect(splatFilter)
    splatFilter.connect(splatGain)
    splatGain.connect(sfx)
    splatGain.connect(reverb)

    const groan = ctx.createOscillator()
    groan.type = 'sawtooth'
    groan.frequency.setValueAtTime(head ? 320 : 210, t)
    groan.frequency.exponentialRampToValueAtTime(52, t + 0.55)
    const groanFilter = ctx.createBiquadFilter()
    groanFilter.type = 'lowpass'
    groanFilter.frequency.value = 900
    const groanGain = ctx.createGain()
    groanGain.gain.setValueAtTime(0.0001, t)
    groanGain.gain.exponentialRampToValueAtTime(0.34, t + 0.03)
    groanGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.6)
    groan.connect(groanFilter)
    groanFilter.connect(groanGain)
    groanGain.connect(sfx)
    groanGain.connect(reverb)
    groan.start(t)
    groan.stop(t + 0.62)
  }

  /** Dry puff of a bullet punching through styrofoam. */
  foamPierce() {
    const buses = this.buses
    if (!buses || this.throttled('foam', 60)) return
    const { ctx, sfx } = buses
    const t = ctx.currentTime

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2400
    filter.Q.value = 1.4

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.0006, t + 0.09)

    const noise = this.noiseSource(buses, 0.1)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(sfx)
  }

  /** Muffled hit while a hostile is grabbing the player. */
  playerHurt() {
    const buses = this.buses
    if (!buses || this.throttled('hurt', 420)) return
    const { ctx, sfx } = buses
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, t)
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.25)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 600
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, t)
    gain.gain.exponentialRampToValueAtTime(0.0006, t + 0.28)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(sfx)
    osc.start(t)
    osc.stop(t + 0.3)
  }

  /** Long descending swell when the horde takes the player down. */
  caught() {
    const buses = this.buses
    if (!buses) return
    const { ctx, sfx, reverb } = buses
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(240, t)
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.6)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, t)
    filter.frequency.exponentialRampToValueAtTime(180, t + 1.6)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0006, t + 1.7)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(sfx)
    gain.connect(reverb)
    osc.start(t)
    osc.stop(t + 1.75)
  }

  /** Short rising motif when a wave is finished. */
  waveCleared() {
    const buses = this.buses
    if (!buses) return
    const { ctx, sfx, reverb } = buses
    const t = ctx.currentTime

    ;[329.63, 392.0, 523.25].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      const at = t + i * 0.13
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.32, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0005, at + 0.7)
      osc.connect(gain)
      gain.connect(sfx)
      gain.connect(reverb)
      osc.start(at)
      osc.stop(at + 0.72)
    })
  }

  private startMusic() {
    const buses = this.buses
    if (!buses || this.musicTimer != null) return

    this.nextChordTime = buses.ctx.currentTime + 0.15
    this.nextNoteTime = buses.ctx.currentTime + 1.2

    // Constant low wind bed under the pad.
    const wind = this.noiseSource(buses, 60 * 60)
    const windFilter = buses.ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 320
    windFilter.Q.value = 0.6
    const windGain = buses.ctx.createGain()
    windGain.gain.value = 0.05
    wind.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(buses.music)

    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 250)
    this.scheduleMusic()
  }

  private scheduleMusic() {
    const buses = this.buses
    if (!buses) return
    const { ctx } = buses
    const lookahead = ctx.currentTime + 1.5

    while (this.nextChordTime < lookahead) {
      this.scheduleChord(buses, this.nextChordTime)
      this.nextChordTime += 7.5
    }

    while (this.nextNoteTime < lookahead) {
      // Sparse, unpredictable notes read as "mysterious" rather than melodic.
      if (Math.random() < 0.55) this.scheduleNote(buses, this.nextNoteTime)
      this.nextNoteTime += 1.5 + Math.random() * 1.5
    }
  }

  private scheduleChord(buses: Buses, at: number) {
    const { ctx, music } = buses
    const chord = PROGRESSION[this.chordIndex % PROGRESSION.length]
    this.chordIndex++

    // Retire voices from the previous chord.
    this.musicNodes = this.musicNodes.filter(({ osc, gain }) => {
      gain.gain.cancelScheduledValues(at)
      gain.gain.setValueAtTime(gain.gain.value, at)
      gain.gain.exponentialRampToValueAtTime(0.0005, at + 2.4)
      osc.stop(at + 2.6)
      return false
    })

    for (const freq of chord) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = freq
        osc.detune.value = detune

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(320, at)
        filter.frequency.linearRampToValueAtTime(760, at + 4)
        filter.frequency.linearRampToValueAtTime(300, at + 7.5)
        filter.Q.value = 3

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(0.06, at + 2.2)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(music)
        osc.start(at)
        this.musicNodes.push({ osc, gain })
      }
    }

    // Sub pulse marking the chord change.
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = chord[0] / 2
    const subGain = ctx.createGain()
    subGain.gain.setValueAtTime(0.0001, at)
    subGain.gain.exponentialRampToValueAtTime(0.18, at + 0.6)
    subGain.gain.exponentialRampToValueAtTime(0.0005, at + 5)
    sub.connect(subGain)
    subGain.connect(music)
    sub.start(at)
    sub.stop(at + 5.2)
  }

  private scheduleNote(buses: Buses, at: number) {
    const { ctx, music, reverb } = buses
    const freq = MINOR_PENTATONIC[Math.floor(Math.random() * MINOR_PENTATONIC.length)]

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq * (Math.random() > 0.7 ? 2 : 1)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.11, at + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0004, at + 2.2)

    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.42
    const feedback = ctx.createGain()
    feedback.gain.value = 0.35
    delay.connect(feedback)
    feedback.connect(delay)

    osc.connect(gain)
    gain.connect(music)
    gain.connect(delay)
    delay.connect(reverb)

    osc.start(at)
    osc.stop(at + 2.3)
  }
}

export const audio = new GameAudio()
