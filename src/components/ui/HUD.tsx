import { isMuted, setMuted } from "../../audio/sfx";
import { useHud } from "../../store/gameStore";
import { MiniMap } from "./MiniMap";

export function HUD() {
  const { score, lives, level, remaining, status, frightened, muted } = useHud();
  if (status === "menu") return null;

  return (
    <div className="pointer-events-none absolute inset-0 p-3 md:p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="title-font text-2xl md:text-3xl text-amber-200 drop-shadow-[0_3px_0_#000]">CACAMAN</div>
          <div className="text-sm md:text-base font-extrabold tracking-wide text-amber-50/90">
            Puntos {score.toString().padStart(6, "0")}
          </div>
          <div className="mt-2 pointer-events-none">
            <MiniMap />
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-amber-50">Nivel {level}</div>
          <div className="text-sm text-[#c4a574] font-bold">Caca {remaining}</div>
          {frightened && (
            <div className="text-cyan-300 font-black text-sm animate-pulse">¡JABONES MOJADOS!</div>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex gap-1">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <span key={i} className="text-2xl" title="vida">
              🧻
            </span>
          ))}
        </div>
        <div className="hidden md:flex gap-3 text-[11px] font-bold text-white/70">
          <span>WASD / flechas</span>
          <span>P pausa</span>
          <span>M silencio</span>
        </div>
        <button
          className="pointer-events-auto rounded-full bg-black/40 px-3 py-1 text-xs font-black"
          onClick={() => {
            useHud.getState().toggleMuted();
            setMuted(!isMuted());
          }}
        >
          {muted ? "SONIDO" : "MUTE"}
        </button>
      </div>

      {status === "paused" && (
        <div className="absolute inset-0 grid place-items-center bg-black/50">
          <div className="title-font text-4xl text-white">PAUSA</div>
        </div>
      )}
    </div>
  );
}
