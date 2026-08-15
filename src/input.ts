import { W } from "./math";

export type InputState = {
  left: boolean;
  right: boolean;
  fire: boolean;
  start: boolean;
  pause: boolean;
  mute: boolean;
  touchX: number | null;
};

const keys = new Set<string>();
let startEdge = false;
let pauseEdge = false;
let muteEdge = false;
let pointerX: number | null = null;
let pointerDown = false;

function isFireKey(code: string): boolean {
  return code === "Space" || code === "KeyZ" || code === "KeyK" || code === "ControlLeft";
}

export function bindInput(canvas: HTMLCanvasElement): void {
  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (e.code === "Enter" || e.code === "KeyS") startEdge = true;
    if (e.code === "Escape" || e.code === "KeyP") pauseEdge = true;
    if (e.code === "KeyM") muteEdge = true;
    if (isFireKey(e.code) || e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "Space") {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });

  const toFieldX = (clientX: number) => {
    const r = canvas.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * W;
  };

  const onDown = (x: number) => {
    pointerDown = true;
    pointerX = toFieldX(x);
    startEdge = true;
  };
  const onMove = (x: number) => {
    if (pointerDown) pointerX = toFieldX(x);
  };
  const onUp = () => {
    pointerDown = false;
    pointerX = null;
  };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    onDown(e.clientX);
  });
  canvas.addEventListener("pointermove", (e) => onMove(e.clientX));
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
}

export function pollInput(): InputState {
  const start = startEdge;
  const pause = pauseEdge;
  const mute = muteEdge;
  startEdge = false;
  pauseEdge = false;
  muteEdge = false;
  return {
    left: keys.has("ArrowLeft") || keys.has("KeyA"),
    right: keys.has("ArrowRight") || keys.has("KeyD"),
    fire:
      keys.has("Space") ||
      keys.has("KeyZ") ||
      keys.has("KeyK") ||
      keys.has("ControlLeft") ||
      pointerDown,
    start,
    pause,
    mute,
    touchX: pointerX,
  };
}
