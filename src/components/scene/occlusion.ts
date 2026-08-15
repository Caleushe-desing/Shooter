import { Raycaster, Vector3, type Object3D } from "three";

const _origin = new Vector3();
const _dir = new Vector3();
const _raycaster = new Raycaster();

/** True if a maze wall sits between `from` and `to`. */
export function isBlockedByWalls(
  from: Vector3,
  to: Vector3,
  walls: Object3D | null | undefined,
  skin = 0.35,
): boolean {
  if (!walls) return false;
  _dir.copy(to).sub(from);
  const dist = _dir.length();
  if (dist < 1e-4) return false;
  _dir.multiplyScalar(1 / dist);
  _raycaster.set(from, _dir);
  _raycaster.far = Math.max(0.1, dist - skin);
  _raycaster.near = 0.05;
  const hits = _raycaster.intersectObject(walls, false);
  return hits.length > 0;
}

/**
 * Keep XZ behind the player; only lift if a wall blocks LOS.
 * Never yank sideways — that made the chase feel wild.
 */
export function resolveBehindCamera(
  player: Vector3,
  baseCam: Vector3,
  walls: Object3D | null | undefined,
  out: Vector3,
): Vector3 {
  out.copy(baseCam);
  _origin.set(player.x, 0.55, player.z);
  if (!isBlockedByWalls(_origin, out, walls)) return out;

  const ox = baseCam.x - player.x;
  const oz = baseCam.z - player.z;
  let y = baseCam.y;

  for (let i = 0; i < 14; i++) {
    y += 0.35;
    out.set(player.x + ox, y, player.z + oz);
    if (!isBlockedByWalls(_origin, out, walls)) return out;
  }

  // Soft fallback: a bit higher, still on the same behind-axis.
  out.set(player.x + ox * 0.85, Math.max(y, 8), player.z + oz * 0.85);
  return out;
}

/** @deprecated */
export const resolveShoulderCamera = resolveBehindCamera;
export const resolveChaseCamera = resolveBehindCamera;

export function setMeshesDepthTest(root: Object3D, depthTest: boolean): void {
  root.traverse((obj) => {
    const mesh = obj as Object3D & {
      isMesh?: boolean;
      material?: { depthTest: boolean } | { depthTest: boolean }[];
    };
    if (!mesh.isMesh || !mesh.material) return;
    if (Array.isArray(mesh.material)) {
      for (const m of mesh.material) m.depthTest = depthTest;
    } else {
      mesh.material.depthTest = depthTest;
    }
  });
}
