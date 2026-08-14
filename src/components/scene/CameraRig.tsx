import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { TILE } from "../../constants";
import type { CacamanEngine } from "../../game/engine";
import type { Dir } from "../../game/types";
import { gridToWorld } from "../../maze/grid";
import { useHud } from "../../store/gameStore";
import { resolveBehindCamera } from "./occlusion";

const desired = new Vector3();
const look = new Vector3();
const lookSmooth = new Vector3();
const playerPos = new Vector3();
const baseCam = new Vector3();
const forward = new Vector3();

/** Misma tabla que el actor: cámara siempre exactamente detrás. */
const YAW: Record<Dir, number> = {
  up: Math.PI,
  down: 0,
  left: -Math.PI / 2,
  right: Math.PI / 2,
};

function shortestAngle(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Chase estable desde la espalda:
 * centrado, personaje completo, giros lentos (sin locura).
 */
const CHASE = {
  back: 4.15,
  height: 2.85,
  /** Mirar un poco adelante del pecho para dejar al quiltro entero abajo. */
  lookAhead: 0.95,
  lookY: 0.7,
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
  const { camera, size, scene } = useThree();
  const viewMode = useHud((s) => s.viewMode);
  const snapped = useRef(false);
  const lastMode = useRef(viewMode);
  const yawSmooth = useRef(YAW[engine.player.dir]);

  useFrame((_, dt) => {
    const p = engine.player;
    const { x, z } = gridToWorld(p.col, p.row);
    const aspect = size.width / Math.max(size.height, 1);
    const modeChanged = lastMode.current !== viewMode;
    if (modeChanged) {
      lastMode.current = viewMode;
      snapped.current = false;
      yawSmooth.current = YAW[p.dir];
    }

    if (camera instanceof PerspectiveCamera) {
      const wantFov =
        viewMode === "2d" ? (aspect < 1 ? 48 : 46) : aspect < 1 ? 55 : 50;
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
      const targetYaw = YAW[p.dir];
      // Giro muy suave: la cámara “sigue” la espalda sin latigazos.
      const turn = 1 - Math.exp(-dt * 3.2);
      yawSmooth.current += shortestAngle(yawSmooth.current, targetYaw) * turn;
      const yaw = yawSmooth.current;

      forward.set(Math.sin(yaw), 0, Math.cos(yaw));

      const portrait = aspect < 1;
      const back = portrait ? CHASE.back * 1.08 : CHASE.back;
      const height = portrait ? CHASE.height * 1.1 : CHASE.height;

      playerPos.set(x, 0, z);
      baseCam.copy(playerPos).addScaledVector(forward, -back);
      baseCam.y = height;

      const walls = scene.getObjectByName("maze-walls");
      resolveBehindCamera(playerPos, baseCam, walls, desired);

      // Look near the character so the full body stays on screen.
      look.copy(playerPos).addScaledVector(forward, CHASE.lookAhead);
      look.y = CHASE.lookY;
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

    const follow = viewMode === "2d" ? 14 : 4.2;
    const k = 1 - Math.exp(-dt * follow);
    camera.position.lerp(desired, k);
    lookSmooth.lerp(look, Math.min(1, k * 1.15));
    camera.lookAt(lookSmooth);
  });

  return null;
}
