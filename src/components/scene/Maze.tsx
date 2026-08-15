import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import { NEON_WALLS, PALETTE, TILE } from "../../constants";
import { gridToWorld } from "../../maze/grid";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";

const _dummy = new Object3D();
const _color = new Color();

/** Laberinto neón suave: mismos colores, bordes limpios. */
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
      _dummy.position.set(w.x, 0.4, w.z);
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
      _color.set(t.dark ? "#14141c" : "#1e1e2a");
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [floorTiles]);

  return (
    <group>
      <mesh position={[0, -0.12, 0]} receiveShadow={false}>
        <boxGeometry args={[floorW + 1.2, 0.2, floorD + 1.2]} />
        <meshStandardMaterial color="#050508" roughness={0.9} metalness={0} />
      </mesh>
      <instancedMesh ref={floorMesh} args={[undefined, undefined, floorTiles.length]} frustumCulled={false}>
        <planeGeometry args={[TILE * 0.995, TILE * 0.995]} />
        <meshStandardMaterial roughness={0.85} metalness={0.05} toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        name="maze-walls"
        ref={wallMesh}
        args={[undefined, undefined, walls.length]}
        frustumCulled
      >
        <boxGeometry args={[TILE * 0.9, 0.78, TILE * 0.9]} />
        <meshStandardMaterial roughness={0.32} metalness={0.12} toneMapped={false} />
      </instancedMesh>
      {doors.map((d, i) => (
        <mesh key={i} position={[d.x, 0.22, d.z]}>
          <boxGeometry args={[TILE * 0.88, 0.22, 0.08]} />
          <meshStandardMaterial
            color={PALETTE.door}
            emissive={PALETTE.door}
            emissiveIntensity={0.55}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
