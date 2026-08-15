import { clamp, raySphere } from "./math";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(clamp(2, 0, 1) === 1, "clamp high");
assert(raySphere({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: -5 }, 1) !== null, "hit");
assert(raySphere({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 4, y: 0, z: -5 }, 1) === null, "miss");
const t = raySphere({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: -10 }, 1);
assert(t !== null && Math.abs(t - 9) < 1e-6, "distance");
console.log("math tests ok");
