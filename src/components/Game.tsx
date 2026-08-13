import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import {
  playDeath,
  playEatGhost,
  playPower,
  playReady,
  playStart,
  playWaka,
  playWin,
  setMuted,
  unlockAudio,
} from "../audio/sfx";
import { dirFromKeys } from "../game/engine";
import { engine } from "../game/instance";
import { useHud } from "../store/gameStore";
import { GhostActors, Pellets, PlayerActor } from "./scene/Actors";
import { CameraRig } from "./scene/CameraRig";
import { Lights } from "./scene/Lights";
import { Maze } from "./scene/Maze";
import { HUD } from "./ui/HUD";
import { MobilePad } from "./ui/MobilePad";
import { Overlay } from "./ui/Overlay";

export function Game() {
  useEffect(() => {
    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
      }
      keys.add(key);
      unlockAudio();
      const dir = dirFromKeys(keys);
      if (dir) engine.setInput(dir);

      if (key === "m") {
        useHud.getState().toggleMuted();
        setMuted(useHud.getState().muted);
      }
      if (key === "p" || key === "escape") engine.pauseToggle();
      if (key === "enter" || key === " ") startOrRestart();
    };
    const onUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 10, 12], fov: 50, near: 0.1, far: 80 }}
        dpr={[1, 1.75]}
      >
        <Lights />
        <Maze />
        <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={28} blur={2.2} far={8} />
        <PlayerActor engine={engine} />
        <GhostActors engine={engine} />
        <Pellets engine={engine} />
        <CameraRig engine={engine} />
        <SimLoop />
      </Canvas>
      <HUD />
      <Overlay onStart={startOrRestart} />
      <MobilePad onDir={(dir) => engine.setInput(dir)} />
    </div>
  );
}

function startOrRestart(): void {
  unlockAudio();
  if (engine.status === "menu" || engine.status === "gameover") {
    engine.startGame();
    playStart();
    syncHud();
  } else if (engine.status === "paused") {
    engine.status = "playing";
    syncHud();
  }
}

function SimLoop() {
  const mobileDir = useHud((s) => s.mobileDir);

  useFrame((_, dt) => {
    if (mobileDir) engine.setInput(mobileDir);
    const events = engine.update(dt);
    for (const ev of events) {
      if (ev.kind === "pellet") playWaka();
      if (ev.kind === "power") playPower();
      if (ev.kind === "ghostEat") playEatGhost();
      if (ev.kind === "death") playDeath();
      if (ev.kind === "winFanfare") playWin();
      if (ev.kind === "ready") playReady();
    }
    syncHud();
  });
  return null;
}

function syncHud(): void {
  useHud.getState().setHud({
    status: engine.status,
    score: engine.score,
    lives: engine.lives,
    level: engine.level,
    remaining: engine.remainingPellets(),
    frightened: engine.frightenedTimer > 0,
    ghostPhase: engine.ghosts.map((g) => g.mode).join(","),
  });
}
