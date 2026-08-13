import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { SOAP_COLORS } from "../../constants";
import type { CacamanEngine } from "../../game/engine";
import { gridToWorld } from "../../maze/grid";
import { useHud } from "../../store/gameStore";
import { Poop } from "../models/Poop";
import { SoapBar } from "../models/SoapBar";
import { ToiletPaper } from "../models/ToiletPaper";

const YAW: Record<string, number> = {
  up: Math.PI,
  down: 0,
  left: Math.PI / 2,
  right: -Math.PI / 2,
};

export function PlayerActor({ engine }: { engine: CacamanEngine }) {
  const ref = useRef<Group>(null);
  const dying = useHud((s) => s.status === "dying");
  const moving = useHud((s) => s.status === "playing");

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = engine.player;
    const w = gridToWorld(p.col, p.row);
    g.position.set(w.x, 0, w.z);
    g.rotation.y = YAW[p.dir] ?? 0;
  });

  return (
    <group ref={ref}>
      <ToiletPaper dying={dying} moving={moving && !dying} />
    </group>
  );
}

export function GhostActors({ engine }: { engine: CacamanEngine }) {
  return (
    <>
      {engine.ghosts.map((ghost) => (
        <GhostMesh key={ghost.id} engine={engine} id={ghost.id} />
      ))}
    </>
  );
}

function GhostMesh({ engine, id }: { engine: CacamanEngine; id: (typeof engine.ghosts)[number]["id"] }) {
  const ref = useRef<Group>(null);
  const mode = useHud((s) => {
    void s.ghostPhase;
    return engine.ghosts.find((x) => x.id === id)?.mode ?? "scatter";
  });

  useFrame(() => {
    const g = ref.current;
    const ghost = engine.ghosts.find((x) => x.id === id);
    if (!g || !ghost) return;
    const w = gridToWorld(ghost.col, ghost.row);
    g.position.set(w.x, 0, w.z);
    g.rotation.y = YAW[ghost.dir] ?? 0;
  });

  return (
    <group ref={ref}>
      <SoapBar color={SOAP_COLORS[id]} mode={mode} />
    </group>
  );
}

export function Pellets({ engine }: { engine: CacamanEngine }) {
  const remaining = useHud((s) => s.remaining);
  const status = useHud((s) => s.status);
  void status;

  return (
    <>
      {[...engine.pellets].map((k) => {
        const [c, r] = k.split(",").map(Number);
        const w = gridToWorld(c, r);
        return (
          <group key={`p-${k}-${remaining}`} position={[w.x, 0, w.z]}>
            <Poop />
          </group>
        );
      })}
      {[...engine.powerPellets].map((k) => {
        const [c, r] = k.split(",").map(Number);
        const w = gridToWorld(c, r);
        return (
          <group key={`o-${k}-${remaining}`} position={[w.x, 0, w.z]}>
            <Poop power />
          </group>
        );
      })}
    </>
  );
}
