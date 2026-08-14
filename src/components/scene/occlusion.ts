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
 * If walls block the shoulder cam, pull in along the offset and lift
 * until the line of sight to the player is clear.
 */
export function resolveShoulderCamera(
  player: Vector3,
  baseCam: Vector3,
  walls: Object3D | null | undefined,
  out: Vector3,
): Vector3 {
  out.copy(baseCam);
  _origin.set(player.x, 0.55, player.z);
  if (!isBlockedByWalls(_origin, out, walls)) return out;

  const ox = baseCam.x - player.x;
  const oy = baseCam.y - player.y;
  const oz = baseCam.z - player.z;

  for (let i = 0; i < 12; i++) {
    const pull = 1 - (i + 1) * 0.07;
    const lift = oy + (i + 1) * 0.38;
    out.set(player.x + ox * pull, player.y + lift, player.z + oz * pull);
    if (!isBlockedByWalls(_origin, out, walls)) return out;
  }

  // Last resort: almost overhead, still slightly offset.
  out.set(player.x + ox * 0.15, player.y + Math.max(oy + 5, 9), player.z + oz * 0.15);
  return out;
}

/** @deprecated Use resolveShoulderCamera */
export const resolveChaseCamera = resolveShoulderCamera;

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
