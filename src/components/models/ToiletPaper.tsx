import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { usePaperTexture } from "./textures";

interface ToiletPaperProps {
  dying?: boolean;
  moving?: boolean;
}

export function ToiletPaper({ dying = false, moving = false }: ToiletPaperProps) {
  const group = useRef<Group>(null);
  const paper = usePaperTexture();
  const death = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (dying) {
      death.current += dt;
      g.rotation.x = death.current * 4;
      g.position.y = Math.max(-0.2, 0.35 - death.current * 0.4);
      g.scale.setScalar(Math.max(0.15, 1 - death.current * 0.45));
      return;
    }
    death.current = 0;
    g.scale.setScalar(1);
    g.position.y = 0.38 + Math.sin(performance.now() / 220) * (moving ? 0.05 : 0.02);
    g.rotation.x = 0;
    if (moving) g.rotation.z = Math.sin(performance.now() / 70) * 0.12;
    else g.rotation.z *= 0.9;
  });

  const tubeMat = useMemo(
    () => ({ color: "#c4a574", roughness: 0.85, metalness: 0.05 }),
    [],
  );

  return (
    <group ref={group} position={[0, 0.42, 0]} scale={1.15}>
      <mesh castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.52, 28]} />
        <meshStandardMaterial map={paper} roughness={0.72} metalness={0} color="#ffffff" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.14, 0.14, 0.54, 16]} />
        <meshStandardMaterial {...tubeMat} />
      </mesh>
      <mesh position={[0.22, -0.08, 0.18]} rotation={[0.4, 0.6, 0.2]} castShadow>
        <boxGeometry args={[0.28, 0.02, 0.22]} />
        <meshStandardMaterial map={paper} roughness={0.7} />
      </mesh>
      <mesh position={[0.13, 0.12, 0.28]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.13, 0.12, 0.28]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.13, 0.135, 0.335]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.13, 0.135, 0.335]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
