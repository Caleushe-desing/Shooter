import { useRef } from "react";
import {
  adjustSpinYaw,
  DIR_YAW,
  getSpinYaw,
  setSpinDragging,
  setSpinYaw,
  yawToFacing,
} from "../../game/inputMap";
import { engine } from "../../game/instance";
import { useHud } from "../../store/gameStore";

/**
 * En 3D: arrastrá horizontalmente para girar el mapa.
 * El quiltro siempre camina hacia el fondo de la pantalla.
 */
export function MapSpinControls() {
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);
  const pointerId = useRef<number | null>(null);
  const lastX = useRef(0);
  const lastFacing = useRef(engine.player.dir);

  if (viewMode !== "3d" || status === "menu" || status === "gameover") return null;

  return (
    <div
      className="absolute inset-0 z-[5] touch-none select-none"
      aria-label="Arrastrá para girar el mapa de a 45°"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        lastX.current = e.clientX;
        setSpinDragging(true);
        setSpinYaw(DIR_YAW[engine.player.dir]);
        lastFacing.current = engine.player.dir;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) return;
        e.preventDefault();
        const dx = e.clientX - lastX.current;
        lastX.current = e.clientX;
        adjustSpinYaw(-dx * 0.01);
        const facing = yawToFacing(getSpinYaw());
        if (facing !== lastFacing.current) {
          lastFacing.current = facing;
          setSpinYaw(DIR_YAW[facing]);
          engine.setInput(facing);
        }
      }}
      onPointerUp={(e) => {
        if (pointerId.current !== e.pointerId) return;
        pointerId.current = null;
        setSpinDragging(false);
        const facing = yawToFacing(getSpinYaw());
        setSpinYaw(DIR_YAW[facing]);
        engine.setInput(facing);
      }}
      onPointerCancel={() => {
        pointerId.current = null;
        setSpinDragging(false);
      }}
    />
  );
}
