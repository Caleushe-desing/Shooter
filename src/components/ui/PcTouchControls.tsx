import { useRef } from "react";
import { engine } from "../../game/instance";
import type { Dir } from "../../game/types";
import { useHud } from "../../store/gameStore";

/** Umbral de gesto — mismo “toque de tecla” que en PC. */
const SWIPE_PX = 28;

function screenDirFromDelta(dx: number, dy: number): Dir | null {
  if (Math.hypot(dx, dy) < SWIPE_PX) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/**
 * Celular = mismo que PC: desliz = flechas/WASD.
 * Sin mando. Mueve al jugador (no gira la cámara).
 * Izquierda → el quiltro va a la izquierda, etc.
 */
export function PcTouchControls() {
  const status = useHud((s) => s.status);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const committed = useRef(false);

  if (status === "menu" || status === "gameover") return null;

  const commit = (dx: number, dy: number) => {
    if (committed.current) return;
    const dir = screenDirFromDelta(dx, dy);
    if (!dir) return;
    committed.current = true;
    useHud.getState().setMobileDir(dir);
    engine.setInput(dir);
  };

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Deslizá para mover al jugador (como flechas del PC)"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        origin.current = { x: e.clientX, y: e.clientY };
        committed.current = false;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) return;
        e.preventDefault();
        commit(e.clientX - origin.current.x, e.clientY - origin.current.y);
      }}
      onPointerUp={(e) => {
        if (pointerId.current !== e.pointerId) return;
        commit(e.clientX - origin.current.x, e.clientY - origin.current.y);
        pointerId.current = null;
        committed.current = false;
        useHud.getState().setMobileDir(null);
      }}
      onPointerCancel={() => {
        pointerId.current = null;
        committed.current = false;
        useHud.getState().setMobileDir(null);
      }}
    />
  );
}
