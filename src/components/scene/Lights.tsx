export function Lights() {
  return (
    <>
      <color attach="background" args={["#241816"]} />
      <fog attach="fog" args={["#241816", 24, 42]} />
      <hemisphereLight args={["#fff4e5", "#3a2a22", 1.05]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 16, 6]} intensity={1.15} />
    </>
  );
}
