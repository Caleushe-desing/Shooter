import { useCallback, useRef, useState } from "react";
import { screenToWorld } from "../../game/inputMap";
import type { Dir } from "../../game/types";
import { useHud } from "../../store/gameStore";

interface MobileStickProps {
  onDir: (dir: Dir) => void;
}

const SIZE = 148;
const KNOB = 52;
const MAX_TRAVEL = (SIZE - KNOB) / 2 - 4;
const DEADZONE = 18;

const DIR_OFFSET: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -MAX_TRAVEL },
  down: { x: 0, y: MAX_TRAVEL },
  left: { x: -MAX_TRAVEL, y: 0 },
  right: { x: MAX_TRAVEL, y: 0 },
};

function screenDirFromDelta(dx: number, dy: number): Dir | null {
  if (Math.hypot(dx, dy) < DEADZONE) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/** Stick digital 4 direcciones — solo vista 3D. Arriba = adelante. */
export function MobileStick({ onDir }: MobileStickProps) {
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);
  const setMobileDir = useHud((s) => s.setMobileDir);
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [held, setHeld] = useState<Dir | null>(null);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const screen = screenDirFromDelta(dx, dy);
      if (!screen) {
        setKnob({ x: 0, y: 0 });
        setHeld(null);
        setMobileDir(null);
        return;
      }
      const world = screenToWorld(screen, "3d");
      setKnob(DIR_OFFSET[screen]);
      setHeld(screen);
      setMobileDir(world);
      onDir(world);
    },
    [onDir, setMobileDir],
  );

  const end = useCallback(() => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    setHeld(null);
    setActive(false);
    setMobileDir(null);
  }, [setMobileDir]);

  if (viewMode !== "3d" || status === "menu" || status === "gameover") return null;

  return (
    <div className="absolute bottom-6 left-4 z-20 select-none touch-none pointer-events-auto">
      <div
        ref={baseRef}
        className={`relative border-4 ${
          active ? "border-[#ffff00] bg-black/80" : "border-[#ff00aa] bg-black/70"
        }`}
        style={{ width: SIZE, height: SIZE, borderRadius: 0 }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          pointerId.current = e.pointerId;
          setActive(true);
          apply(e.clientX, e.clientY);
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
      >
        {(
          [
            ["up", "top-2 left-1/2 -translate-x-1/2", "▲"],
            ["down", "bottom-2 left-1/2 -translate-x-1/2", "▼"],
            ["left", "left-2 top-1/2 -translate-y-1/2", "◀"],
            ["right", "right-2 top-1/2 -translate-y-1/2", "▶"],
          ] as const
        ).map(([dir, pos, glyph]) => (
          <span
            key={dir}
            className={`pointer-events-none absolute text-[10px] font-black ${pos} ${
              held === dir ? "text-[#ffff00]" : "text-[#00ffff]/55"
            }`}
          >
            {glyph}
          </span>
        ))}
        <div
          className={`pointer-events-none absolute border-2 border-black ${
            active && held ? "bg-[#ff00aa]" : "bg-[#00ffff]"
          }`}
          style={{
            width: KNOB,
            height: KNOB,
            left: SIZE / 2 - KNOB / 2 + knob.x,
            top: SIZE / 2 - KNOB / 2 + knob.y,
            borderRadius: 0,
          }}
        />
      </div>
    </div>
  );
}
