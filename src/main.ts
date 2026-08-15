import { isMuted, toggleMute, unlockAudio } from "./audio";
import { Game } from "./game";
import { bindInput, pollInput } from "./input";
import { H, W } from "./math";
import "./style.css";

const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Falta #game");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("No hay canvas 2D");

canvas.width = W;
canvas.height = H;
bindInput(canvas);

const game = new Game();
let last = performance.now();
let mutedIcon = false;

window.addEventListener("pointerdown", () => unlockAudio(), { once: true });
window.addEventListener("keydown", () => unlockAudio(), { once: true });

function frame(now: number): void {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  const input = pollInput();
  if (input.mute) mutedIcon = toggleMute();
  game.update(dt, input);
  game.draw(ctx!);
  if (mutedIcon || isMuted()) {
    ctx!.save();
    ctx!.font = '8px "Press Start 2P", monospace';
    ctx!.fillStyle = "#5a6a88";
    ctx!.textAlign = "left";
    ctx!.fillText("MUTE", 8, H - 10);
    ctx!.restore();
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
