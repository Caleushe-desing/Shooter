import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { PALETTE } from "../../constants";

interface QuiltroProps {
  dying?: boolean;
  moving?: boolean;
}

/** Quiltro minimal 80s: esferas + cajas flat. */
export function Quiltro({ dying = false, moving = false }: QuiltroProps) {
  const group = useRef<Group>(null);
  const death = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (dying) {
      death.current += dt;
      g.rotation.z = death.current * 4;
      g.scale.setScalar(Math.max(0.15, 1 - death.current * 0.5));
      return;
    }
    death.current = 0;
    g.scale.setScalar(1);
    g.position.y = moving ? Math.sin(performance.now() * 0.015) * 0.05 : 0;
    g.rotation.z = 0;
  });

  return (
    <group ref={group} position={[0, 0.28, 0]}>
      <mesh>
        <sphereGeometry args={[0.32, 8, 6]} />
        <meshBasicMaterial color={PALETTE.paper} toneMapped={false} />
      </mesh>
      <mesh position={[-0.18, 0.28, 0]} rotation={[0, 0, 0.35]}>
        <coneGeometry args={[0.1, 0.22, 4]} />
        <meshBasicMaterial color={PALETTE.paperCore} toneMapped={false} />
      </mesh>
      <mesh position={[0.18, 0.28, 0]} rotation={[0, 0, -0.35]}>
        <coneGeometry args={[0.1, 0.22, 4]} />
        <meshBasicMaterial color={PALETTE.paperCore} toneMapped={false} />
      </mesh>
      <mesh position={[-0.1, 0.08, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      <mesh position={[0.1, 0.08, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      {/* bandera flat */}
      <mesh position={[0, -0.05, 0.3]}>
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshBasicMaterial color="#0033a0" toneMapped={false} />
      </mesh>
      <mesh position={[0.1, -0.05, 0.3]}>
        <boxGeometry args={[0.08, 0.08, 0.021]} />
        <meshBasicMaterial color="#d52b1e" toneMapped={false} />
      </mesh>
      <mesh position={[-0.1, -0.05, 0.3]}>
        <boxGeometry args={[0.08, 0.08, 0.021]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}
