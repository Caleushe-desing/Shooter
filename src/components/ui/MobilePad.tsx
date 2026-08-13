import { useCallback, useRef, useState } from "react";
import type { Dir } from "../../game/types";
import { useHud } from "../../store/gameStore";

interface MobilePadProps {
  onDir: (dir: Dir) => void;
}

const SIZE = 156;
const KNOB = 66;
const MAX_TRAVEL = (SIZE - KNOB) / 2;
const DEADZONE = 22;
/** Need this much more on the other axis before switching direction. */
const AXIS_BIAS = 1.28;

function dirFromStick(dx: number, dy: number, current: Dir | null): Dir | null {
  const dist = Math.hypot(dx, dy);
  if (dist < DEADZONE) return current;

  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  if (current === "left" || current === "right") {
    if (ay > ax * AXIS_BIAS) return dy > 0 ? "down" : "up";
    return dx > 0 ? "right" : "left";
  }
  if (current === "up" || current === "down") {
    if (ax > ay * AXIS_BIAS) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }
  return ax >= ay ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}

export function MobilePad({ onDir }: MobilePadProps) {
  const status = useHud((s) => s.status);
  const setMobileDir = useHud((s) => s.setMobileDir);
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const lastDir = useRef<Dir | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const applyStick = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > MAX_TRAVEL && dist > 0) {
        const s = MAX_TRAVEL / dist;
        dx *= s;
        dy *= s;
      }
      setKnob({ x: dx, y: dy });
      const dir = dirFromStick(dx, dy, lastDir.current);
      if (dir) {
        lastDir.current = dir;
        setMobileDir(dir);
        onDir(dir);
      }
    },
    [onDir, setMobileDir],
  );

  const endStick = useCallback(() => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    setActive(false);
    // Keep lastDir so the next touch inherits hysteresis context;
    // clear live input so keyboard still works cleanly.
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
          active ? "border-amber-200/50 bg-black/55" : "border-white/25 bg-black/40"
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
        <div className="pointer-events-none absolute inset-3 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" />
        <div
          className={`pointer-events-none absolute rounded-full shadow-lg ${
            active ? "bg-amber-200" : "bg-white/85"
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
