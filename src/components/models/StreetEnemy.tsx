import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { GhostId, GhostMode } from "../../game/types";

interface StreetEnemyProps {
  id: GhostId;
  color: string;
  mode: GhostMode;
}

/** Enemigos flat 80s — una forma por tipo, sin detalles. */
export function StreetEnemy({ id, color, mode }: StreetEnemyProps) {
  const group = useRef<Group>(null);
  const eaten = mode === "eaten";
  const scared = mode === "frightened";
  const house = mode === "house";
  const body = scared ? "#aa00ff" : color;

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    g.position.y = 0.28 + Math.sin(clock.elapsedTime * (scared ? 10 : 3) + id.length) * 0.04;
  });

  if (eaten) {
    return (
      <group ref={group}>
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={group} scale={house ? 0.8 : 1}>
      {id === "blinky" && (
        <mesh>
          <boxGeometry args={[0.55, 0.4, 0.35]} />
          <meshBasicMaterial color={body} toneMapped={false} transparent={scared} opacity={0.85} />
        </mesh>
      )}
      {id === "pinky" && (
        <mesh>
          <sphereGeometry args={[0.28, 6, 5]} />
          <meshBasicMaterial color={body} toneMapped={false} transparent={scared} opacity={0.85} />
        </mesh>
      )}
      {id === "inky" && (
        <mesh>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshBasicMaterial color={body} toneMapped={false} transparent={scared} opacity={0.85} />
        </mesh>
      )}
      {id === "clyde" && (
        <mesh>
          <coneGeometry args={[0.28, 0.55, 5]} />
          <meshBasicMaterial color={body} toneMapped={false} transparent={scared} opacity={0.85} />
        </mesh>
      )}
      <mesh position={[-0.1, 0.05, 0.2]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      <mesh position={[0.1, 0.05, 0.2]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
    </group>
  );
}
