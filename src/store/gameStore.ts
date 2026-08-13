import { create } from "zustand";
import type { Dir, GameStatus } from "../game/types";

interface HudState {
  status: GameStatus;
  score: number;
  lives: number;
  level: number;
  remaining: number;
  frightened: boolean;
  muted: boolean;
  mobileDir: Dir | null;
  setHud: (partial: Partial<Omit<HudState, "setHud" | "setMobileDir" | "toggleMuted">>) => void;
  setMobileDir: (dir: Dir | null) => void;
  toggleMuted: () => void;
}

export const useHud = create<HudState>((set) => ({
  status: "menu",
  score: 0,
  lives: 3,
  level: 1,
  remaining: 0,
  frightened: false,
  muted: false,
  mobileDir: null,
  setHud: (partial) => set(partial),
  setMobileDir: (dir) => set({ mobileDir: dir }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
