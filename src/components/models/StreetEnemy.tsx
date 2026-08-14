import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { GhostId, GhostMode } from "../../game/types";

interface StreetEnemyProps {
  id: GhostId;
  color: string;
  mode: GhostMode;
}

/** Micro / Gaviota / Delivery / Inspector */
export function StreetEnemy({ id, color, mode }: StreetEnemyProps) {
  const group = useRef<Group>(null);
  const eaten = mode === "eaten";
  const scared = mode === "frightened";
  const house = mode === "house";
  const bodyColor = scared ? "#7c5cff" : color;

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.y = 0.2 + Math.sin(t * (scared ? 9 : 3.2) + id.length) * (scared ? 0.07 : 0.03);
  });

  if (eaten) {
    return (
      <group ref={group} position={[0, 0.35, 0]}>
        <Eyes scared={false} />
      </group>
    );
  }

  return (
    <group ref={group} position={[0, 0.2, 0]} scale={house ? 0.85 : 1}>
      {id === "blinky" && <Micro color={bodyColor} scared={scared} />}
      {id === "pinky" && <Gaviota color={bodyColor} scared={scared} />}
      {id === "inky" && <Delivery color={bodyColor} scared={scared} />}
      {id === "clyde" && <Inspector color={bodyColor} scared={scared} />}
    </group>
  );
}

function Eyes({ scared }: { scared: boolean }) {
  return (
    <group position={[0, 0.08, 0.18]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.12, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, scared ? -0.02 : 0.01, 0.04]}>
            <sphereGeometry args={[0.03, 5, 5]} />
            <meshBasicMaterial color={scared ? "#3a1a8a" : "#111111"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Micro({ color, scared }: { color: string; scared: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.7, 0.38, 0.4]} />
        <meshLambertMaterial color={color} transparent={scared} opacity={scared ? 0.8 : 1} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.62, 0.16, 0.34]} />
        <meshLambertMaterial color="#8fd3ff" transparent opacity={0.7} />
      </mesh>
      <Eyes scared={scared} />
    </group>
  );
}

function Gaviota({ color, scared }: { color: string; scared: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color={color} transparent={scared} opacity={scared ? 0.8 : 1} />
      </mesh>
      <mesh position={[-0.28, 0.3, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.34, 0.05, 0.16]} />
        <meshLambertMaterial color="#cfcfcf" />
      </mesh>
      <mesh position={[0.28, 0.3, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.34, 0.05, 0.16]} />
        <meshLambertMaterial color="#cfcfcf" />
      </mesh>
      <mesh position={[0, 0.26, 0.24]}>
        <coneGeometry args={[0.04, 0.14, 4]} />
        <meshLambertMaterial color="#ff9f0a" />
      </mesh>
      <Eyes scared={scared} />
    </group>
  );
}

function Delivery({ color, scared }: { color: string; scared: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 10]} />
        <meshLambertMaterial color="#222222" />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshLambertMaterial color={color} transparent={scared} opacity={scared ? 0.8 : 1} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshLambertMaterial color="#f5c7a0" />
      </mesh>
      <Eyes scared={scared} />
    </group>
  );
}

function Inspector({ color, scared }: { color: string; scared: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.22, 0.5, 6]} />
        <meshLambertMaterial color={color} transparent={scared} opacity={scared ? 0.8 : 1} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 10]} />
        <meshLambertMaterial color="#111111" />
      </mesh>
      <Eyes scared={scared} />
    </group>
  );
}
