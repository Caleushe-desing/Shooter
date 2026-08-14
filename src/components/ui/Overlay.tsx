import { SOAP_NAMES, THEME } from "../../constants";
import { useHud, type ViewMode } from "../../store/gameStore";

interface OverlayProps {
  onStart: () => void;
}

export function Overlay({ onStart }: OverlayProps) {
  const status = useHud((s) => s.status);
  const score = useHud((s) => s.score);
  const viewMode = useHud((s) => s.viewMode);

  if (status !== "menu" && status !== "gameover") return null;

  const gameover = status === "gameover";
  const pick = (mode: ViewMode) => useHud.getState().setViewMode(mode);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-4">
      <div className="max-w-lg w-full text-center rounded-none border-4 border-[#00ffff] bg-black px-6 py-8 shadow-[0_0_40px_#ff00aa]">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-[#ffcc00] border-4 border-[#ff00aa]" />
        <h1 className="title-font text-4xl md:text-5xl text-[#ff00aa] drop-shadow-[0_0_10px_#00ffff]">
          {THEME.title}
        </h1>
        <p className="mt-3 font-black tracking-wide text-[#ffff00]">{gameover ? THEME.gameover : THEME.tagline}</p>
        {!gameover && (
          <>
            <ul className="mt-5 text-left text-xs font-black text-[#00ffff] space-y-2 mx-auto max-w-sm tracking-wide">
              <li>▶ QUILTRO VS LA CALLE</li>
              <li>▶ JUNTA LUCAS · COMPLETO = POWER</li>
              <li>
                ▶ {SOAP_NAMES.blinky} / {SOAP_NAMES.pinky} / {SOAP_NAMES.inky} / {SOAP_NAMES.clyde}
              </li>
              <li>▶ 3D: SIEMPRE DESDE LA ESPALDA</li>
              <li>▶ DESLIZÁ · ARRIBA = ADELANTE</li>
            </ul>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => pick("3d")}
                className={`rounded-none px-4 py-2 text-sm font-black border-2 ${
                  viewMode === "3d"
                    ? "bg-[#ff00aa] text-black border-[#ffff00]"
                    : "bg-black text-[#00ffff] border-[#00ffff]"
                }`}
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => pick("2d")}
                className={`rounded-none px-4 py-2 text-sm font-black border-2 ${
                  viewMode === "2d"
                    ? "bg-[#00ff66] text-black border-[#ffff00]"
                    : "bg-black text-[#ff6600] border-[#ff6600]"
                }`}
              >
                2D
              </button>
            </div>
          </>
        )}
        {gameover && <p className="mt-4 title-font text-[#ffff00] text-2xl">{score}</p>}
        <button
          onClick={onStart}
          className="mt-6 title-font rounded-none bg-[#ffff00] text-black px-8 py-3 text-xl border-4 border-[#ff00aa] hover:bg-[#00ffff] active:scale-95 transition"
        >
          {gameover ? "CONTINUE?" : "INSERT COIN"}
        </button>
        <p className="mt-5 text-[10px] font-black text-[#00ff66] tracking-widest">
          SWIPE · WASD · V VIEW · P PAUSE
        </p>
      </div>
    </div>
  );
}
