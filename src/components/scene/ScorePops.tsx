import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { CacamanEngine } from "../../game/engine";
import { gridToWorld } from "../../maze/grid";
import { useHud } from "../../store/gameStore";

export function ScorePops({ engine }: { engine: CacamanEngine }) {
  const tick = useHud((s) => s.score);
  void tick;
  return (
    <>
      {engine.floaters.map((f) => {
        const w = gridToWorld(f.x, f.z);
        return (
          <Html key={f.id} position={[w.x, 1.15, w.z]} center>
            <div className="title-font text-amber-200 text-xl drop-shadow-[0_2px_0_#000] pointer-events-none">
              {f.text}
            </div>
          </Html>
        );
      })}
    </>
  );
}

export function ReadyBanner({ engine }: { engine: CacamanEngine }) {
  const status = useHud((s) => s.status);
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = engine.player;
    const w = gridToWorld(p.col, p.row);
    ref.current.position.set(w.x, 1.6, w.z);
  });
  if (status !== "ready") return null;
  return (
    <group ref={ref}>
      <Html center>
        <div className="title-font text-yellow-300 text-3xl drop-shadow-[0_3px_0_#000] whitespace-nowrap">
          ¡LISTO!
        </div>
      </Html>
    </group>
  );
}
