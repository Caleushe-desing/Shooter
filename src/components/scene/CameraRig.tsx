import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { TILE } from "../../constants";
import type { CacamanEngine } from "../../game/engine";
import type { Dir } from "../../game/types";
import { DIR_VEC } from "../../game/types";
import { gridToWorld } from "../../maze/grid";
import { useHud } from "../../store/gameStore";
import { resolveShoulderCamera } from "./occlusion";

const desired = new Vector3();
const look = new Vector3();
const lookSmooth = new Vector3();
const playerPos = new Vector3();
const baseCam = new Vector3();
const forward = new Vector3();
const right = new Vector3();

/** Ángulo yaw en XZ: 0 = +Z (abajo en el mapa). */
function yawFromDir(dir: Dir): number {
  const v = DIR_VEC[dir];
  return Math.atan2(v.c, v.r);
}

function shortestAngle(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Vista 3D: encima del hombro derecho, mirando hacia adelante. */
const SHOULDER = {
  back: 2.05,
  side: 0.72,
  height: 1.28,
  lookAhead: 3.6,
  lookY: 0.42,
  /** Empuja el look un poco a la izquierda para enmarcar al personaje. */
  lookBias: -0.18,
};

/** How many tiles visible on the short screen axis in 2D. */
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
  const yawSmooth = useRef(yawFromDir(engine.player.dir));

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
        viewMode === "2d" ? (aspect < 1 ? 48 : 46) : aspect < 1 ? 62 : 58;
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
      desired.set(x, h, z);
      look.set(x, 0, z);
      camera.up.set(0, 0, -1);
    } else {
      const targetYaw = yawFromDir(p.dir);
      const turn = 1 - Math.exp(-dt * 9);
      yawSmooth.current += shortestAngle(yawSmooth.current, targetYaw) * turn;
      const yaw = yawSmooth.current;

      // forward en XZ; right = up × forward (hombro derecho del personaje)
      forward.set(Math.sin(yaw), 0, Math.cos(yaw));
      right.set(Math.cos(yaw), 0, -Math.sin(yaw));

      const portrait = aspect < 1;
      const back = portrait ? SHOULDER.back * 0.92 : SHOULDER.back;
      const side = portrait ? SHOULDER.side * 0.9 : SHOULDER.side;
      const height = portrait ? SHOULDER.height * 1.08 : SHOULDER.height;

      playerPos.set(x, 0, z);
      baseCam
        .copy(playerPos)
        .addScaledVector(forward, -back)
        .addScaledVector(right, side);
      baseCam.y += height;

      const walls = scene.getObjectByName("maze-walls");
      resolveShoulderCamera(playerPos, baseCam, walls, desired);

      look
        .copy(playerPos)
        .addScaledVector(forward, SHOULDER.lookAhead)
        .addScaledVector(right, SHOULDER.lookBias);
      look.y = SHOULDER.lookY;
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

    const k = 1 - Math.exp(-dt * (viewMode === "2d" ? 14 : 13));
    camera.position.lerp(desired, k);
    lookSmooth.lerp(look, k);
    camera.lookAt(lookSmooth);
  });

  return null;
}
