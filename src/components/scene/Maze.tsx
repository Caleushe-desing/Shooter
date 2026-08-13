import { useMemo } from "react";
import type { CanvasTexture } from "three";
import { TILE } from "../../constants";
import { COLS, ROWS, isDoor, isWall } from "../../maze/layout";
import { gridToWorld } from "../../maze/grid";
import { useTileTexture, useWallTexture } from "../models/textures";

export function Maze() {
  const wallTex = useWallTexture();
  const floorTex = useTileTexture("#efe6d6", "#e4d8c4", "#c9bba6");
  floorTex.repeat.set(COLS / 2, ROWS / 2);

  const walls = useMemo(() => {
    const list: { x: number; z: number; door?: boolean }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isWall(c, r) || isDoor(c, r)) {
          const { x, z } = gridToWorld(c, r);
          list.push({ x, z, door: isDoor(c, r) });
        }
      }
    }
    return list;
  }, []);

  const floorW = COLS * TILE + 2.4;
  const floorD = ROWS * TILE + 2.4;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[floorW, floorD]} />
        <meshStandardMaterial map={floorTex} roughness={0.55} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[COLS * TILE, ROWS * TILE]} />
        <meshStandardMaterial color="#d7c4a8" transparent opacity={0.18} />
      </mesh>
      {walls.map((w, i) => (
        <Wall key={i} x={w.x} z={w.z} door={w.door} texture={wallTex} />
      ))}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[floorW + 1.2, 0.24, floorD + 1.2]} />
        <meshStandardMaterial color="#b9a48a" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Wall({
  x,
  z,
  door,
  texture,
}: {
  x: number;
  z: number;
  door?: boolean;
  texture: CanvasTexture;
}) {
  if (door) {
    return (
      <mesh position={[x, 0.18, z]}>
        <boxGeometry args={[TILE * 0.92, 0.22, 0.12]} />
        <meshStandardMaterial color="#7ec8e8" emissive="#3aa0c8" emissiveIntensity={0.4} transparent opacity={0.75} />
      </mesh>
    );
  }
  return (
    <mesh position={[x, 0.72, z]} castShadow receiveShadow>
      <boxGeometry args={[TILE * 0.96, 1.44, TILE * 0.96]} />
      <meshStandardMaterial map={texture} roughness={0.35} metalness={0.12} color="#f2f8fa" />
    </mesh>
  );
}
