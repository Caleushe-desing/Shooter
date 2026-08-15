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
    g.position.y = moving ? Math.sin(performance.now() * 0.012) * 0.03 : 0;
    g.rotation.z = 0;
  });

  return (
    <group ref={group} position={[0, 0.58, 0]}>
      {/* cuerpo */}
      <mesh position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.3, 28, 20]} />
        <meshStandardMaterial
          color={PALETTE.paper}
          emissive={PALETTE.paper}
          emissiveIntensity={0.2}
          roughness={0.38}
          toneMapped={false}
        />
      </mesh>
      {/* cabeza */}
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.3, 32, 24]} />
        <meshStandardMaterial
          color={PALETTE.paper}
          emissive={PALETTE.paper}
          emissiveIntensity={0.22}
          roughness={0.35}
          metalness={0.05}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.16, 0.34, 0]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial
          color={PALETTE.paperCore}
          emissive={PALETTE.paperCore}
          emissiveIntensity={0.15}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.16, 0.34, 0]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial
          color={PALETTE.paperCore}
          emissive={PALETTE.paperCore}
          emissiveIntensity={0.15}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.09, 0.14, 0.26]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.09, 0.14, 0.26]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0.3]}>
        <boxGeometry args={[0.26, 0.08, 0.02]} />
        <meshStandardMaterial color="#0033a0" roughness={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[0.09, 0.02, 0.301]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#d52b1e" roughness={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[-0.09, 0.02, 0.301]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.45} toneMapped={false} />
      </mesh>
    </group>
  );
}
