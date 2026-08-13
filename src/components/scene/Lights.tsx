import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
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
      camera.far = 60;
      camera.near = 0.1;
      camera.updateProjectionMatrix();
    }
  }, [viewMode, scene, camera]);

  return (
    <>
      <color attach="background" args={["#241816"]} />
      {viewMode === "3d" && <fog attach="fog" args={["#241816", 18, 36]} />}
      <hemisphereLight args={["#fff4e5", "#3a2a22", 1.15]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 16, 6]} intensity={1.25} />
    </>
  );
}
