import { isMuted, setMuted } from "../../audio/sfx";
import { engine } from "../../game/instance";
import { useHud } from "../../store/gameStore";
import { MiniMap } from "./MiniMap";

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
    <div className="pointer-events-none absolute inset-0 p-3 md:p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="title-font text-2xl md:text-3xl text-amber-200 drop-shadow-[0_3px_0_#000]">
            CACAMAN
          </div>
          <div className="text-sm md:text-base font-extrabold tracking-wide text-amber-50/90">
            Puntos {score.toString().padStart(6, "0")}
            {floater && floater.age < 0.8 && (
              <span className="ml-2 text-yellow-300 title-font">{floater.text}</span>
            )}
          </div>
          {viewMode === "3d" && (
            <div className="mt-2">
              <MiniMap />
            </div>
          )}
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="font-black text-amber-50">Nivel {level}</div>
          <div className="text-sm text-[#c4a574] font-bold">Caca {remaining}</div>
          {frightened && (
            <div className="text-cyan-300 font-black text-sm">¡JABONES MOJADOS!</div>
          )}
          <div className="pointer-events-auto flex gap-2">
            <button
              className="rounded-full bg-black/45 px-3 py-1 text-xs font-black border border-white/20"
              onClick={() => useHud.getState().toggleViewMode()}
            >
              {viewMode === "2d" ? "Vista 3D" : "Vista 2D"}
            </button>
            <button
              className="rounded-full bg-black/45 px-3 py-1 text-xs font-black border border-white/20"
              onClick={() => {
                useHud.getState().toggleMuted();
                setMuted(!isMuted());
              }}
            >
              {muted ? "SONIDO" : "MUTE"}
            </button>
          </div>
        </div>
      </div>

      {(status === "ready" || status === "dying" || status === "levelclear") && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="title-font text-4xl md:text-6xl text-yellow-300 drop-shadow-[0_4px_0_#000] text-center px-4">
            {status === "ready" && "¡LISTO!"}
            {status === "dying" && "¡AY!"}
            {status === "levelclear" && "¡BAÑO LIMPIO!"}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between">
        <div className="flex gap-2 items-end">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <span
              key={i}
              className="inline-block w-6 h-7 rounded-sm bg-[#f7f4ee] border-2 border-[#c4a574]"
              title="vida"
            />
          ))}
        </div>
        <div className="hidden md:flex gap-3 text-[11px] font-bold text-white/70">
          <span>WASD / flechas</span>
          <span>V vista 2D/3D</span>
          <span>P pausa</span>
          <span>M silencio</span>
        </div>
        <span className="md:hidden w-16" />
      </div>

      {status === "paused" && (
        <div className="absolute inset-0 grid place-items-center bg-black/50">
          <div className="title-font text-4xl text-white">PAUSA</div>
        </div>
      )}
    </div>
  );
}
