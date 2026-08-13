import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { PALETTE, TILE } from "../../constants";
import { gridToWorld } from "../../maze/grid";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";
import { useTileTexture, useWallTexture } from "../models/textures";

const _dummy = new Object3D();

export function Maze() {
  const wallTex = useWallTexture();
  const floorTex = useTileTexture(PALETTE.floorA, PALETTE.floorB, PALETTE.floorGrout);
  // One texture tile per maze cell — stable under camera motion.
  floorTex.repeat.set(COLS, ROWS);

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
      _dummy.position.set(w.x, 0.575, w.z);
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
      {/* Skirt sits fully below the walkable floor to avoid z-fighting shimmer. */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[floorW + 1.2, 0.28, floorD + 1.2]} />
        <meshLambertMaterial color={PALETTE.skirt} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[floorW, floorD, 1, 1]} />
        <meshLambertMaterial map={floorTex} />
      </mesh>
      <instancedMesh
        name="maze-walls"
        ref={wallMesh}
        args={[undefined, undefined, walls.length]}
        frustumCulled
      >
        {/* Slightly shorter so a steep chase cam clears corridor tops more often. */}
        <boxGeometry args={[TILE * 0.96, 1.15, TILE * 0.96]} />
        <meshLambertMaterial map={wallTex} color={PALETTE.wallTint} />
      </instancedMesh>
      {doors.map((d, i) => (
        <mesh key={i} position={[d.x, 0.18, d.z]}>
          <boxGeometry args={[TILE * 0.92, 0.22, 0.12]} />
          <meshLambertMaterial
            color={PALETTE.door}
            emissive={PALETTE.doorGlow}
            emissiveIntensity={0.45}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
