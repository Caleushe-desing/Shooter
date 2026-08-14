import { useCallback, useRef } from "react";
import type { Dir } from "../../game/types";
import { useHud } from "../../store/gameStore";

interface TouchControlsProps {
  onDir: (dir: Dir) => void;
}

/** Distancia mínima de desliz para registrar dirección. */
const SWIPE_PX = 22;

function dirFromDelta(dx: number, dy: number): Dir | null {
  if (Math.hypot(dx, dy) < SWIPE_PX) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/**
 * Control táctil a pantalla completa: deslizá el dedo (sin stick).
 * Cada swipe/cola de arrastre encola la dirección como en Pac-Man.
 */
export function TouchControls({ onDir }: TouchControlsProps) {
  const status = useHud((s) => s.status);
  const setMobileDir = useHud((s) => s.setMobileDir);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const lastDir = useRef<Dir | null>(null);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - origin.current.x;
      const dy = clientY - origin.current.y;
      const dir = dirFromDelta(dx, dy);
      if (!dir) return;
      origin.current = { x: clientX, y: clientY };
      lastDir.current = dir;
      setMobileDir(dir);
      onDir(dir);
    },
    [onDir, setMobileDir],
  );

  const end = useCallback(() => {
    pointerId.current = null;
    lastDir.current = null;
    // El personaje sigue con su última dirección; no forzamos input.
    setMobileDir(null);
  }, [setMobileDir]);

  if (status === "menu" || status === "gameover") return null;

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Deslizá para mover"
      onPointerDown={(e) => {
        // Solo un dedo / botón primario; no robar clics de UI (van encima).
        if (e.button !== 0) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        origin.current = { x: e.clientX, y: e.clientY };
        lastDir.current = null;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) return;
        e.preventDefault();
        apply(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerId.current !== e.pointerId) return;
        end();
      }}
      onPointerCancel={end}
    />
  );
}
