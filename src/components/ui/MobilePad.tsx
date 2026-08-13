import { useCallback, useRef, useState } from "react";
import type { Dir } from "../../game/types";
import { useHud } from "../../store/gameStore";

interface MobilePadProps {
  onDir: (dir: Dir) => void;
}

const SIZE = 156;
const KNOB = 58;
const MAX_TRAVEL = (SIZE - KNOB) / 2 - 4;
/** Anything past this locks to a full cardinal direction (no analog blend). */
const DEADZONE = 16;

const DIR_OFFSET: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -MAX_TRAVEL },
  down: { x: 0, y: MAX_TRAVEL },
  left: { x: -MAX_TRAVEL, y: 0 },
  right: { x: MAX_TRAVEL, y: 0 },
};

/** Pure 4-way: full up/down/left/right only — tactical, not progressive. */
function dirFromDelta(dx: number, dy: number): Dir | null {
  if (Math.hypot(dx, dy) < DEADZONE) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function MobilePad({ onDir }: MobilePadProps) {
  const status = useHud((s) => s.status);
  const setMobileDir = useHud((s) => s.setMobileDir);
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [held, setHeld] = useState<Dir | null>(null);

  const applyStick = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const dir = dirFromDelta(dx, dy);
      if (!dir) {
        setKnob({ x: 0, y: 0 });
        setHeld(null);
        setMobileDir(null);
        return;
      }
      // Snap knob to the full cardinal stop — never partial travel.
      setKnob(DIR_OFFSET[dir]);
      setHeld(dir);
      setMobileDir(dir);
      onDir(dir);
    },
    [onDir, setMobileDir],
  );

  const endStick = useCallback(() => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    setHeld(null);
    setActive(false);
    setMobileDir(null);
  }, [setMobileDir]);

  if (status === "menu" || status === "gameover") {
    return null;
  }

  return (
    <div className="md:hidden absolute bottom-6 left-4 z-20 select-none touch-none">
      <div
        ref={baseRef}
        className={`relative rounded-full border transition-colors ${
          active ? "border-[#5dffd2]/70 bg-[#102033]/75" : "border-[#5dffd2]/30 bg-[#0b1520]/55"
        }`}
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          pointerId.current = e.pointerId;
          setActive(true);
          applyStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointerId.current !== e.pointerId) return;
          e.preventDefault();
          applyStick(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (pointerId.current !== e.pointerId) return;
          endStick();
        }}
        onPointerCancel={endStick}
      >
        {/* Cardinal guides */}
        {(
          [
            ["up", "top-2 left-1/2 -translate-x-1/2"],
            ["down", "bottom-2 left-1/2 -translate-x-1/2"],
            ["left", "left-2 top-1/2 -translate-y-1/2"],
            ["right", "right-2 top-1/2 -translate-y-1/2"],
          ] as const
        ).map(([dir, pos]) => (
          <span
            key={dir}
            className={`pointer-events-none absolute text-[10px] font-black ${pos} ${
              held === dir ? "text-[#5dffd2]" : "text-[#e8fbff]/35"
            }`}
          >
            {dir === "up" ? "▲" : dir === "down" ? "▼" : dir === "left" ? "◀" : "▶"}
          </span>
        ))}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5dffd2]/30" />
        <div
          className={`pointer-events-none absolute rounded-full shadow-lg transition-[left,top] duration-75 ${
            active && held ? "bg-[#5dffd2]" : "bg-[#e8fbff]/90"
          }`}
          style={{
            width: KNOB,
            height: KNOB,
            left: SIZE / 2 - KNOB / 2 + knob.x,
            top: SIZE / 2 - KNOB / 2 + knob.y,
          }}
        />
      </div>
    </div>
  );
}
