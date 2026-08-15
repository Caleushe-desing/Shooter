export type Pt = { x: number; y: number };

export const W = 360;
export const H = 540;

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function dist(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function hit(a: Pt, ar: number, b: Pt, br: number): boolean {
  const r = ar + br;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= r * r;
}

export function polylineLength(pts: readonly Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
  return len;
}

export function followPolyline(
  pts: readonly Pt[],
  t: number,
): { x: number; y: number; angle: number; done: boolean } {
  if (pts.length === 0) return { x: 0, y: 0, angle: 0, done: true };
  if (pts.length === 1 || t >= 1) {
    const p = pts[pts.length - 1];
    const q = pts[Math.max(0, pts.length - 2)];
    return { x: p.x, y: p.y, angle: Math.atan2(p.y - q.y, p.x - q.x), done: t >= 1 };
  }
  const total = polylineLength(pts);
  let walk = Math.max(0, t) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = dist(a, b);
    if (walk <= seg || i === pts.length - 1) {
      const u = seg === 0 ? 1 : clamp(walk / seg, 0, 1);
      return {
        x: lerp(a.x, b.x, u),
        y: lerp(a.y, b.y, u),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        done: false,
      };
    }
    walk -= seg;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, angle: 0, done: true };
}

export function mirrorX(pts: readonly Pt[], cx = W / 2): Pt[] {
  return pts.map((p) => ({ x: cx * 2 - p.x, y: p.y }));
}
