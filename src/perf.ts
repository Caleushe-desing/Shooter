/** Quality profile — smooth look, still mobile-friendly. */

const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
const coarse =
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(pointer: coarse)").matches;
const small =
  typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 900;

export const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || coarse || small;

/** Cap pixel ratio: enough for clean edges, avoid phone melt. */
export const MAX_DPR = IS_MOBILE
  ? Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1.5 : 1.5, 2)
  : Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2, 2);

/** Skip secondary UI work on the weakest devices only. */
export const LOW_GFX = IS_MOBILE && MAX_DPR <= 1.25;
