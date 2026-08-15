import { H } from "./math";

export type EnemyKind = "bee" | "moth" | "boss";

export function glow(ctx: CanvasRenderingContext2D, color: string, blur = 10): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

export function noGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  stars: { x: number; y: number; z: number; c: string }[],
): void {
  for (const s of stars) {
    const a = 0.35 + s.z * 0.65;
    ctx.fillStyle = s.c;
    ctx.globalAlpha = a;
    const size = s.z > 0.7 ? 2 : 1;
    ctx.fillRect(s.x, s.y, size, size);
  }
  ctx.globalAlpha = 1;
}

function strokePoly(ctx: CanvasRenderingContext2D, pts: [number, number][], close = true): void {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
  ctx.stroke();
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dual: boolean,
  flash = false,
  scale = 1,
): void {
  const drawOne = (ox: number) => {
    ctx.save();
    ctx.translate(x + ox, y);
    ctx.scale(scale, scale);
    const color = flash ? "#ffffff" : "#00ffff";
    glow(ctx, color, 14);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    strokePoly(ctx, [
      [0, -12],
      [8, 10],
      [3, 6],
      [0, 9],
      [-3, 6],
      [-8, 10],
    ]);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    strokePoly(ctx, [
      [0, -6],
      [3, 2],
      [-3, 2],
    ]);
    ctx.restore();
  };
  if (dual) {
    drawOne(-11);
    drawOne(11);
  } else {
    drawOne(0);
  }
  noGlow(ctx);
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  angle: number,
  hurt: boolean,
  flap: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  const pal =
    kind === "bee"
      ? { a: "#ffe14a", b: "#ff8a00" }
      : kind === "moth"
        ? { a: "#ff2ea6", b: "#ff8ad8" }
        : { a: "#5cff7a", b: "#00d4ff" };
  const color = hurt ? "#ffffff" : pal.a;
  glow(ctx, color, 12);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;
  const w = 5 + Math.sin(flap) * 2.2;

  if (kind === "bee") {
    strokePoly(ctx, [
      [0, -8],
      [5, -2],
      [5, 6],
      [0, 9],
      [-5, 6],
      [-5, -2],
    ]);
    ctx.strokeStyle = pal.b;
    strokePoly(ctx, [
      [-5, 0],
      [-5 - w, -3],
      [-5, 3],
    ]);
    strokePoly(ctx, [
      [5, 0],
      [5 + w, -3],
      [5, 3],
    ]);
  } else if (kind === "moth") {
    strokePoly(ctx, [
      [0, -9],
      [4, -3],
      [3, 8],
      [0, 6],
      [-3, 8],
      [-4, -3],
    ]);
    ctx.strokeStyle = pal.b;
    strokePoly(ctx, [
      [-3, -1],
      [-8 - w, -6],
      [-7, 4],
      [-3, 3],
    ]);
    strokePoly(ctx, [
      [3, -1],
      [8 + w, -6],
      [7, 4],
      [3, 3],
    ]);
  } else {
    strokePoly(ctx, [
      [0, -11],
      [7, -4],
      [8, 6],
      [3, 10],
      [-3, 10],
      [-8, 6],
      [-7, -4],
    ]);
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-3, -1, 1.4, 0, Math.PI * 2);
    ctx.arc(3, -1, 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = pal.b;
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(-7, -15);
    ctx.moveTo(4, -10);
    ctx.lineTo(7, -15);
    ctx.stroke();
  }
  ctx.restore();
  noGlow(ctx);
}

export function drawBullet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  enemy: boolean,
): void {
  const color = enemy ? "#ff2ea6" : "#ffe14a";
  glow(ctx, color, 10);
  ctx.fillStyle = color;
  if (enemy) {
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x - 1.2, y - 6, 2.4, 10);
  }
  noGlow(ctx);
}

export function drawBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  pulse: number,
): void {
  const h = H - y - 36;
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, `rgba(80,255,180,${0.18 + pulse * 0.12})`);
  grd.addColorStop(1, "rgba(80,255,180,0.02)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + 6, y);
  ctx.lineTo(x + width, y + h);
  ctx.lineTo(x - width, y + h);
  ctx.closePath();
  ctx.fill();
  glow(ctx, "#5cff7a", 16);
  ctx.strokeStyle = "#5cff7a";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  noGlow(ctx);
}

export function drawCapturedShip(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI);
  glow(ctx, "#ff8ad8", 10);
  ctx.strokeStyle = "#ff8ad8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6, 8);
  ctx.lineTo(0, 5);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  noGlow(ctx);
}

export type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
};

export function burst(sparks: Spark[], x: number, y: number, color: string, n = 16): void {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const sp = 40 + Math.random() * 140;
    sparks.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.35 + Math.random() * 0.35,
      max: 0.7,
      color,
    });
  }
}

export function drawSparks(ctx: CanvasRenderingContext2D, sparks: Spark[]): void {
  for (const s of sparks) {
    ctx.globalAlpha = s.life / s.max;
    glow(ctx, s.color, 8);
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - 1.2, s.y - 1.2, 2.4, 2.4);
  }
  ctx.globalAlpha = 1;
  noGlow(ctx);
}

export function pixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
): void {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  glow(ctx, color, 8);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  noGlow(ctx);
}

export function titleFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.font = `${size}px Bungee, Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  glow(ctx, color, 18);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  noGlow(ctx);
}

export function padScore(n: number): string {
  return Math.max(0, Math.floor(n)).toString().padStart(6, "0");
}
