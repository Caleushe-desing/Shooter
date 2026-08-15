import { useRef } from "react";
import {
  DIR_YAW,
  getSpinYaw,
  screenToWorld,
  setSpinDragging,
  setSpinYaw,
  turnMap90,
  yawToFacing,
} from "../../game/inputMap";
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
 * Controles de celular = mismas acciones que el teclado del PC.
 * Sin mando, sin flechas en pantalla: solo desliz invisible a pantalla completa.
 *
 * 3D (como A/D/S/W):
 *   izquierda / derecha → 90° (otro desliz = +90°)
 *   abajo → 180°
 *   arriba → seguir al fondo
 *
 * 2D (como flechas):
 *   desliz en esa dirección
 */
export function PcTouchControls() {
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const committed = useRef(false);

  if (status === "menu" || status === "gameover") return null;

  const commit3d = (dx: number, dy: number) => {
    if (committed.current) return;
    if (Math.hypot(dx, dy) < SWIPE_PX) return;
    committed.current = true;

    if (Math.abs(dx) >= Math.abs(dy)) {
      // A / D
      engine.setInput(turnMap90(dx < 0 ? 1 : -1));
    } else if (dy > 0) {
      // S — media vuelta
      engine.setInput(turnMap90(2));
    } else {
      // W — seguir al fondo
      engine.setInput(yawToFacing(getSpinYaw()));
    }
  };

  const commit2d = (dx: number, dy: number) => {
    if (committed.current) return;
    const screen = screenDirFromDelta(dx, dy);
    if (!screen) return;
    committed.current = true;
    const world = screenToWorld(screen, "2d");
    useHud.getState().setMobileDir(world);
    engine.setInput(world);
  };

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Deslizá como en el PC: izquierda/derecha giran, sin mando"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        origin.current = { x: e.clientX, y: e.clientY };
        committed.current = false;
        if (viewMode === "3d") {
          setSpinDragging(true);
          setSpinYaw(DIR_YAW[yawToFacing(getSpinYaw())]);
        }
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) return;
        e.preventDefault();
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        if (viewMode === "3d") commit3d(dx, dy);
        else commit2d(dx, dy);
      }}
      onPointerUp={(e) => {
        if (pointerId.current !== e.pointerId) return;
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        if (viewMode === "3d") commit3d(dx, dy);
        else commit2d(dx, dy);
        pointerId.current = null;
        committed.current = false;
        setSpinDragging(false);
        useHud.getState().setMobileDir(null);
      }}
      onPointerCancel={() => {
        pointerId.current = null;
        committed.current = false;
        setSpinDragging(false);
        useHud.getState().setMobileDir(null);
      }}
    />
  );
}
