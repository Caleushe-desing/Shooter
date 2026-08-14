import { useEffect, useRef } from "react";
import { SOAP_COLORS } from "../../constants";
import { engine } from "../../game/instance";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";
import { LOW_GFX } from "../../perf";
import { useHud } from "../../store/gameStore";

const SCALE = 5;

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallCache = useRef<HTMLCanvasElement | null>(null);
  const status = useHud((s) => s.status);

  useEffect(() => {
    if (status === "menu" || LOW_GFX) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    if (!wallCache.current) {
      const cache = document.createElement("canvas");
      cache.width = canvas.width;
      cache.height = canvas.height;
      const c = cache.getContext("2d")!;
      c.fillStyle = "rgba(7, 11, 18, 0.88)";
      c.fillRect(0, 0, cache.width, cache.height);
      for (let r = 0; r < ROWS; r++) {
        for (let col = 0; col < COLS; col++) {
          const x = col * SCALE;
          const y = r * SCALE;
          if (isWall(col, r)) {
            c.fillStyle = "#cfe0ff";
            c.fillRect(x, y, SCALE, SCALE);
          } else if (isDoor(col, r)) {
            c.fillStyle = "#00e5ff";
            c.fillRect(x, y, SCALE, SCALE);
          }
        }
      }
      wallCache.current = cache;
    }

    let raf = 0;
    let last = 0;
    const interval = 1000 / 12; // 12 fps is enough for the mini-map

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < interval) return;
      last = now;
      ctx.drawImage(wallCache.current!, 0, 0);
      for (const k of engine.pellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.fillStyle = "#8b4518";
        ctx.fillRect(c * SCALE + 2, r * SCALE + 2, 2, 2);
      }
      for (const k of engine.powerPellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.fillStyle = "#ff8c2a";
        ctx.fillRect(c * SCALE + 1, r * SCALE + 1, 3, 3);
      }
      const p = engine.player;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.col * SCALE + 1, p.row * SCALE + 1, SCALE - 2, SCALE - 2);
      for (const g of engine.ghosts) {
        ctx.fillStyle =
          g.mode === "frightened" ? "#00e5ff" : g.mode === "eaten" ? "#ffffff" : SOAP_COLORS[g.id];
        ctx.fillRect(g.col * SCALE + 1, g.row * SCALE + 1, SCALE - 2, SCALE - 2);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  if (status === "menu" || LOW_GFX) return null;

  return (
    <canvas
      ref={canvasRef}
      width={COLS * SCALE}
      height={ROWS * SCALE}
      className="rounded-2xl border border-[#b8ff3c]/40 shadow-[0_0_14px_rgba(184,255,60,0.2)] w-28 md:w-36 h-auto"
    />
  );
}
