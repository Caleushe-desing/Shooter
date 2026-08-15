let ctx: AudioContext | null = null;
let muted = false;
let musicTimer = 0;
let musicStep = 0;

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

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

export function unlockAudio(): void {
  audio();
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType,
  gain = 0.07,
  delay = 0,
): void {
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
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export function playShot(): void {
  beep(880, 0.05, "square", 0.045);
  beep(1320, 0.04, "square", 0.03, 0.02);
}

export function playEnemyShot(): void {
  beep(220, 0.08, "sawtooth", 0.04);
}

export function playHit(): void {
  beep(160, 0.07, "triangle", 0.06);
  beep(90, 0.1, "sawtooth", 0.04, 0.03);
}

export function playExplode(): void {
  beep(140, 0.12, "sawtooth", 0.07);
  beep(90, 0.18, "square", 0.05, 0.04);
  beep(50, 0.22, "triangle", 0.04, 0.1);
}

export function playDeath(): void {
  beep(440, 0.1, "square", 0.07);
  beep(330, 0.12, "square", 0.06, 0.1);
  beep(220, 0.16, "triangle", 0.05, 0.22);
  beep(110, 0.28, "sine", 0.05, 0.38);
}

export function playStart(): void {
  beep(392, 0.1, "square", 0.06);
  beep(523, 0.1, "square", 0.06, 0.1);
  beep(659, 0.1, "square", 0.06, 0.2);
  beep(784, 0.2, "square", 0.07, 0.3);
}

export function playStage(): void {
  beep(523, 0.08, "square", 0.05);
  beep(659, 0.08, "square", 0.05, 0.09);
  beep(784, 0.16, "square", 0.06, 0.18);
}

export function playCapture(): void {
  beep(300, 0.2, "sine", 0.06);
  beep(240, 0.24, "sine", 0.05, 0.16);
  beep(180, 0.3, "sine", 0.05, 0.34);
}

export function playRescue(): void {
  beep(659, 0.08, "square", 0.06);
  beep(784, 0.08, "square", 0.06, 0.08);
  beep(988, 0.08, "square", 0.06, 0.16);
  beep(1175, 0.18, "square", 0.07, 0.24);
}

export function playBonus(): void {
  beep(784, 0.08, "square", 0.05);
  beep(988, 0.08, "square", 0.05, 0.08);
  beep(1175, 0.08, "square", 0.05, 0.16);
  beep(1568, 0.2, "square", 0.06, 0.24);
}

export function playExtraLife(): void {
  beep(880, 0.08, "square", 0.06);
  beep(1175, 0.1, "square", 0.06, 0.1);
  beep(1760, 0.16, "square", 0.07, 0.2);
}

export function playBeam(): void {
  beep(180, 0.35, "sine", 0.035);
  beep(240, 0.35, "sine", 0.025, 0.05);
}

const BASS = [98, 98, 110, 98, 87, 87, 82, 98];
const LEAD = [392, 0, 494, 392, 587, 0, 494, 330];

export function tickMusic(dt: number, playing: boolean): void {
  if (!playing || muted) return;
  musicTimer += dt;
  if (musicTimer < 0.22) return;
  musicTimer = 0;
  const i = musicStep % BASS.length;
  beep(BASS[i], 0.16, "triangle", 0.028);
  if (LEAD[i] > 0 && musicStep % 2 === 0) beep(LEAD[i], 0.1, "square", 0.018, 0.02);
  musicStep++;
}

export function resetMusic(): void {
  musicTimer = 0;
  musicStep = 0;
}
