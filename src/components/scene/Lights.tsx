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
      {viewMode === "3d" && <fog attach="fog" args={[PALETTE.fog, 30, 58]} />}
      <hemisphereLight args={[PALETTE.hemiSky, PALETTE.hemiGround, 1.2]} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[8, 16, 6]} intensity={1.35} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={0.4} distance={24} color="#b8ff3c" />
      <pointLight position={[-5, 3, 5]} intensity={0.3} distance={18} color="#00e5ff" />
    </>
  );
}
