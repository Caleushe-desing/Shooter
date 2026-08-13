import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { DIR_VEC } from "../../game/types";
import type { CacamanEngine } from "../../game/engine";
import { gridToWorld } from "../../maze/grid";

const desired = new Vector3();
const look = new Vector3();
const offset = new Vector3();

export function CameraRig({ engine }: { engine: CacamanEngine }) {
  const { camera } = useThree();
  const snapped = useRef(false);

  useFrame((_, dt) => {
    const p = engine.player;
    const { x, z } = gridToWorld(p.col, p.row);
    const fwd = DIR_VEC[p.dir];

    if (engine.status === "menu") {
      const t = performance.now() / 1000;
      desired.set(Math.sin(t * 0.15) * 9, 12, Math.cos(t * 0.15) * 9);
      look.set(0, 0.2, 0);
    } else {
      offset.set(-fwd.c, 0, -fwd.r);
      if (offset.lengthSq() < 0.01) offset.set(0, 0, 1);
      offset.normalize().multiplyScalar(5.8);
      offset.y = 7.6;
      desired.set(x + offset.x, offset.y, z + offset.z);
      look.set(x + fwd.c * 1.4, 0.35, z + fwd.r * 1.4);
    }

    camera.up.set(0, 1, 0);
    const jump = camera.position.distanceTo(desired) > 10;
    if (jump || !snapped.current) {
      camera.position.copy(desired);
      camera.lookAt(look);
      snapped.current = true;
      return;
    }

    const k = 1 - Math.exp(-dt * 3.4);
    camera.position.lerp(desired, k);
    camera.lookAt(look);
  });

  return null;
}
