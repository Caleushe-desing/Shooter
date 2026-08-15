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

/**
 * Cámara 3D fija en orientación: solo sigue la posición del jugador.
 * El rumbo lo cambia el quiltro, no el giro del mapa.
 */
const CHASE = {
  /** Desde el “sur” del laberinto (+Z), mirando al norte (−Z). */
  back: 5.4,
  height: 6.8,
  lookAhead: 1.1,
  lookY: 0.45,
};

const TILES_VISIBLE_2D = 9.5;

function heightFor2d(aspect: number, fovDeg: number): number {
  const fov = (fovDeg * Math.PI) / 180;
  const shortSpan = TILES_VISIBLE_2D * TILE;
  if (aspect >= 1) {
    return shortSpan / (2 * Math.tan(fov / 2));
  }
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
      const wantFov =
        viewMode === "2d" ? (aspect < 1 ? 48 : 46) : aspect < 1 ? 52 : 48;
      if (Math.abs(camera.fov - wantFov) > 0.15) {
        camera.fov = wantFov;
        camera.updateProjectionMatrix();
      }
    }

    if (engine.status === "menu" && viewMode === "3d") {
      const t = performance.now() / 1000;
      desired.set(Math.sin(t * 0.12) * 11, 13, Math.cos(t * 0.12) * 11);
      look.set(0, 0.3, 0);
      camera.up.set(0, 1, 0);
    } else if (viewMode === "2d") {
      const fov = camera instanceof PerspectiveCamera ? camera.fov : 48;
      const h = heightFor2d(aspect, fov);
      desired.set(x, h, z);
      look.set(x, 0, z);
      camera.up.set(0, 0, -1);
    } else {
      const portrait = aspect < 1;
      const back = portrait ? CHASE.back * 1.12 : CHASE.back;
      const height = portrait ? CHASE.height * 1.08 : CHASE.height;
      // Orientación fija: la cámara no gira cuando el jugador cambia de rumbo.
      desired.set(x, height, z + back);
      look.set(x, CHASE.lookY, z - CHASE.lookAhead);
      camera.up.set(0, 1, 0);
    }

    const jump = !snapped.current || camera.position.distanceTo(desired) > 14;
    if (jump) {
      camera.position.copy(desired);
      lookSmooth.copy(look);
      camera.lookAt(lookSmooth);
      snapped.current = true;
      return;
    }

    const follow = viewMode === "2d" ? 14 : 6.5;
    const k = 1 - Math.exp(-dt * follow);
    camera.position.lerp(desired, k);
    lookSmooth.lerp(look, Math.min(1, k * 1.15));
    camera.lookAt(lookSmooth);
  });

  return null;
}
