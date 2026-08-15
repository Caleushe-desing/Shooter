import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { GhostId, GhostMode } from "../../game/types";

interface StreetEnemyProps {
  id: GhostId;
  color: string;
  mode: GhostMode;
}

function BodyMat({
  color,
  scared,
}: {
  color: string;
  scared: boolean;
}) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={scared ? 0.45 : 0.28}
      roughness={0.32}
      metalness={0.08}
      transparent={scared}
      opacity={scared ? 0.88 : 1}
      toneMapped={false}
    />
  );
}

/** Enemigos suaves — mismos colores neón, sin low-poly. */
export function StreetEnemy({ id, color, mode }: StreetEnemyProps) {
  const group = useRef<Group>(null);
  const eaten = mode === "eaten";
  const scared = mode === "frightened";
  const house = mode === "house";
  const body = scared ? "#aa00ff" : color;

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    g.position.y = 0.3 + Math.sin(clock.elapsedTime * (scared ? 10 : 3) + id.length) * 0.04;
  });

  if (eaten) {
    return (
      <group ref={group}>
        <mesh position={[-0.1, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} toneMapped={false} />
        </mesh>
        <mesh position={[0.1, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} toneMapped={false} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={group} scale={house ? 0.8 : 1}>
      {id === "blinky" && (
        <mesh>
          <capsuleGeometry args={[0.22, 0.18, 8, 16]} />
          <BodyMat color={body} scared={scared} />
        </mesh>
      )}
      {id === "pinky" && (
        <mesh>
          <sphereGeometry args={[0.3, 24, 18]} />
          <BodyMat color={body} scared={scared} />
        </mesh>
      )}
      {id === "inky" && (
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <capsuleGeometry args={[0.18, 0.12, 6, 14]} />
          <BodyMat color={body} scared={scared} />
        </mesh>
      )}
      {id === "clyde" && (
        <mesh>
          <coneGeometry args={[0.28, 0.55, 24]} />
          <BodyMat color={body} scared={scared} />
        </mesh>
      )}
      <mesh position={[-0.1, 0.06, 0.22]}>
        <sphereGeometry args={[0.045, 12, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.1, 0.06, 0.22]}>
        <sphereGeometry args={[0.045, 12, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.5} toneMapped={false} />
      </mesh>
    </group>
  );
}
