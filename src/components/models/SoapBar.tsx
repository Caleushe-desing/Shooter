import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { GhostMode } from "../../game/types";

interface SoapBarProps {
  color: string;
  mode: GhostMode;
}

export function SoapBar({ color, mode }: SoapBarProps) {
  const group = useRef<Group>(null);
  const eaten = mode === "eaten";
  const scared = mode === "frightened";
  const house = mode === "house";
  const bodyColor = scared ? "#00e5ff" : color;

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.y = 0.28 + Math.sin(t * (scared ? 8 : 3) + color.length) * (scared ? 0.06 : 0.03);
  });

  if (eaten) {
    return (
      <group ref={group} position={[0, 0.35, 0]}>
        <Eyes scared={false} spacing={0.16} />
      </group>
    );
  }

  return (
    <group ref={group} position={[0, 0.28, 0]} scale={house ? 0.85 : 1}>
      <mesh>
        <boxGeometry args={[0.62, 0.32, 0.42]} />
        <meshLambertMaterial
          color={bodyColor}
          transparent={scared}
          opacity={scared ? 0.82 : 1}
        />
      </mesh>
      <Eyes scared={scared} spacing={0.14} />
    </group>
  );
}

function Eyes({ scared, spacing }: { scared: boolean; spacing: number }) {
  return (
    <group position={[0, 0.06, 0.2]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * spacing, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, scared ? -0.02 : 0.01, 0.05]}>
            <sphereGeometry args={[0.035, 5, 5]} />
            <meshBasicMaterial color={scared ? "#2244aa" : "#111111"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
