import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { GhostMode } from "../../game/types";

interface SoapBarProps {
  color: string;
  mode: GhostMode;
  name?: string;
}

export function SoapBar({ color, mode }: SoapBarProps) {
  const group = useRef<Group>(null);
  const eaten = mode === "eaten";
  const scared = mode === "frightened";
  const house = mode === "house";
  const bodyColor = scared ? "#9ad7ff" : color;

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = performance.now() / 1000;
    g.position.y = 0.28 + Math.sin(t * (scared ? 10 : 3.4) + color.length) * (scared ? 0.08 : 0.04);
    g.rotation.y = Math.sin(t * 1.4) * 0.15;
    if (scared) g.rotation.z = Math.sin(t * 18) * 0.12;
    else g.rotation.z *= 0.8;
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
      <RoundedBox args={[0.62, 0.32, 0.42]} radius={0.08} smoothness={4} castShadow>
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.28}
          metalness={0.08}
          transparent={scared}
          opacity={scared ? 0.82 : 1}
        />
      </RoundedBox>
      <mesh position={[0, 0.17, 0]} rotation={[0, 0, 0.2]}>
        <torusGeometry args={[0.12, 0.03, 8, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} transparent opacity={0.55} />
      </mesh>
      <Eyes scared={scared} spacing={0.14} />
      {scared && <Bubbles />}
    </group>
  );
}

function Eyes({ scared, spacing }: { scared: boolean; spacing: number }) {
  return (
    <group position={[0, 0.06, 0.2]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * spacing, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, scared ? -0.02 : 0.01, 0.05]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={scared ? "#2244aa" : "#111111"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Bubbles() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 400;
    ref.current.children.forEach((child, i) => {
      child.position.y = 0.25 + ((t + i * 0.3) % 1.2) * 0.45;
      const s = 0.04 + (i % 3) * 0.015;
      child.scale.setScalar(s);
    });
  });
  return (
    <group ref={ref}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i - 1.5) * 0.12, 0.3, 0.1]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#d9f4ff" transparent opacity={0.55} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
