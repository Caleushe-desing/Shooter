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
import { screenToWorld } from "../game/inputMap";
import { MAX_DPR } from "../perf";
import { useHud } from "../store/gameStore";
import { GhostActors, Pellets, PlayerActor } from "./scene/Actors";
import { CameraRig } from "./scene/CameraRig";
import { Lights } from "./scene/Lights";
import { Maze } from "./scene/Maze";
import { HUD } from "./ui/HUD";
import { Overlay } from "./ui/Overlay";
import { TouchControls } from "./ui/TouchControls";

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
      const screen = dirFromKeys(keys);
      if (screen) {
        const view = useHud.getState().viewMode;
        engine.setInput(screenToWorld(screen, view));
      }

      if (key === "m") {
        useHud.getState().toggleMuted();
        setMuted(useHud.getState().muted);
      }
      if (key === "v") useHud.getState().toggleViewMode();
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
        dpr={MAX_DPR}
        camera={{ position: [0, 10, 12], fov: 50, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          alpha: false,
        }}
        performance={{ min: 0.5 }}
      >
        <Lights />
        <Maze />
        <PlayerActor engine={engine} />
        <GhostActors engine={engine} />
        <Pellets engine={engine} />
        <CameraRig engine={engine} />
        <SimLoop />
      </Canvas>
      <TouchControls onDir={(dir) => engine.setInput(dir)} />
      <HUD />
      <Overlay onStart={startOrRestart} />
    </div>
  );
}

function startOrRestart(): void {
  unlockAudio();
  if (engine.status === "menu" || engine.status === "gameover") {
    engine.startGame();
    playStart();
    syncHud(true);
  } else if (engine.status === "paused") {
    engine.status = "playing";
    syncHud(true);
  }
}

function SimLoop() {
  useFrame((_, dt) => {
    const mobileDir = useHud.getState().mobileDir;
    if (mobileDir) engine.setInput(mobileDir);
    // Cap sim step so a hitch doesn't teleport actors.
    const events = engine.update(Math.min(dt, 1 / 30));
    for (const ev of events) {
      if (ev.kind === "pellet") playWaka();
      if (ev.kind === "power") playPower();
      if (ev.kind === "ghostEat") playEatGhost();
      if (ev.kind === "death") playDeath();
      if (ev.kind === "winFanfare") playWin();
      if (ev.kind === "ready") playReady();
    }
    syncHud(false);
  });
  return null;
}

function syncHud(force: boolean): void {
  const next = {
    status: engine.status,
    score: engine.score,
    lives: engine.lives,
    level: engine.level,
    remaining: engine.remainingPellets(),
    frightened: engine.frightenedTimer > 0,
  };
  const cur = useHud.getState();
  if (
    !force &&
    cur.status === next.status &&
    cur.score === next.score &&
    cur.lives === next.lives &&
    cur.level === next.level &&
    cur.remaining === next.remaining &&
    cur.frightened === next.frightened
  ) {
    return;
  }
  useHud.getState().setHud(next);
}
