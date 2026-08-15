import { isMuted, setMuted } from "../../audio/sfx";
import { THEME } from "../../constants";
import { engine } from "../../game/instance";
import { useHud } from "../../store/gameStore";

export function HUD() {
  const status = useHud((s) => s.status);
  const score = useHud((s) => s.score);
  const lives = useHud((s) => s.lives);
  const level = useHud((s) => s.level);
  const remaining = useHud((s) => s.remaining);
  const frightened = useHud((s) => s.frightened);
  const muted = useHud((s) => s.muted);
  const viewMode = useHud((s) => s.viewMode);

  if (status === "menu") return null;

  const floater = engine.floaters[engine.floaters.length - 1];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 md:p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="title-font text-2xl md:text-3xl text-[#ff00aa] drop-shadow-[0_0_8px_#ff00aa]">
            {THEME.title}
          </div>
          <div className="text-sm md:text-base font-black tracking-widest text-[#00ffff]">
            SCORE {score.toString().padStart(6, "0")}
            {floater && floater.age < 0.8 && (
              <span className="ml-2 text-[#ffff00]">{floater.text}</span>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="font-black text-[#ffff00]">LVL {level}</div>
          <div className="text-sm text-[#00ff66] font-black">
            {THEME.collectLabel} {remaining}
          </div>
          {frightened && (
            <div className="text-[#aa00ff] font-black text-sm animate-pulse">{THEME.frightened}</div>
          )}
          <div className="pointer-events-auto flex gap-2">
            <button
              className="rounded-none bg-black px-3 py-1 text-xs font-black border-2 border-[#00ffff] text-[#00ffff]"
              onClick={() => useHud.getState().toggleViewMode()}
            >
              {viewMode === "2d" ? "3D" : "2D"}
            </button>
            <button
              className="rounded-none bg-black px-3 py-1 text-xs font-black border-2 border-[#ff6600] text-[#ff6600]"
              onClick={() => {
                useHud.getState().toggleMuted();
                setMuted(!isMuted());
              }}
            >
              {muted ? "SND" : "MUTE"}
            </button>
          </div>
        </div>
      </div>

      {(status === "ready" || status === "dying" || status === "levelclear") && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="title-font text-4xl md:text-6xl text-[#ffff00] drop-shadow-[0_0_12px_#ff00aa] text-center px-4">
            {status === "ready" && THEME.ready}
            {status === "dying" && THEME.death}
            {status === "levelclear" && THEME.clear}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between">
        <div className="flex gap-2 items-end">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <span
              key={i}
              className="inline-block w-5 h-5 rounded-full bg-[#ffcc00] border-2 border-[#ff00aa]"
              title="vida"
            />
          ))}
        </div>
        <div className="hidden md:flex gap-3 text-[10px] font-black text-[#00ffff]/70 tracking-widest">
          {viewMode === "3d" ? <span>1 DESLIZ = 90°</span> : <span>SWIPE</span>}
          <span>V 2D/3D</span>
          <span>P PAUSE</span>
        </div>
        <div className="md:hidden text-[9px] font-black text-[#00ffff]/60 tracking-widest">
          {viewMode === "3d" ? "1 DESLIZ = 90°" : "DESLIZÁ"}
        </div>
      </div>

      {status === "paused" && (
        <div className="absolute inset-0 grid place-items-center bg-black/80">
          <div className="title-font text-4xl text-[#ff00aa]">PAUSE</div>
        </div>
      )}
    </div>
  );
}
