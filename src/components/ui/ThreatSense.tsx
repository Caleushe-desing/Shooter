import { useEffect, useRef, useState } from "react";
import { SOAP_COLORS } from "../../constants";
import { engine } from "../../game/instance";
import { getCamYaw } from "../../game/inputMap";
import { COLS } from "../../maze/layout";
import { useHud } from "../../store/gameStore";
import { playProximity } from "../../audio/sfx";

const ALERT_TILES = 7;
const DANGER_TILES = 3;

type Threat = {
  id: string;
  color: string;
  dist: number;
  /** Ángulo en pantalla: 0 = adelante, + = derecha */
  angle: number;
  danger: boolean;
  scared: boolean;
};

function wrapDelta(a: number, b: number): number {
  let d = a - b;
  if (d > COLS / 2) d -= COLS;
  if (d < -COLS / 2) d += COLS;
  return d;
}

function collectThreats(): Threat[] {
  const p = engine.player;
  const yaw = getCamYaw();
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const out: Threat[] = [];

  for (const g of engine.ghosts) {
    if (g.mode === "eaten" || g.mode === "house") continue;
    const dc = wrapDelta(g.col, p.col);
    const dr = g.row - p.row;
    const dist = Math.hypot(dc, dr);
    if (dist > ALERT_TILES || dist < 0.05) continue;

    // local camera space: +Z forward (into screen), +X right
    const localX = dc * rx + dr * rz;
    const localZ = dc * fx + dr * fz;
    const angle = Math.atan2(localX, localZ);
    const scared = g.mode === "frightened";
    out.push({
      id: g.id,
      color: scared ? "#aa00ff" : SOAP_COLORS[g.id],
      dist,
      angle,
      danger: dist <= DANGER_TILES && !scared,
      scared,
    });
  }
  return out;
}

/**
 * Alerta de enemigos cercanos (sin mapa):
 * chevrones en el borde según dirección + viñeta si están muy cerca.
 */
export function ThreatSense() {
  const status = useHud((s) => s.status);
  const viewMode = useHud((s) => s.viewMode);
  const frightened = useHud((s) => s.frightened);
  const [threats, setThreats] = useState<Threat[]>([]);
  const lastBeep = useRef(0);

  useEffect(() => {
    if (status === "menu" || viewMode !== "3d") {
      setThreats([]);
      return;
    }
    let raf = 0;
    let lastUi = 0;
    let lastKey = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (engine.status !== "playing" && engine.status !== "ready") {
        if (lastKey !== "") {
          lastKey = "";
          setThreats([]);
        }
        return;
      }
      const now = performance.now();
      if (now - lastUi < 50) return;
      lastUi = now;

      const next = collectThreats();
      const key = next
        .map((t) => `${t.id}:${t.dist.toFixed(1)}:${t.angle.toFixed(1)}:${t.danger ? 1 : 0}`)
        .join("|");
      if (key !== lastKey) {
        lastKey = key;
        setThreats(next);
      }

      const closestDanger = next.reduce(
        (m, t) => (t.danger && t.dist < m ? t.dist : m),
        Infinity,
      );
      if (closestDanger < Infinity && !frightened) {
        const interval = 180 + closestDanger * 90;
        if (now - lastBeep.current > interval) {
          lastBeep.current = now;
          playProximity(1 - closestDanger / DANGER_TILES);
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, viewMode, frightened]);

  if (viewMode !== "3d" || status === "menu" || status === "gameover") return null;

  const hot = threats.some((t) => t.danger);
  const any = threats.length > 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-[8] overflow-hidden">
      {/* Viñeta de peligro */}
      {hot && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 42%, rgba(255,0,60,0.38) 100%)",
          }}
        />
      )}
      {any && !hot && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(255,170,0,0.12) 100%)",
          }}
        />
      )}

      {/* Chevrones direccionales en el borde */}
      {threats.map((t) => {
        const edge = 0.42; // fracción desde el centro hacia el borde
        const x = 50 + Math.sin(t.angle) * edge * 100;
        const y = 50 - Math.cos(t.angle) * edge * 100;
        const rot = (t.angle * 180) / Math.PI;
        const size = t.danger ? 22 : 16;
        const opacity = t.danger ? 1 : Math.max(0.35, 1 - t.dist / ALERT_TILES);
        return (
          <div
            key={t.id}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              opacity,
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${size * 0.45}px solid transparent`,
                borderRight: `${size * 0.45}px solid transparent`,
                borderBottom: `${size}px solid ${t.color}`,
                filter: t.danger ? "drop-shadow(0 0 6px #ff0044)" : "drop-shadow(0 0 4px #000)",
              }}
            />
          </div>
        );
      })}

      {hot && (
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 title-font text-lg md:text-2xl text-[#ff0044] drop-shadow-[0_0_8px_#ff0044] tracking-widest animate-pulse">
          ¡CERCA!
        </div>
      )}
    </div>
  );
}
