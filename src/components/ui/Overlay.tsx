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
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#140e0c]/75 p-4">
      <div className="max-w-lg w-full text-center rounded-3xl border border-amber-200/20 bg-[#2a1c16]/90 px-6 py-8 shadow-2xl">
        <div className="mx-auto mb-3 h-12 w-16 rounded-md bg-[#f7f4ee] border-4 border-[#c4a574] relative">
          <span className="absolute inset-y-1 left-1/2 -ml-2 w-4 rounded-sm bg-[#c4a574]/80" />
        </div>
        <h1 className="title-font text-4xl md:text-5xl text-amber-200 drop-shadow-[0_4px_0_#000]">CACAMAN</h1>
        <p className="mt-3 font-extrabold text-amber-50/90">
          {gameover
            ? "Se acabó el papel"
            : "Pac-Man en el baño: tú eres un rollo de papel higiénico"}
        </p>
        {!gameover && (
          <>
            <ul className="mt-5 text-left text-sm font-bold text-amber-50/80 space-y-2 mx-auto max-w-sm">
              <li>Recoge toda la caca del laberinto</li>
              <li>Los jabones te persiguen (Lejía, Espuma, Gel y Jabón)</li>
              <li>Las cacas grandes asustan a los jabones: ¡atácalos!</li>
            </ul>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => pick("3d")}
                className={`rounded-xl px-4 py-2 text-sm font-black border ${
                  viewMode === "3d"
                    ? "bg-amber-300 text-[#2a1c16] border-amber-200"
                    : "bg-black/35 text-amber-50 border-white/15"
                }`}
              >
                Vista 3D
              </button>
              <button
                type="button"
                onClick={() => pick("2d")}
                className={`rounded-xl px-4 py-2 text-sm font-black border ${
                  viewMode === "2d"
                    ? "bg-amber-300 text-[#2a1c16] border-amber-200"
                    : "bg-black/35 text-amber-50 border-white/15"
                }`}
              >
                Vista 2D
              </button>
            </div>
          </>
        )}
        {gameover && <p className="mt-4 title-font text-amber-200 text-2xl">Puntos {score}</p>}
        <button
          onClick={onStart}
          className="mt-6 title-font rounded-2xl bg-amber-300 text-[#2a1c16] px-8 py-3 text-xl hover:bg-amber-200 active:scale-95 transition"
        >
          {gameover ? "Otra partida" : "Jugar"}
        </button>
        <p className="mt-5 text-xs font-bold text-white/50">
          WASD o flechas · móvil: stick · V cambia 2D/3D
        </p>
      </div>
    </div>
  );
}
