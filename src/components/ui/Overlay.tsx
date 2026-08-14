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
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090614]/82 p-4">
      <div className="max-w-lg w-full text-center rounded-none border-4 border-[#ff2d95] bg-[#160b24]/95 px-6 py-8 shadow-[0_0_60px_rgba(255,45,149,0.35)] rotate-[-0.5deg]">
        <div className="mx-auto mb-3 h-10 w-14 rounded-full bg-[#f4c27a] border-4 border-[#ffe600] relative">
          <span className="absolute -right-1 top-1 h-3 w-3 rounded-full bg-[#d52b1e]" />
        </div>
        <h1 className="title-font text-4xl md:text-5xl text-[#ff2d95] drop-shadow-[0_4px_0_#ffe600]">
          {THEME.title}
        </h1>
        <p className="mt-3 font-extrabold text-[#fff7fb]">
          {gameover ? THEME.gameover : THEME.tagline}
        </p>
        {!gameover && (
          <>
            <ul className="mt-5 text-left text-sm font-bold text-[#fff7fb]/80 space-y-2 mx-auto max-w-sm">
              <li>Eres un quiltro corriéndote Santiago de noche</li>
              <li>
                Junta las lucas; el completo te pone invencible ({THEME.powerLabel})
              </li>
              <li>
                Te persiguen {SOAP_NAMES.blinky}, {SOAP_NAMES.pinky}, {SOAP_NAMES.inky} y{" "}
                {SOAP_NAMES.clyde}
              </li>
              <li>Nada de baño: esto es la cagá real, cachai</li>
            </ul>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => pick("3d")}
                className={`rounded-none px-4 py-2 text-sm font-black border-2 ${
                  viewMode === "3d"
                    ? "bg-[#ffe600] text-[#090614] border-[#ff2d95]"
                    : "bg-black/40 text-[#fff7fb] border-[#00d4c8]/40"
                }`}
              >
                Vista 3D
              </button>
              <button
                type="button"
                onClick={() => pick("2d")}
                className={`rounded-none px-4 py-2 text-sm font-black border-2 ${
                  viewMode === "2d"
                    ? "bg-[#ffe600] text-[#090614] border-[#ff2d95]"
                    : "bg-black/40 text-[#fff7fb] border-[#00d4c8]/40"
                }`}
              >
                Vista 2D
              </button>
            </div>
          </>
        )}
        {gameover && <p className="mt-4 title-font text-[#ffe600] text-2xl">Puntos {score}</p>}
        <button
          onClick={onStart}
          className="mt-6 title-font rounded-none bg-[#ff2d95] text-[#fff7fb] px-8 py-3 text-xl hover:bg-[#ff4aa8] active:scale-95 transition border-4 border-[#ffe600]"
        >
          {gameover ? "Otra vuelta" : "Salir a la calle"}
        </button>
        <p className="mt-5 text-xs font-bold text-[#fff7fb]/45">
          WASD o flechas · móvil: stick · V cambia 2D/3D
        </p>
      </div>
    </div>
  );
}
