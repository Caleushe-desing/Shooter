import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

interface PoopProps {
  power?: boolean;
}

export function Poop({ power = false }: PoopProps) {
  const group = useRef<Group>(null);
  const s = power ? 1.35 : 0.55;

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = performance.now() / 1000;
    if (power) {
      const pulse = 1 + Math.sin(t * 5) * 0.12;
      g.scale.setScalar(s * pulse);
      g.rotation.y = t * 1.5;
    } else {
      g.scale.setScalar(s);
      g.rotation.y = t * 0.4;
    }
  });

  return (
    <group ref={group} position={[0, power ? 0.22 : 0.1, 0]} scale={s}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#5c3317" roughness={0.7} />
      </mesh>
      <mesh position={[0.01, 0.14, 0.02]} castShadow>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#6b3a1f" roughness={0.68} />
      </mesh>
      <mesh position={[0.02, 0.22, 0.03]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#7a4624" roughness={0.65} />
      </mesh>
      {power && (
        <mesh position={[0.04, 0.3, 0.02]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#8b5330" emissive="#4a2a10" emissiveIntensity={0.4} />
        </mesh>
      )}
      {power && (
        <pointLight color="#c47a3a" intensity={1.4} distance={3.2} decay={2} position={[0, 0.3, 0]} />
      )}
    </group>
  );
}
