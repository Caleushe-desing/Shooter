let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
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

export function unlockAudio(): void {
  audio();
}

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.06, delay = 0): void {
  const ac = audio();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime + delay;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function playShot(): void {
  beep(220, 0.06, "sawtooth", 0.05);
  beep(880, 0.04, "square", 0.03, 0.01);
}

export function playHit(): void {
  beep(660, 0.05, "square", 0.05);
  beep(990, 0.07, "triangle", 0.04, 0.03);
}

export function playMiss(): void {
  beep(140, 0.05, "triangle", 0.03);
}

export function playStart(): void {
  beep(392, 0.08, "square", 0.05);
  beep(523, 0.08, "square", 0.05, 0.08);
  beep(659, 0.12, "square", 0.06, 0.16);
}

export function playEnd(): void {
  beep(523, 0.1, "square", 0.05);
  beep(392, 0.16, "square", 0.05, 0.12);
}
