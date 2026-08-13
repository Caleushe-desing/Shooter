import { useEffect, useRef } from "react";
import { SOAP_COLORS } from "../../constants";
import { engine } from "../../game/instance";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";
import { useHud } from "../../store/gameStore";

const SCALE = 6;

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const status = useHud((s) => s.status);
  const remaining = useHud((s) => s.remaining);
  const ghostPhase = useHud((s) => s.ghostPhase);

  useEffect(() => {
    if (status === "menu") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(20, 12, 10, 0.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * SCALE;
          const y = r * SCALE;
          if (isWall(c, r)) {
            ctx.fillStyle = "#d7e6ea";
            ctx.fillRect(x, y, SCALE, SCALE);
          } else if (isDoor(c, r)) {
            ctx.fillStyle = "#7ec8e8";
            ctx.fillRect(x, y, SCALE, SCALE);
          }
        }
      }
      for (const k of engine.pellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.fillStyle = "#6b3a1f";
        ctx.fillRect(c * SCALE + 2, r * SCALE + 2, 2, 2);
      }
      for (const k of engine.powerPellets) {
        const [c, r] = k.split(",").map(Number);
        ctx.fillStyle = "#c47a3a";
        ctx.beginPath();
        ctx.arc(c * SCALE + SCALE / 2, r * SCALE + SCALE / 2, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      const p = engine.player;
      ctx.fillStyle = "#f7f4ee";
      ctx.beginPath();
      ctx.arc(p.col * SCALE + SCALE / 2, p.row * SCALE + SCALE / 2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      for (const g of engine.ghosts) {
        ctx.fillStyle = g.mode === "frightened" ? "#9ad7ff" : g.mode === "eaten" ? "#ffffff" : SOAP_COLORS[g.id];
        ctx.fillRect(g.col * SCALE + 1, g.row * SCALE + 1, SCALE - 2, SCALE - 2);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [status, remaining, ghostPhase]);

  if (status === "menu") return null;

  return (
    <canvas
      ref={canvasRef}
      width={COLS * SCALE}
      height={ROWS * SCALE}
      className="rounded-lg border border-white/20 shadow-lg w-28 md:w-36 h-auto"
    />
  );
}
