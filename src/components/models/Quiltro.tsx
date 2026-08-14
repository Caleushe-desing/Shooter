import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { PALETTE } from "../../constants";

interface QuiltroProps {
  dying?: boolean;
  moving?: boolean;
}

/** Quiltro suave: mismas colores, mallas redondas. */
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
    <group ref={group} position={[0, 0.3, 0]}>
      <mesh castShadow={false}>
        <sphereGeometry args={[0.32, 32, 24]} />
        <meshStandardMaterial
          color={PALETTE.paper}
          emissive={PALETTE.paper}
          emissiveIntensity={0.22}
          roughness={0.35}
          metalness={0.05}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.18, 0.26, 0]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial
          color={PALETTE.paperCore}
          emissive={PALETTE.paperCore}
          emissiveIntensity={0.15}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.18, 0.26, 0]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial
          color={PALETTE.paperCore}
          emissive={PALETTE.paperCore}
          emissiveIntensity={0.15}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.1, 0.08, 0.26]}>
        <sphereGeometry args={[0.045, 12, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.1, 0.08, 0.26]}>
        <sphereGeometry args={[0.045, 12, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.5} toneMapped={false} />
      </mesh>
      {/* bandera suave */}
      <mesh position={[0, -0.04, 0.3]}>
        <boxGeometry args={[0.28, 0.09, 0.02]} />
        <meshStandardMaterial color="#0033a0" roughness={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[0.1, -0.04, 0.301]}>
        <boxGeometry args={[0.09, 0.09, 0.02]} />
        <meshStandardMaterial color="#d52b1e" roughness={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[-0.1, -0.04, 0.301]}>
        <boxGeometry args={[0.09, 0.09, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.45} toneMapped={false} />
      </mesh>
    </group>
  );
}
