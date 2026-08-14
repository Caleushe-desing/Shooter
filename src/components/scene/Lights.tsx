import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PALETTE } from "../../constants";
import { useHud } from "../../store/gameStore";

/** Luz suave para neón limpio (sin look pixel). */
export function Lights() {
  const viewMode = useHud((s) => s.viewMode);
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.fog = null;
    if (viewMode === "2d") {
      camera.far = 120;
      camera.near = 0.5;
    } else {
      camera.far = 80;
      camera.near = 0.08;
    }
    camera.updateProjectionMatrix();
  }, [viewMode, scene, camera]);

  return (
    <>
      <color attach="background" args={[PALETTE.bg]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={[PALETTE.hemiSky, PALETTE.hemiGround, 0.55]} />
      <directionalLight position={[6, 14, 4]} intensity={0.85} />
      <pointLight position={[0, 6, 0]} intensity={0.45} distance={40} color="#ffffff" />
    </>
  );
}
