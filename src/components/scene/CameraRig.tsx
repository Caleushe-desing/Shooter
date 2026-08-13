import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { TILE } from "../../constants";
import type { CacamanEngine } from "../../game/engine";
import { gridToWorld } from "../../maze/grid";
import { useHud } from "../../store/gameStore";

const desired = new Vector3();
const look = new Vector3();
const lookSmooth = new Vector3();

/** Close 3rd-person follow — fixed world angle, no orbit on turns. */
const CAM_OFFSET_3D = { x: 0, y: 6.2, z: 5.4 };

/** How many tiles visible on the short screen axis in 2D. */
const TILES_VISIBLE_2D = 9.5;

function heightFor2d(aspect: number, fovDeg: number): number {
  // Fit ~TILES_VISIBLE_2D on the narrower screen axis.
  const fov = (fovDeg * Math.PI) / 180;
  const shortSpan = TILES_VISIBLE_2D * TILE;
  if (aspect >= 1) {
    // Landscape: vertical FOV limits height span.
    return shortSpan / (2 * Math.tan(fov / 2));
  }
  // Portrait: horizontal FOV is narrower → raise cam so sideways still feels close.
  const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  return shortSpan / (2 * Math.tan(hFov / 2));
}

export function CameraRig({ engine }: { engine: CacamanEngine }) {
  const { camera, size } = useThree();
  const viewMode = useHud((s) => s.viewMode);
  const snapped = useRef(false);
  const lastMode = useRef(viewMode);

  useFrame((_, dt) => {
    const p = engine.player;
    const { x, z } = gridToWorld(p.col, p.row);
    const aspect = size.width / Math.max(size.height, 1);
    const modeChanged = lastMode.current !== viewMode;
    if (modeChanged) {
      lastMode.current = viewMode;
      snapped.current = false;
    }

    if (camera instanceof PerspectiveCamera) {
      const wantFov = viewMode === "2d" ? (aspect < 1 ? 48 : 46) : aspect < 1 ? 58 : 52;
      if (Math.abs(camera.fov - wantFov) > 0.15) {
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
      const fov = camera instanceof PerspectiveCamera ? camera.fov : 48;
      const h = heightFor2d(aspect, fov);
      // Hard follow the player — close tactical framing.
      desired.set(x, h, z);
      look.set(x, 0, z);
      camera.up.set(0, 0, -1);
    } else {
      // Portrait: pull a bit closer/higher so the character fills the frame.
      const portrait = aspect < 1;
      const ox = CAM_OFFSET_3D.x;
      const oy = portrait ? CAM_OFFSET_3D.y * 1.08 : CAM_OFFSET_3D.y;
      const oz = portrait ? CAM_OFFSET_3D.z * 0.88 : CAM_OFFSET_3D.z;
      desired.set(x + ox, oy, z + oz);
      look.set(x, 0.4, z);
      camera.up.set(0, 1, 0);
    }

    const jump = camera.position.distanceTo(desired) > 8 || !snapped.current;
    if (jump) {
      camera.position.copy(desired);
      lookSmooth.copy(look);
      camera.lookAt(lookSmooth);
      snapped.current = true;
      return;
    }

    // Snappy follow so it stays locked on the character.
    const k = 1 - Math.exp(-dt * (viewMode === "2d" ? 14 : 11));
    camera.position.lerp(desired, k);
    lookSmooth.lerp(look, k);
    camera.lookAt(lookSmooth);
  });

  return null;
}
