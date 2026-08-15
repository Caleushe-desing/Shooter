import { useRef } from "react";
import {
  DIR_YAW,
  getSpinYaw,
  setSpinDragging,
  setSpinYaw,
  turnMap90,
  yawToFacing,
} from "../../game/inputMap";
import { engine } from "../../game/instance";
import { useHud } from "../../store/gameStore";

/** Un desliz = un solo paso de 90°. Otro al mismo lado = +90° más. */
const SWIPE_PX = 28;

/**
 * En 3D: cada gesto horizontal gira el mapa exactamente 90°.
 * Izquierda → 90° a la izquierda; otro desliz izquierda → otros 90°.
 * Derecha igual en el otro sentido.
 */
export function MapSpinControls() {
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);
  const pointerId = useRef<number | null>(null);
  const originX = useRef(0);
  const committed = useRef(false);

  if (viewMode !== "3d" || status === "menu" || status === "gameover") return null;

  const commitStep = (dx: number) => {
    if (committed.current) return;
    if (Math.abs(dx) < SWIPE_PX) return;
    committed.current = true;
    // dx < 0 = izquierda → +1 paso (90° a la izq); dx > 0 = derecha → −1.
    const facing = turnMap90(dx < 0 ? 1 : -1);
    engine.setInput(facing);
  };

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Deslizá: un gesto = 90°, otro = +90°"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        originX.current = e.clientX;
        committed.current = false;
        setSpinDragging(true);
        // Anclar al yaw actual del mapa (no al player.dir) para acumular 90°+90°.
        setSpinYaw(DIR_YAW[yawToFacing(getSpinYaw())]);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) return;
        e.preventDefault();
        commitStep(e.clientX - originX.current);
      }}
      onPointerUp={(e) => {
        if (pointerId.current !== e.pointerId) return;
        commitStep(e.clientX - originX.current);
        pointerId.current = null;
        committed.current = false;
        setSpinDragging(false);
      }}
      onPointerCancel={() => {
        pointerId.current = null;
        committed.current = false;
        setSpinDragging(false);
      }}
    />
  );
}
