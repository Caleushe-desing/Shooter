import { unlockAudio } from "./audio";
import { Game, type Mode } from "./game";
import "./style.css";

const canvas = document.querySelector("#view");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Falta canvas");

const game = new Game(canvas);
const menu = el("#menu");
const hud = el("#hud");
const results = el("#results");
const mobile = el("#mobile");
const scoreEl = el("#score");
const timeEl = el("#time");
const accEl = el("#acc");
const modeTag = el("#mode-tag");
const hint = el("#hint");
const knob = el("#knob");
const stick = el("#stick");
const fireBtn = el("#fire");

const coarse = window.matchMedia("(pointer: coarse)").matches;
if (coarse) {
  mobile.hidden = false;
  hint.textContent = "Stick mover · arrastrá derecha para mirar · DISPARO";
}

game.setHud(() => {
  scoreEl.textContent = String(game.score);
  timeEl.textContent = game.timeLeft.toFixed(1);
  accEl.textContent = `${game.accuracy()}%`;
  modeTag.textContent = game.mode.toUpperCase();
});

game.setOver(() => {
  hud.hidden = true;
  results.hidden = false;
  el("#r-score").textContent = String(game.score);
  el("#r-acc").textContent = `${game.accuracy()}%`;
  el("#r-hits").textContent = String(game.hits);
  el("#r-shots").textContent = String(game.shots);
});

function showPlay(): void {
  menu.hidden = true;
  results.hidden = true;
  hud.hidden = false;
}

menu.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    unlockAudio();
    showPlay();
    game.start(btn.dataset.mode as Mode);
    if (!coarse) canvas.requestPointerLock();
  });
});

el("#again").addEventListener("click", () => {
  unlockAudio();
  showPlay();
  game.start(game.mode);
  if (!coarse) canvas.requestPointerLock();
});
el("#back").addEventListener("click", () => {
  game.stopToMenu();
  results.hidden = true;
  hud.hidden = true;
  menu.hidden = false;
});

const keys = new Set<string>();
function syncMove(): void {
  if (stickActive) return;
  let x = 0;
  let z = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) z -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) z += 1;
  game.setMove(x, z);
}

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Space") {
    e.preventDefault();
    game.setFiring(true);
  }
  if (e.code === "Escape") document.exitPointerLock();
  syncMove();
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  if (e.code === "Space") game.setFiring(false);
  syncMove();
});

let dragLook = false;
let dragX = 0;
let dragY = 0;

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === canvas) {
    game.addLook(e.movementX, e.movementY);
    return;
  }
  if (!dragLook || !game.playing) return;
  game.addLook(e.clientX - dragX, e.clientY - dragY);
  dragX = e.clientX;
  dragY = e.clientY;
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !game.playing) return;
  unlockAudio();
  if (!coarse && document.pointerLockElement !== canvas) {
    void canvas.requestPointerLock();
    dragLook = true;
    dragX = e.clientX;
    dragY = e.clientY;
  }
  game.setFiring(true);
});
window.addEventListener("mouseup", () => {
  dragLook = false;
  game.setFiring(false);
});

let lookId: number | null = null;
let lastX = 0;
let lastY = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (!coarse || !game.playing) return;
  if (e.clientX < innerWidth * 0.42) return;
  lookId = e.pointerId;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (lookId !== e.pointerId) return;
  game.addLook(e.clientX - lastX, e.clientY - lastY);
  lastX = e.clientX;
  lastY = e.clientY;
});
const endLook = (e: PointerEvent) => {
  if (lookId === e.pointerId) lookId = null;
};
canvas.addEventListener("pointerup", endLook);
canvas.addEventListener("pointercancel", endLook);

let stickActive = false;
const STICK_R = 44;
function stickFrom(x: number, y: number): void {
  const r = stick.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = x - cx;
  let dy = y - cy;
  const len = Math.hypot(dx, dy);
  if (len > STICK_R) {
    dx = (dx / STICK_R) * STICK_R;
    dy = (dy / STICK_R) * STICK_R;
  }
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  game.setMove(dx / STICK_R, dy / STICK_R);
}
function stickReset(): void {
  stickActive = false;
  knob.style.transform = "translate(-50%, -50%)";
  game.setMove(0, 0);
}
stick.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  stickActive = true;
  stick.setPointerCapture(e.pointerId);
  stickFrom(e.clientX, e.clientY);
});
stick.addEventListener("pointermove", (e) => {
  if (!stickActive) return;
  stickFrom(e.clientX, e.clientY);
});
stick.addEventListener("pointerup", stickReset);
stick.addEventListener("pointercancel", stickReset);

fireBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  unlockAudio();
  game.setFiring(true);
});
const fireOff = () => game.setFiring(false);
fireBtn.addEventListener("pointerup", fireOff);
fireBtn.addEventListener("pointercancel", fireOff);
fireBtn.addEventListener("pointerleave", fireOff);

window.addEventListener("resize", () => game.resize());

function loop(): void {
  game.tick();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function el(sel: string): HTMLElement {
  const n = document.querySelector(sel);
  if (!(n instanceof HTMLElement)) throw new Error(sel);
  return n;
}
