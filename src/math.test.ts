import { clamp, followPolyline, hit, polylineLength } from "./math";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(clamp(5, 0, 3) === 3, "clamp high");
assert(clamp(-2, 0, 3) === 0, "clamp low");
assert(hit({ x: 0, y: 0 }, 5, { x: 6, y: 0 }, 2), "circles overlap");
assert(!hit({ x: 0, y: 0 }, 5, { x: 20, y: 0 }, 2), "circles miss");

const pts = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
];
assert(Math.abs(polylineLength(pts) - 20) < 1e-6, "polyline length");
const mid = followPolyline(pts, 0.25);
assert(Math.abs(mid.x - 5) < 1e-6 && Math.abs(mid.y) < 1e-6, "follow 25%");
const end = followPolyline(pts, 1);
assert(end.done && end.x === 10 && end.y === 10, "follow end");

console.log("math tests ok");
