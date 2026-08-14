import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { PALETTE } from "../../constants";

interface QuiltroProps {
  dying?: boolean;
  moving?: boolean;
}

/** Quiltro santiaguino — héroe callejero. */
export function Quiltro({ dying = false, moving = false }: QuiltroProps) {
  const group = useRef<Group>(null);
  const death = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (dying) {
      death.current += dt;
      g.rotation.z = death.current * 3;
      g.position.y = Math.max(-0.2, 0.2 - death.current * 0.35);
      g.scale.setScalar(Math.max(0.2, 1 - death.current * 0.4));
      return;
    }
    death.current = 0;
    g.scale.setScalar(1);
    g.position.y = 0.02 + (moving ? Math.sin(performance.now() * 0.012) * 0.04 : 0);
    g.rotation.z = moving ? Math.sin(performance.now() * 0.02) * 0.08 : 0;
  });

  return (
    <group ref={group} position={[0, 0.15, 0]} scale={1.05}>
      {/* cuerpo */}
      <mesh position={[0, 0.22, 0]} castShadow={false}>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshLambertMaterial color={PALETTE.paper} />
      </mesh>
      {/* cabeza */}
      <mesh position={[0, 0.42, 0.18]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshLambertMaterial color={PALETTE.paper} />
      </mesh>
      {/* orejas */}
      <mesh position={[-0.14, 0.56, 0.12]} rotation={[0.2, 0, -0.4]}>
        <coneGeometry args={[0.07, 0.18, 5]} />
        <meshLambertMaterial color="#c48a4a" />
      </mesh>
      <mesh position={[0.14, 0.56, 0.12]} rotation={[0.2, 0, 0.4]}>
        <coneGeometry args={[0.07, 0.18, 5]} />
        <meshLambertMaterial color="#c48a4a" />
      </mesh>
      {/* hocico */}
      <mesh position={[0, 0.38, 0.34]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshLambertMaterial color="#f7e6c8" />
      </mesh>
      <mesh position={[0, 0.38, 0.41]}>
        <sphereGeometry args={[0.035, 5, 5]} />
        <meshBasicMaterial color="#1a1010" />
      </mesh>
      {/* ojos */}
      <mesh position={[-0.07, 0.46, 0.32]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[0.07, 0.46, 0.32]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* patas */}
      {[
        [-0.14, -0.12],
        [0.14, -0.12],
        [-0.14, 0.12],
        [0.14, 0.12],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]}>
          <cylinderGeometry args={[0.045, 0.05, 0.22, 6]} />
          <meshLambertMaterial color="#b88955" />
        </mesh>
      ))}
      {/* cola */}
      <mesh position={[0, 0.28, -0.28]} rotation={[0.8, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.22, 5]} />
        <meshLambertMaterial color="#c48a4a" />
      </mesh>
      {/* pañuelo tricolor chileno (rompe con lo “lindo”) */}
      <mesh position={[0, 0.34, 0.02]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.34, 0.06, 0.08]} />
        <meshBasicMaterial color="#0033a0" />
      </mesh>
      <mesh position={[0.12, 0.34, 0.02]}>
        <boxGeometry args={[0.1, 0.06, 0.085]} />
        <meshBasicMaterial color="#d52b1e" />
      </mesh>
      <mesh position={[-0.12, 0.34, 0.02]}>
        <boxGeometry args={[0.1, 0.06, 0.085]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
