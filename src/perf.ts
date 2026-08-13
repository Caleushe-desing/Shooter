/** Lightweight quality profile for old phones (~60fps target). */

const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
const coarse =
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(pointer: coarse)").matches;
const small =
  typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 900;

export const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || coarse || small;

/** Pixel ratio cap: 1 on phones, mild headroom on desktop. */
export const MAX_DPR = IS_MOBILE ? 1 : 1.25;

/** Skip expensive post/secondary UI work on mobile. */
export const LOW_GFX = IS_MOBILE;
