import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PALETTE } from "../../constants";
import { useHud } from "../../store/gameStore";

/** Luz mínima 80s: negro + un toque, los meshBasic llevan el color. */
export function Lights() {
  const viewMode = useHud((s) => s.viewMode);
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.fog = null;
    if (viewMode === "2d") {
      camera.far = 120;
      camera.near = 0.5;
    } else {
      camera.far = 70;
      camera.near = 0.2;
    }
    camera.updateProjectionMatrix();
  }, [viewMode, scene, camera]);

  return (
    <>
      <color attach="background" args={[PALETTE.bg]} />
      <ambientLight intensity={1} />
    </>
  );
}
