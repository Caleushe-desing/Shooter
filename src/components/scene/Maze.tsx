import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { TILE } from "../../constants";
import { gridToWorld } from "../../maze/grid";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";
import { useTileTexture, useWallTexture } from "../models/textures";

const _dummy = new Object3D();

export function Maze() {
  const wallTex = useWallTexture();
  const floorTex = useTileTexture("#efe6d6", "#e4d8c4", "#c9bba6");
  floorTex.repeat.set(COLS / 2, ROWS / 2);

  const { walls, doors } = useMemo(() => {
    const walls: { x: number; z: number }[] = [];
    const doors: { x: number; z: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isDoor(c, r)) {
          const { x, z } = gridToWorld(c, r);
          doors.push({ x, z });
        } else if (isWall(c, r)) {
          const { x, z } = gridToWorld(c, r);
          walls.push({ x, z });
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
      _dummy.position.set(w.x, 0.72, w.z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [walls]);

  const floorW = COLS * TILE + 2.4;
  const floorD = ROWS * TILE + 2.4;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[floorW, floorD]} />
        <meshLambertMaterial map={floorTex} />
      </mesh>
      <instancedMesh ref={wallMesh} args={[undefined, undefined, walls.length]} frustumCulled>
        <boxGeometry args={[TILE * 0.96, 1.44, TILE * 0.96]} />
        <meshLambertMaterial map={wallTex} color="#f2f8fa" />
      </instancedMesh>
      {doors.map((d, i) => (
        <mesh key={i} position={[d.x, 0.18, d.z]}>
          <boxGeometry args={[TILE * 0.92, 0.22, 0.12]} />
          <meshLambertMaterial color="#7ec8e8" emissive="#3aa0c8" emissiveIntensity={0.35} transparent opacity={0.75} />
        </mesh>
      ))}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[floorW + 1.2, 0.24, floorD + 1.2]} />
        <meshLambertMaterial color="#b9a48a" />
      </mesh>
    </group>
  );
}
