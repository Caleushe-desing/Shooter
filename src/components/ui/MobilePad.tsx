import type { Dir } from "../../game/types";
import { useHud } from "../../store/gameStore";

interface MobilePadProps {
  onDir: (dir: Dir) => void;
}

export function MobilePad({ onDir }: MobilePadProps) {
  const status = useHud((s) => s.status);
  const setMobileDir = useHud((s) => s.setMobileDir);

  const press = (dir: Dir) => {
    setMobileDir(dir);
    onDir(dir);
  };
  const release = () => setMobileDir(null);

  if (status === "menu" || status === "gameover") {
    return null;
  }

  return (
    <div className="md:hidden absolute bottom-5 right-4 z-20 select-none">
      <div className="grid grid-cols-3 gap-1 w-44">
        <span />
        <PadBtn label="▲" onPress={() => press("up")} onRelease={release} />
        <span />
        <PadBtn label="◀" onPress={() => press("left")} onRelease={release} />
        <PadBtn label="▼" onPress={() => press("down")} onRelease={release} />
        <PadBtn label="▶" onPress={() => press("right")} onRelease={release} />
      </div>
    </div>
  );
}

function PadBtn({
  label,
  onPress,
  onRelease,
}: {
  label: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      className="h-14 rounded-2xl bg-black/55 text-white text-xl font-black border border-white/20 active:bg-amber-300 active:text-black"
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
    >
      {label}
    </button>
  );
}
