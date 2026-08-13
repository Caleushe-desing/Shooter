import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
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
    // Cheap bob only — avoid high-frequency wobble on mobile GPUs.
    g.position.y = 0.38 + (moving ? Math.sin(performance.now() * 0.004) * 0.03 : 0.01);
    g.rotation.x = 0;
    g.rotation.z = 0;
  });

  return (
    <group ref={group} position={[0, 0.42, 0]} scale={1.15}>
      <mesh>
        <cylinderGeometry args={[0.34, 0.34, 0.52, 12]} />
        <meshLambertMaterial map={paper} color="#ffffff" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.14, 0.14, 0.54, 8]} />
        <meshLambertMaterial color="#c4a574" />
      </mesh>
      <mesh position={[0.13, 0.12, 0.28]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.13, 0.12, 0.28]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}
