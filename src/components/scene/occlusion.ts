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
 * Prefer lift over yanking the chase cam into the player.
 * Keeps the elevated third-person framing readable in corridors.
 */
export function resolveShoulderCamera(
  player: Vector3,
  baseCam: Vector3,
  walls: Object3D | null | undefined,
  out: Vector3,
): Vector3 {
  out.copy(baseCam);
  _origin.set(player.x, 0.45, player.z);
  if (!isBlockedByWalls(_origin, out, walls)) return out;

  const ox = baseCam.x - player.x;
  const oy = baseCam.y - player.y;
  const oz = baseCam.z - player.z;

  // 1) Lift first — keep distance, raise over walls.
  for (let i = 0; i < 10; i++) {
    const lift = oy + (i + 1) * 0.55;
    out.set(player.x + ox, player.y + lift, player.z + oz);
    if (!isBlockedByWalls(_origin, out, walls)) return out;
  }

  // 2) Then gently pull in while staying high.
  for (let i = 0; i < 8; i++) {
    const pull = 1 - (i + 1) * 0.08;
    const lift = oy + 4.5 + i * 0.25;
    out.set(player.x + ox * pull, player.y + lift, player.z + oz * pull);
    if (!isBlockedByWalls(_origin, out, walls)) return out;
  }

  out.set(player.x + ox * 0.2, player.y + Math.max(oy + 6, 11), player.z + oz * 0.2);
  return out;
}

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
