import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import type { CacamanEngine } from "../../game/engine";
import { gridToWorld } from "../../maze/grid";

const desired = new Vector3();
const look = new Vector3();
const lookSmooth = new Vector3();

/** Fixed world offset: camera does not orbit when the player turns. */
const CAM_OFFSET = { x: 0, y: 9.4, z: 8.6 };

export function CameraRig({ engine }: { engine: CacamanEngine }) {
  const { camera } = useThree();
  const snapped = useRef(false);

  useFrame((_, dt) => {
    const p = engine.player;
    const { x, z } = gridToWorld(p.col, p.row);

    if (engine.status === "menu") {
      const t = performance.now() / 1000;
      desired.set(Math.sin(t * 0.15) * 9, 12, Math.cos(t * 0.15) * 9);
      look.set(0, 0.2, 0);
    } else {
      desired.set(x + CAM_OFFSET.x, CAM_OFFSET.y, z + CAM_OFFSET.z);
      look.set(x, 0.45, z);
    }

    camera.up.set(0, 1, 0);
    const jump = camera.position.distanceTo(desired) > 10;
    if (jump || !snapped.current) {
      camera.position.copy(desired);
      lookSmooth.copy(look);
      camera.lookAt(lookSmooth);
      snapped.current = true;
      return;
    }

    const k = 1 - Math.exp(-dt * 7);
    camera.position.lerp(desired, k);
    lookSmooth.lerp(look, k);
    camera.lookAt(lookSmooth);
  });

  return null;
}
