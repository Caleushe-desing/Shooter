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
          <div className="title-font text-2xl md:text-3xl text-[#ff6b9d] drop-shadow-[0_3px_0_#120814]">
            CACAMAN
          </div>
          <div className="text-sm md:text-base font-extrabold tracking-wide text-[#fff6fb]/95">
            Puntos {score.toString().padStart(6, "0")}
            {floater && floater.age < 0.8 && (
              <span className="ml-2 text-[#ffe566] title-font">{floater.text}</span>
            )}
          </div>
          {viewMode === "3d" && (
            <div className="mt-2">
              <MiniMap />
            </div>
          )}
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="font-black text-[#fff6fb]">Nivel {level}</div>
          <div className="text-sm text-[#ff9ec0] font-bold">Caca {remaining}</div>
          {frightened && (
            <div className="text-[#3dffe0] font-black text-sm">¡JABONES MOJADOS!</div>
          )}
          <div className="pointer-events-auto flex gap-2">
            <button
              className="rounded-xl bg-[#2a1830]/90 px-3 py-1 text-xs font-black border border-[#ff6b9d]/60 text-[#ff6b9d]"
              onClick={() => useHud.getState().toggleViewMode()}
            >
              {viewMode === "2d" ? "Vista 3D" : "Vista 2D"}
            </button>
            <button
              className="rounded-xl bg-[#2a1830]/90 px-3 py-1 text-xs font-black border border-[#ff6b9d]/60 text-[#ff6b9d]"
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
          <div className="title-font text-4xl md:text-6xl text-[#ffe566] drop-shadow-[0_4px_0_#120814] text-center px-4">
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
              className="inline-block w-6 h-7 rounded-sm bg-white border-2 border-[#ff6b9d]"
              title="vida"
            />
          ))}
        </div>
        <div className="hidden md:flex gap-3 text-[11px] font-bold text-[#fff6fb]/55">
          <span>WASD / flechas</span>
          <span>V vista 2D/3D</span>
          <span>P pausa</span>
          <span>M silencio</span>
        </div>
        <span className="md:hidden w-16" />
      </div>

      {status === "paused" && (
        <div className="absolute inset-0 grid place-items-center bg-[#1a1220]/70">
          <div className="title-font text-4xl text-[#ff6b9d]">PAUSA</div>
        </div>
      )}
    </div>
  );
}
