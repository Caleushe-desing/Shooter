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
      c.fillStyle = "rgba(9, 6, 20, 0.9)";
      c.fillRect(0, 0, cache.width, cache.height);
      for (let r = 0; r < ROWS; r++) {
        for (let col = 0; col < COLS; col++) {
          const x = col * SCALE;
          const y = r * SCALE;
          if (isWall(col, r)) {
            const palette = ["#ff2d95", "#00d4c8", "#ffe600", "#7c5cff"];
            c.fillStyle = palette[(col + r) % palette.length];
            c.fillRect(x, y, SCALE, SCALE);
          } else if (isDoor(col, r)) {
            c.fillStyle = "#7c5cff";
            c.fillRect(x, y, SCALE, SCALE);
          }
        }
      }
      wallCache.current = cache;
    }

    let raf = 0;
    let last = 0;
    const interval = 1000 / 12;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < interval) return;
      last = now;
      ctx.drawImage(wallCache.current!, 0, 0);
      for (const k of engine.pellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.fillStyle = "#ffe600";
        ctx.fillRect(c * SCALE + 2, r * SCALE + 2, 2, 2);
      }
      for (const k of engine.powerPellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.fillStyle = "#7cfc00";
        ctx.fillRect(c * SCALE + 1, r * SCALE + 1, 3, 3);
      }
      const p = engine.player;
      ctx.fillStyle = "#f4c27a";
      ctx.fillRect(p.col * SCALE + 1, p.row * SCALE + 1, SCALE - 2, SCALE - 2);
      for (const g of engine.ghosts) {
        ctx.fillStyle =
          g.mode === "frightened" ? "#7c5cff" : g.mode === "eaten" ? "#ffffff" : SOAP_COLORS[g.id];
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
      className="rounded-none border-2 border-[#ff2d95] shadow-[0_0_16px_rgba(255,45,149,0.35)] w-28 md:w-36 h-auto"
    />
  );
}
