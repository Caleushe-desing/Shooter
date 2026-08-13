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
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1520]/80 p-4">
      <div className="max-w-lg w-full text-center rounded-none border-2 border-[#5dffd2]/45 bg-[#102033]/95 px-6 py-8 shadow-[0_0_40px_rgba(93,255,210,0.12)]">
        <div className="mx-auto mb-3 h-12 w-16 rounded-sm bg-[#f5fffd] border-4 border-[#5dffd2] relative">
          <span className="absolute inset-y-1 left-1/2 -ml-2 w-4 rounded-sm bg-[#7ad1c6]/90" />
        </div>
        <h1 className="title-font text-4xl md:text-5xl text-[#5dffd2] drop-shadow-[0_4px_0_#031018]">
          CACAMAN
        </h1>
        <p className="mt-3 font-extrabold text-[#e8fbff]/90">
          {gameover
            ? "Se acabó el papel"
            : "Pac-Man en el baño digital: tú eres un rollo de papel higiénico"}
        </p>
        {!gameover && (
          <>
            <ul className="mt-5 text-left text-sm font-bold text-[#e8fbff]/75 space-y-2 mx-auto max-w-sm">
              <li>Recoge toda la caca del laberinto</li>
              <li>Los jabones te persiguen (Lejía, Espuma, Gel y Jabón)</li>
              <li>Las cacas grandes asustan a los jabones: ¡atácalos!</li>
            </ul>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => pick("3d")}
                className={`rounded-none px-4 py-2 text-sm font-black border ${
                  viewMode === "3d"
                    ? "bg-[#5dffd2] text-[#0b1520] border-[#5dffd2]"
                    : "bg-black/35 text-[#e8fbff] border-[#5dffd2]/25"
                }`}
              >
                Vista 3D
              </button>
              <button
                type="button"
                onClick={() => pick("2d")}
                className={`rounded-none px-4 py-2 text-sm font-black border ${
                  viewMode === "2d"
                    ? "bg-[#5dffd2] text-[#0b1520] border-[#5dffd2]"
                    : "bg-black/35 text-[#e8fbff] border-[#5dffd2]/25"
                }`}
              >
                Vista 2D
              </button>
            </div>
          </>
        )}
        {gameover && <p className="mt-4 title-font text-[#ffe566] text-2xl">Puntos {score}</p>}
        <button
          onClick={onStart}
          className="mt-6 title-font rounded-none bg-[#5dffd2] text-[#0b1520] px-8 py-3 text-xl hover:bg-[#7af0ff] active:scale-95 transition border-2 border-[#e8fbff]/40"
        >
          {gameover ? "Otra partida" : "Jugar"}
        </button>
        <p className="mt-5 text-xs font-bold text-[#e8fbff]/45">
          WASD o flechas · móvil: stick · V cambia 2D/3D
        </p>
      </div>
    </div>
  );
}
