let ctx: AudioContext | null = null;
let muted = false;
let wakaHigh = true;
let sirenUntil = 0;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function unlockAudio(): void {
  audio();
}

function beep(freq: number, duration: number, type: OscillatorType, gain = 0.08, delay = 0): void {
  const ac = audio();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime + delay;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** Procedural fart: filtered noise + falling low buzz. */
function playFart(): void {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime;

  const seconds = 0.55;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // Brown-ish noise (smoother / “wetter” than white).
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 2.2;
  filter.frequency.setValueAtTime(420, t0);
  filter.frequency.exponentialRampToValueAtTime(90, t0 + 0.45);

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.55, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.22);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.52);

  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start(t0);
  src.stop(t0 + seconds);

  // Low “brrrp” layer.
  const osc = ac.createOscillator();
  const og = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, t0);
  osc.frequency.exponentialRampToValueAtTime(48, t0 + 0.4);
  og.gain.setValueAtTime(0.0001, t0);
  og.gain.exponentialRampToValueAtTime(0.12, t0 + 0.03);
  og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
  osc.connect(og);
  og.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + 0.45);
}

export function playWaka(): void {
  beep(wakaHigh ? 740 : 520, 0.07, "square", 0.05);
  wakaHigh = !wakaHigh;
}

export function playPower(): void {
  sirenUntil = performance.now() + 6400;
  playFart();
}

export function playEatGhost(): void {
  beep(520, 0.08, "square", 0.07);
  beep(780, 0.1, "square", 0.07, 0.08);
  beep(1040, 0.14, "square", 0.06, 0.16);
}

export function playDeath(): void {
  beep(440, 0.12, "triangle", 0.08);
  beep(330, 0.14, "triangle", 0.07, 0.12);
  beep(220, 0.18, "triangle", 0.06, 0.26);
  beep(110, 0.32, "sine", 0.05, 0.42);
}

export function playStart(): void {
  beep(392, 0.12, "square", 0.07);
  beep(523, 0.12, "square", 0.07, 0.12);
  beep(659, 0.12, "square", 0.07, 0.24);
  beep(784, 0.22, "square", 0.08, 0.36);
}

export function playWin(): void {
  beep(523, 0.1, "square", 0.06);
  beep(659, 0.1, "square", 0.06, 0.1);
  beep(784, 0.1, "square", 0.06, 0.2);
  beep(1046, 0.24, "square", 0.07, 0.32);
}

export function playSirenTick(): void {
  if (muted || performance.now() > sirenUntil) return;
  beep(140, 0.12, "sine", 0.03);
}

export function playReady(): void {
  beep(660, 0.09, "square", 0.05);
  beep(880, 0.12, "square", 0.05, 0.1);
}
