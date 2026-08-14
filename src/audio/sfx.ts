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

/** Bocina de micro + chillido: el completo te prende. */
function playCompletoPower(): void {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime;
  // bocina grave
  beep(180, 0.18, "sawtooth", 0.09, 0);
  beep(140, 0.22, "sawtooth", 0.07, 0.05);
  // chillido callejero
  beep(880, 0.08, "square", 0.05, 0.2);
  beep(1175, 0.1, "square", 0.05, 0.28);
  void t0;
}

export function playWaka(): void {
  beep(wakaHigh ? 740 : 520, 0.07, "square", 0.05);
  wakaHigh = !wakaHigh;
}

export function playPower(): void {
  sirenUntil = performance.now() + 6400;
  playCompletoPower();
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
