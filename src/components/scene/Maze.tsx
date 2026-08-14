import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import { NEON_WALLS, PALETTE, TILE } from "../../constants";
import { gridToWorld } from "../../maze/grid";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";

const _dummy = new Object3D();
const _color = new Color();

/** Laberinto flat 80s: sin texturas, puro color neón. */
export function Maze() {
  const { walls, doors } = useMemo(() => {
    const walls: { x: number; z: number; c: number; r: number }[] = [];
    const doors: { x: number; z: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isDoor(c, r)) {
          const { x, z } = gridToWorld(c, r);
          doors.push({ x, z });
        } else if (isWall(c, r)) {
          const { x, z } = gridToWorld(c, r);
          walls.push({ x, z, c, r });
        }
      }
    }
    return { walls, doors };
  }, []);

  const wallMesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = wallMesh.current;
    if (!mesh) return;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      _dummy.position.set(w.x, 0.55, w.z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      _color.set(NEON_WALLS[(w.c + w.r * 3) % NEON_WALLS.length]);
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [walls]);

  const floorW = COLS * TILE + 2.4;
  const floorD = ROWS * TILE + 2.4;

  // Checker flat floor tiles (minimal).
  const floorTiles = useMemo(() => {
    const list: { x: number; z: number; dark: boolean }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, z } = gridToWorld(c, r);
        list.push({ x, z, dark: (c + r) % 2 === 0 });
      }
    }
    return list;
  }, []);

  const floorMesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = floorMesh.current;
    if (!mesh) return;
    for (let i = 0; i < floorTiles.length; i++) {
      const t = floorTiles[i];
      _dummy.position.set(t.x, 0.01, t.z);
      _dummy.rotation.set(-Math.PI / 2, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      _color.set(t.dark ? "#0a0a0a" : "#1a1a1a");
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [floorTiles]);

  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[floorW + 1.2, 0.2, floorD + 1.2]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <instancedMesh ref={floorMesh} args={[undefined, undefined, floorTiles.length]} frustumCulled={false}>
        <planeGeometry args={[TILE * 0.98, TILE * 0.98]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {/* yellow lane accents */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[0.08, floorD]} />
        <meshBasicMaterial color={PALETTE.accentHot} toneMapped={false} />
      </mesh>
      <instancedMesh
        name="maze-walls"
        ref={wallMesh}
        args={[undefined, undefined, walls.length]}
        frustumCulled
      >
        <boxGeometry args={[TILE * 0.92, 1.1, TILE * 0.92]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {doors.map((d, i) => (
        <mesh key={i} position={[d.x, 0.2, d.z]}>
          <boxGeometry args={[TILE * 0.9, 0.28, 0.1]} />
          <meshBasicMaterial color={PALETTE.door} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
