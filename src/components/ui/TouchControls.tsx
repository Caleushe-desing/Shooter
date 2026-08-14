import { useCallback, useRef } from "react";
import { engine } from "../../game/instance";
import type { Dir } from "../../game/types";
import { relativeToFacing } from "../../game/types";
import { useHud } from "../../store/gameStore";

interface TouchControlsProps {
  onDir: (dir: Dir) => void;
}

const SWIPE_PX = 28;

function screenDirFromDelta(dx: number, dy: number): Dir | null {
  if (Math.hypot(dx, dy) < SWIPE_PX) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/**
 * Desliz a pantalla completa.
 * En 3D: arriba = adelante (espalda del quiltro), izquierda/derecha = giros.
 * En 2D: direcciones del mapa.
 */
export function TouchControls({ onDir }: TouchControlsProps) {
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);
  const setMobileDir = useHud((s) => s.setMobileDir);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const lastDir = useRef<Dir | null>(null);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - origin.current.x;
      const dy = clientY - origin.current.y;
      const screen = screenDirFromDelta(dx, dy);
      if (!screen) return;

      const world =
        viewMode === "3d" ? relativeToFacing(screen, engine.player.dir) : screen;

      // Evita spam si el dedo tiembla en la misma dirección.
      if (world === lastDir.current) {
        origin.current = { x: clientX, y: clientY };
        return;
      }

      origin.current = { x: clientX, y: clientY };
      lastDir.current = world;
      setMobileDir(world);
      onDir(world);
    },
    [onDir, setMobileDir, viewMode],
  );

  const end = useCallback(() => {
    pointerId.current = null;
    lastDir.current = null;
    setMobileDir(null);
  }, [setMobileDir]);

  if (status === "menu" || status === "gameover") return null;

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Deslizá para mover"
      onPointerDown={(e) => {
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
