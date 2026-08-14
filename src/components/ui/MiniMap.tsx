import { useEffect, useRef } from "react";
import { NEON_WALLS, SOAP_COLORS, SOAP_NAMES } from "../../constants";
import { engine } from "../../game/instance";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";
import { useHud } from "../../store/gameStore";

const SCALE = 6;

/** Minimapa 3D: laberinto + jugador + enemigos en vivo. */
export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallCache = useRef<HTMLCanvasElement | null>(null);
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);

  useEffect(() => {
    if (status === "menu" || viewMode !== "3d") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    wallCache.current = null;

    const buildWalls = () => {
      const cache = document.createElement("canvas");
      cache.width = canvas.width;
      cache.height = canvas.height;
      const c = cache.getContext("2d")!;
      c.fillStyle = "#050508";
      c.fillRect(0, 0, cache.width, cache.height);
      for (let r = 0; r < ROWS; r++) {
        for (let col = 0; col < COLS; col++) {
          const x = col * SCALE;
          const y = r * SCALE;
          if (isWall(col, r)) {
            c.fillStyle = NEON_WALLS[(col + r * 3) % NEON_WALLS.length];
            c.globalAlpha = 0.55;
            c.fillRect(x, y, SCALE, SCALE);
            c.globalAlpha = 1;
          } else if (isDoor(col, r)) {
            c.fillStyle = "#aa00ff";
            c.fillRect(x, y, SCALE, SCALE * 0.35);
          }
        }
      }
      wallCache.current = cache;
    };
    buildWalls();

    let raf = 0;
    let last = 0;
    const interval = 1000 / 20;

    const drawActor = (
      col: number,
      row: number,
      color: string,
      kind: "player" | "enemy" | "scared" | "eyes",
    ) => {
      const cx = col * SCALE + SCALE / 2;
      const cy = row * SCALE + SCALE / 2;
      if (kind === "player") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, SCALE * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // flecha de rumbo
        const dir = engine.player.dir;
        const ang =
          dir === "up" ? -Math.PI / 2 : dir === "down" ? Math.PI / 2 : dir === "left" ? Math.PI : 0;
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 4, cy + Math.sin(ang) * 4);
        ctx.lineTo(cx + Math.cos(ang + 2.4) * 3, cy + Math.sin(ang + 2.4) * 3);
        ctx.lineTo(cx + Math.cos(ang - 2.4) * 3, cy + Math.sin(ang - 2.4) * 3);
        ctx.closePath();
        ctx.fill();
        return;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, kind === "eyes" ? SCALE * 0.28 : SCALE * 0.4, 0, Math.PI * 2);
      ctx.fill();
      if (kind === "scared") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (kind !== "eyes") {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < interval) return;
      last = now;
      if (!wallCache.current) buildWalls();
      ctx.drawImage(wallCache.current!, 0, 0);

      // pellets suaves (referencia)
      ctx.fillStyle = "#ffff0088";
      for (const k of engine.pellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.fillRect(c * SCALE + 2, r * SCALE + 2, 2, 2);
      }
      ctx.fillStyle = "#00ff66";
      for (const k of engine.powerPellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.beginPath();
        ctx.arc(c * SCALE + SCALE / 2, r * SCALE + SCALE / 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const g of engine.ghosts) {
        const kind =
          g.mode === "frightened" ? "scared" : g.mode === "eaten" ? "eyes" : "enemy";
        const color =
          kind === "scared" ? "#aa00ff" : kind === "eyes" ? "#ffffff" : SOAP_COLORS[g.id];
        drawActor(g.col, g.row, color, kind);
      }

      const p = engine.player;
      drawActor(p.col, p.row, "#ffcc00", "player");
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [status, viewMode]);

  if (status === "menu" || viewMode !== "3d") return null;

  return (
    <div className="mt-2 inline-flex flex-col items-start gap-1">
      <div className="text-[9px] font-black tracking-widest text-[#00ffff]">MAPA · ENEMIGOS</div>
      <canvas
        ref={canvasRef}
        width={COLS * SCALE}
        height={ROWS * SCALE}
        className="rounded-none border-2 border-[#00ffff] shadow-[0_0_14px_#ff00aa] bg-black w-32 md:w-40 h-auto"
      />
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-black tracking-wide max-w-[10rem] md:max-w-[11rem]">
        <span className="text-[#ffcc00]">● VOS</span>
        <span style={{ color: SOAP_COLORS.blinky }}>● {SOAP_NAMES.blinky}</span>
        <span style={{ color: SOAP_COLORS.pinky }}>● {SOAP_NAMES.pinky}</span>
        <span style={{ color: SOAP_COLORS.inky }}>● {SOAP_NAMES.inky}</span>
        <span style={{ color: SOAP_COLORS.clyde }}>● {SOAP_NAMES.clyde}</span>
      </div>
    </div>
  );
}
