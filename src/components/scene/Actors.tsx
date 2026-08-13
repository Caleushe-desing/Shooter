import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { InstancedMesh, Object3D, Vector3, type Group, type Mesh } from "three";
import { SOAP_COLORS } from "../../constants";
import type { CacamanEngine } from "../../game/engine";
import type { GhostId, GhostMode } from "../../game/types";
import { gridToWorld } from "../../maze/grid";
import { useHud } from "../../store/gameStore";
import { SoapBar } from "../models/SoapBar";
import { ToiletPaper } from "../models/ToiletPaper";
import { isBlockedByWalls, setMeshesDepthTest } from "./occlusion";

const YAW: Record<string, number> = {
  up: Math.PI,
  down: 0,
  left: Math.PI / 2,
  right: -Math.PI / 2,
};

const _dummy = new Object3D();
const _from = new Vector3();
const _to = new Vector3();

function shortestAngle(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function useWallXray(ref: RefObject<Group | null>, enabled: boolean) {
  const { camera, scene } = useThree();
  const wasOccluded = useRef(false);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    if (!enabled) {
      if (wasOccluded.current) {
        setMeshesDepthTest(g, true);
        g.renderOrder = 0;
        wasOccluded.current = false;
      }
      return;
    }
    const walls = scene.getObjectByName("maze-walls");
    _from.copy(camera.position);
    _to.set(g.position.x, g.position.y + 0.45, g.position.z);
    const occluded = isBlockedByWalls(_from, _to, walls, 0.2);
    if (occluded !== wasOccluded.current) {
      setMeshesDepthTest(g, !occluded);
      g.renderOrder = occluded ? 10 : 0;
      wasOccluded.current = occluded;
    }
  });
}

export function PlayerActor({ engine }: { engine: CacamanEngine }) {
  const ref = useRef<Group>(null);
  const dying = useHud((s) => s.status === "dying");
  const moving = useHud((s) => s.status === "playing");
  const viewMode = useHud((s) => s.viewMode);
  useWallXray(ref, viewMode === "3d");

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const p = engine.player;
    const w = gridToWorld(p.col, p.row);
    g.position.set(w.x, 0, w.z);
    const target = YAW[p.dir] ?? 0;
    const k = 1 - Math.exp(-dt * 14);
    g.rotation.y += shortestAngle(g.rotation.y, target) * k;
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

function GhostMesh({ engine, id }: { engine: CacamanEngine; id: GhostId }) {
  const ref = useRef<Group>(null);
  const viewMode = useHud((s) => s.viewMode);
  useWallXray(ref, viewMode === "3d");
  const [mode, setMode] = useState<GhostMode>(
    () => engine.ghosts.find((x) => x.id === id)?.mode ?? "scatter",
  );
  const modeRef = useRef(mode);

  useFrame(() => {
    const g = ref.current;
    const ghost = engine.ghosts.find((x) => x.id === id);
    if (!g || !ghost) return;
    const w = gridToWorld(ghost.col, ghost.row);
    g.position.set(w.x, 0, w.z);
    g.rotation.y = YAW[ghost.dir] ?? 0;
    if (ghost.mode !== modeRef.current) {
      modeRef.current = ghost.mode;
      setMode(ghost.mode);
    }
  });

  return (
    <group ref={ref}>
      <SoapBar color={SOAP_COLORS[id]} mode={mode} />
    </group>
  );
}

/** One draw call for all normal pellets; power pellets stay as a few cheap meshes. */
export function Pellets({ engine }: { engine: CacamanEngine }) {
  const mesh = useRef<InstancedMesh>(null);
  const remaining = useHud((s) => s.remaining);
  const status = useHud((s) => s.status);
  const keys = useMemo(() => [...engine.pellets], [remaining, status]);
  const power = useMemo(() => [...engine.powerPellets], [remaining, status]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    let i = 0;
    for (const k of keys) {
      const [c, r] = k.split(",").map(Number);
      const w = gridToWorld(c, r);
      _dummy.position.set(w.x, 0.12, w.z);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      m.setMatrixAt(i++, _dummy.matrix);
    }
    m.count = keys.length;
    m.instanceMatrix.needsUpdate = true;
  }, [keys]);

  return (
    <group>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, Math.max(keys.length, 1)]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.11, 6, 5]} />
        <meshLambertMaterial color="#6b3a1f" />
      </instancedMesh>
      {power.map((k) => {
        const [c, r] = k.split(",").map(Number);
        const w = gridToWorld(c, r);
        return <PowerPellet key={k} x={w.x} z={w.z} />;
      })}
    </group>
  );
}

function PowerPellet({ x, z }: { x: number; z: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 4) * 0.1;
    m.scale.setScalar(pulse);
    m.rotation.y = t * 1.2;
  });
  return (
    <mesh ref={ref} position={[x, 0.22, z]}>
      <sphereGeometry args={[0.22, 8, 6]} />
      <meshLambertMaterial color="#8b5330" emissive="#4a2a10" emissiveIntensity={0.55} />
    </mesh>
  );
}
