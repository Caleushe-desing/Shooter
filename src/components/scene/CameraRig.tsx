import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { TILE } from "../../constants";
import type { CacamanEngine } from "../../game/engine";
import { gridToWorld } from "../../maze/grid";
import { COLS, ROWS } from "../../maze/layout";
import { useHud } from "../../store/gameStore";

const desired = new Vector3();
const look = new Vector3();
const lookSmooth = new Vector3();

/** Fixed world offset for 3rd-person: camera does not orbit on turns. */
const CAM_OFFSET_3D = { x: 0, y: 9.4, z: 8.6 };
/** High enough to see the whole maze on phones in top-down. */
const CAM_HEIGHT_2D = Math.max(COLS, ROWS) * TILE * 1.05;

export function CameraRig({ engine }: { engine: CacamanEngine }) {
  const { camera } = useThree();
  const viewMode = useHud((s) => s.viewMode);
  const snapped = useRef(false);
  const lastMode = useRef(viewMode);

  useFrame((_, dt) => {
    const p = engine.player;
    const { x, z } = gridToWorld(p.col, p.row);
    const modeChanged = lastMode.current !== viewMode;
    if (modeChanged) {
      lastMode.current = viewMode;
      snapped.current = false;
    }

    if (camera instanceof PerspectiveCamera) {
      const wantFov = viewMode === "2d" ? 42 : 50;
      if (Math.abs(camera.fov - wantFov) > 0.1) {
        camera.fov = wantFov;
        camera.updateProjectionMatrix();
      }
    }

    if (engine.status === "menu" && viewMode === "3d") {
      const t = performance.now() / 1000;
      desired.set(Math.sin(t * 0.15) * 9, 12, Math.cos(t * 0.15) * 9);
      look.set(0, 0.2, 0);
      camera.up.set(0, 1, 0);
    } else if (viewMode === "2d") {
      // Top-down 2D: mostly maze-centered, slight follow so the player stays readable.
      const maze = gridToWorld((COLS - 1) / 2, (ROWS - 1) / 2);
      const follow = 0.22;
      const cx = maze.x * (1 - follow) + x * follow;
      const cz = maze.z * (1 - follow) + z * follow;
      desired.set(cx, CAM_HEIGHT_2D, cz);
      look.set(cx, 0, cz);
      camera.up.set(0, 0, -1);
    } else {
      desired.set(x + CAM_OFFSET_3D.x, CAM_OFFSET_3D.y, z + CAM_OFFSET_3D.z);
      look.set(x, 0.45, z);
      camera.up.set(0, 1, 0);
    }

    const jump = camera.position.distanceTo(desired) > 10 || !snapped.current;
    if (jump) {
      camera.position.copy(desired);
      lookSmooth.copy(look);
      camera.lookAt(lookSmooth);
      snapped.current = true;
      return;
    }

    const k = 1 - Math.exp(-dt * (viewMode === "2d" ? 10 : 7));
    camera.position.lerp(desired, k);
    lookSmooth.lerp(look, k);
    camera.lookAt(lookSmooth);
  });

  return null;
}
