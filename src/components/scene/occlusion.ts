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
 * If walls block the default chase cam, lift and pull in until the
 * line of sight to the player is clear (keeps a fixed world yaw).
 */
export function resolveChaseCamera(
  player: Vector3,
  baseCam: Vector3,
  walls: Object3D | null | undefined,
  out: Vector3,
): Vector3 {
  out.copy(baseCam);
  _origin.set(player.x, 0.55, player.z);
  if (!isBlockedByWalls(_origin, out, walls)) return out;

  let oy = baseCam.y - player.y;
  let oz = baseCam.z - player.z;
  const ox = baseCam.x - player.x;

  for (let i = 0; i < 10; i++) {
    oy += 0.55;
    oz *= 0.82;
    out.set(player.x + ox, player.y + oy, player.z + oz);
    if (!isBlockedByWalls(_origin, out, walls)) return out;
  }

  // Last resort: almost overhead.
  out.set(player.x, player.y + Math.max(oy, 11), player.z + Math.sign(oz || 1) * 1.2);
  return out;
}

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
