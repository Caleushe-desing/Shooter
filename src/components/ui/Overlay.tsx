import { useHud } from "../../store/gameStore";

interface OverlayProps {
  onStart: () => void;
}

export function Overlay({ onStart }: OverlayProps) {
  const { status, score, level } = useHud();

  if (status !== "menu" && status !== "gameover" && status !== "levelclear") return null;

  const gameover = status === "gameover";
  const cleared = status === "levelclear";

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#140e0c]/75 p-4">
      <div className="max-w-lg w-full text-center rounded-3xl border border-amber-200/20 bg-[#2a1c16]/90 px-6 py-8 shadow-2xl">
        <div className="text-5xl mb-2">🧻</div>
        <h1 className="title-font text-4xl md:text-5xl text-amber-200 drop-shadow-[0_4px_0_#000]">CACAMAN</h1>
        <p className="mt-3 font-extrabold text-amber-50/90">
          {gameover
            ? "Se acabó el papel"
            : cleared
              ? `¡Baño limpio! Nivel ${level} completo`
              : "Pac-Man en 3D, pero tú eres un rollo de papel higiénico"}
        </p>
        {!gameover && !cleared && (
          <ul className="mt-5 text-left text-sm font-bold text-amber-50/80 space-y-2 mx-auto max-w-sm">
            <li>🧻 Recorre el baño en tercera persona</li>
            <li>💩 Recoge toda la caca del laberinto</li>
            <li>🧼 Los jabones te persiguen (Lejía, Espuma, Gel y Jabón)</li>
            <li>💩 Las cacas grandes asustan a los jabones: ¡atácalos!</li>
          </ul>
        )}
        {gameover && (
          <p className="mt-4 title-font text-amber-200 text-2xl">Puntos {score}</p>
        )}
        {!cleared && (
          <button
            onClick={onStart}
            className="mt-6 title-font rounded-2xl bg-amber-300 text-[#2a1c16] px-8 py-3 text-xl hover:bg-amber-200 active:scale-95 transition"
          >
            {gameover ? "Otra partida" : "Jugar"}
          </button>
        )}
        {cleared && <p className="mt-6 title-font text-yellow-300 animate-pulse">Siguiente nivel…</p>}
        <p className="mt-5 text-xs font-bold text-white/50">WASD o flechas · móvil: cruz de dirección</p>
      </div>
    </div>
  );
}
