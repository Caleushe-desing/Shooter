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
      <hemisphereLight args={[PALETTE.hemiSky, PALETTE.hemiGround, 1.25]} />
      <ambientLight intensity={0.58} />
      <directionalLight position={[8, 16, 6]} intensity={1.3} color="#fff0f6" />
      <pointLight position={[0, 5, 0]} intensity={0.45} distance={24} color="#ff6b9d" />
      <pointLight position={[-6, 3, 4]} intensity={0.25} distance={18} color="#ffe566" />
    </>
  );
}
