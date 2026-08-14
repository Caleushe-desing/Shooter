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

/**
 * 3D chase elevado: detrás + un poco a la derecha (hombro),
 * lo bastante alto/lejos para leer el laberinto.
 */
const CHASE = {
  back: 6.2,
  side: 1.55,
  height: 5.4,
  lookAhead: 1.4,
  lookY: 0.25,
  lookBias: -0.45,
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
        viewMode === "2d" ? (aspect < 1 ? 48 : 46) : aspect < 1 ? 52 : 48;
      if (Math.abs(camera.fov - wantFov) > 0.15) {
        camera.fov = wantFov;
        camera.updateProjectionMatrix();
      }
    }

    if (engine.status === "menu" && viewMode === "3d") {
      const t = performance.now() / 1000;
      desired.set(Math.sin(t * 0.15) * 10, 14, Math.cos(t * 0.15) * 10);
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
      // Giros más suaves: menos mareo en corredores.
      const turn = 1 - Math.exp(-dt * 6.5);
      yawSmooth.current += shortestAngle(yawSmooth.current, targetYaw) * turn;
      const yaw = yawSmooth.current;

      forward.set(Math.sin(yaw), 0, Math.cos(yaw));
      right.set(Math.cos(yaw), 0, -Math.sin(yaw));

      const portrait = aspect < 1;
      const back = portrait ? CHASE.back * 1.05 : CHASE.back;
      const side = portrait ? CHASE.side * 0.85 : CHASE.side;
      const height = portrait ? CHASE.height * 1.12 : CHASE.height;

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
        .addScaledVector(forward, CHASE.lookAhead)
        .addScaledVector(right, CHASE.lookBias);
      look.y = CHASE.lookY;
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

    // Chase más suave en 3D para que no “pegue” en las paredes.
    const k = 1 - Math.exp(-dt * (viewMode === "2d" ? 14 : 8));
    camera.position.lerp(desired, k);
    lookSmooth.lerp(look, k);
    camera.lookAt(lookSmooth);
  });

  return null;
}
