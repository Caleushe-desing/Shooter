import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { DIR_VEC } from "../../game/types";
import type { CacamanEngine } from "../../game/engine";
import { gridToWorld } from "../../maze/grid";

const desired = new Vector3();
const look = new Vector3();

export function CameraRig({ engine }: { engine: CacamanEngine }) {
  const { camera } = useThree();
  const snapped = useRef(false);

  useFrame((_, dt) => {
    const p = engine.player;
    const { x, z } = gridToWorld(p.col, p.row);
    const fwd = DIR_VEC[p.dir];
    const dist = engine.status === "menu" ? 11 : 6.4;
    const height = engine.status === "menu" ? 10.5 : 5.6;

    desired.set(x - fwd.c * dist * 0.55, height, z - fwd.r * dist * 0.55 + dist * 0.35);
    look.set(x + fwd.c * 1.8, 0.45, z + fwd.r * 1.8);

    if (engine.status === "menu") {
      const t = performance.now() / 1000;
      desired.set(Math.sin(t * 0.15) * 8, 11, Math.cos(t * 0.15) * 8);
      look.set(0, 0, 0);
    }

    const jump = camera.position.distanceTo(desired) > 12;
    if (jump || !snapped.current) {
      camera.position.copy(desired);
      camera.lookAt(look);
      snapped.current = true;
      return;
    }

    const k = 1 - Math.exp(-dt * 4.2);
    camera.position.lerp(desired, k);
    camera.lookAt(look);
  });

  return null;
}
