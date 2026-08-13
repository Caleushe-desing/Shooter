import { create } from "zustand";
import type { Dir, GameStatus } from "../game/types";

export type ViewMode = "3d" | "2d";

interface HudState {
  status: GameStatus;
  score: number;
  lives: number;
  level: number;
  remaining: number;
  frightened: boolean;
  muted: boolean;
  viewMode: ViewMode;
  mobileDir: Dir | null;
  setHud: (partial: Partial<Omit<HudState, "setHud" | "setMobileDir" | "toggleMuted" | "toggleViewMode" | "setViewMode">>) => void;
  setMobileDir: (dir: Dir | null) => void;
  toggleMuted: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

function loadViewMode(): ViewMode {
  try {
    const v = localStorage.getItem("cacaman-view");
    if (v === "2d" || v === "3d") return v;
  } catch {
    /* ignore */
  }
  return "3d";
}

export const useHud = create<HudState>((set, get) => ({
  status: "menu",
  score: 0,
  lives: 3,
  level: 1,
  remaining: 0,
  frightened: false,
  muted: false,
  viewMode: loadViewMode(),
  mobileDir: null,
  setHud: (partial) => set(partial),
  setMobileDir: (dir) => set({ mobileDir: dir }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setViewMode: (mode) => {
    try {
      localStorage.setItem("cacaman-view", mode);
    } catch {
      /* ignore */
    }
    set({ viewMode: mode });
  },
  toggleViewMode: () => {
    const next = get().viewMode === "3d" ? "2d" : "3d";
    get().setViewMode(next);
  },
}));
