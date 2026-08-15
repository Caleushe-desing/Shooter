import { useRef } from "react";
import {
  DIR_YAW,
  setSpinDragging,
  setSpinYaw,
  turnMap45,
} from "../../game/inputMap";
import { engine } from "../../game/instance";
import { useHud } from "../../store/gameStore";

/** Un desliz = un solo paso de 45°. Otro desliz al mismo lado = +45° más. */
const SWIPE_PX = 28;

/**
 * En 3D: cada gesto horizontal gira el mapa exactamente 45°.
 * El quiltro siempre camina hacia el fondo de la pantalla.
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
    // Desliz a la derecha → mapa gira “a la derecha” (−45° en el reloj).
    const facing = turnMap45(dx > 0 ? -1 : 1);
    engine.setInput(facing);
  };

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Deslizá: un gesto = 45°"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        originX.current = e.clientX;
        committed.current = false;
        setSpinDragging(true);
        setSpinYaw(DIR_YAW[engine.player.dir]);
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
        // Si soltó sin llegar al umbral, no gira.
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
