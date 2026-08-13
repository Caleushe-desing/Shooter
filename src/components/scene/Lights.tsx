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
      {viewMode === "3d" && <fog attach="fog" args={[PALETTE.fog, 26, 54]} />}
      <hemisphereLight args={[PALETTE.hemiSky, PALETTE.hemiGround, 1.2]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 16, 6]} intensity={1.15} color="#e8fffb" />
      <pointLight position={[0, 5, 0]} intensity={0.35} distance={22} color="#5dffd2" />
    </>
  );
}
