import { useCallback, useRef } from "react";
import { screenToWorld } from "../../game/inputMap";
import type { Dir } from "../../game/types";
import { useHud } from "../../store/gameStore";

interface TouchControlsProps {
  onDir: (dir: Dir) => void;
}

const SWIPE_PX = 24;

function screenDirFromDelta(dx: number, dy: number): Dir | null {
  if (Math.hypot(dx, dy) < SWIPE_PX) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/**
 * Un desliz = una orden de giro (estilo Pac-Man).
 * En 3D: relativo a lo que muestra la cámara (arriba = adelante).
 */
export function TouchControls({ onDir }: TouchControlsProps) {
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);
  const setMobileDir = useHud((s) => s.setMobileDir);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const committed = useRef(false);

  const tryCommit = useCallback(
    (clientX: number, clientY: number) => {
      if (committed.current) return;
      const dx = clientX - origin.current.x;
      const dy = clientY - origin.current.y;
      const screen = screenDirFromDelta(dx, dy);
      if (!screen) return;

      const world = screenToWorld(screen, viewMode);
      committed.current = true;
      setMobileDir(world);
      onDir(world);
    },
    [onDir, setMobileDir, viewMode],
  );

  const end = useCallback(() => {
    pointerId.current = null;
    committed.current = false;
    setMobileDir(null);
  }, [setMobileDir]);

  if (status === "menu" || status === "gameover") return null;

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Deslizá para girar"
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
        tryCommit(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerId.current !== e.pointerId) return;
        // Tap corto sin swipe: no cambia dirección (sigue de frente).
        end();
      }}
      onPointerCancel={end}
    />
  );
}
