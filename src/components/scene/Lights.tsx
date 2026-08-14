import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PALETTE } from "../../constants";
import { useHud } from "../../store/gameStore";

export function Lights() {
  const viewMode = useHud((s) => s.viewMode);
  const { scene, camera } = useThree();

  useEffect(() => {
    if (viewMode === "2d") {
      scene.fog = null;
      camera.far = 120;
      camera.near = 0.5;
      camera.updateProjectionMatrix();
    } else {
      camera.far = 70;
      camera.near = 0.2;
      camera.updateProjectionMatrix();
    }
  }, [viewMode, scene, camera]);

  return (
    <>
      <color attach="background" args={[PALETTE.bg]} />
      {viewMode === "3d" && <fog attach="fog" args={[PALETTE.fog, 28, 56]} />}
      <hemisphereLight args={[PALETTE.hemiSky, PALETTE.hemiGround, 1.15]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[7, 15, 5]} intensity={1.25} color="#ffe8f5" />
      <pointLight position={[0, 4.5, 0]} intensity={0.55} distance={22} color="#ff2d95" />
      <pointLight position={[-6, 3, 4]} intensity={0.35} distance={16} color="#00d4c8" />
      <pointLight position={[6, 3, -3]} intensity={0.3} distance={16} color="#ffe600" />
    </>
  );
}
