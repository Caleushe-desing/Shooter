export function Lights() {
  return (
    <>
      <color attach="background" args={["#241816"]} />
      <fog attach="fog" args={["#241816", 22, 48]} />
      <hemisphereLight args={["#fff4e5", "#3a2a22", 0.85]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 16, 6]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <pointLight position={[0, 4, 0]} intensity={0.6} distance={18} color="#ffe0c0" />
    </>
  );
}
