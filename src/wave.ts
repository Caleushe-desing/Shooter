import { H, W, type Pt, mirrorX } from "./math";
import type { EnemyKind } from "./draw";

export type Slot = {
  id: number;
  row: number;
  col: number;
  kind: EnemyKind;
};

export const COLS = 12;
export const SLOT_GAP_X = 24;
export const SLOT_GAP_Y = 26;
export const FORM_OX = W / 2;
export const FORM_OY = 92;

export function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  let id = 0;
  const add = (row: number, cols: number[], kind: EnemyKind) => {
    for (const col of cols) slots.push({ id: id++, row, col, kind });
  };
  add(0, [3, 5, 7, 9], "boss");
  add(1, [2, 3, 4, 5, 6, 7, 8, 9], "moth");
  add(2, [2, 3, 4, 5, 6, 7, 8, 9], "moth");
  add(3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "bee");
  add(4, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "bee");
  return slots;
}

export function slotPos(
  slot: Slot,
  breathe: number,
  drift: number,
): Pt {
  const x = FORM_OX + drift + (slot.col - (COLS - 1) / 2) * SLOT_GAP_X * breathe;
  const y = FORM_OY + slot.row * SLOT_GAP_Y;
  return { x, y };
}

export type Convoy = {
  delay: number;
  slotIds: number[];
  pathFor: (slot: Slot, target: Pt) => Pt[];
};

function loopFromLeft(target: Pt): Pt[] {
  return [
    { x: -30, y: 70 },
    { x: 70, y: 70 },
    { x: 210, y: 150 },
    { x: 250, y: 230 },
    { x: 180, y: 280 },
    { x: 90, y: 220 },
    { x: 80, y: 120 },
    { x: target.x, y: target.y - 20 },
    target,
  ];
}

function diveFromTop(target: Pt, fromLeft: boolean): Pt[] {
  const side = fromLeft ? 70 : W - 70;
  return [
    { x: side, y: -30 },
    { x: side, y: 90 },
    { x: W / 2, y: 180 },
    { x: W - side, y: 90 },
    { x: target.x, y: target.y - 16 },
    target,
  ];
}

export function convoysForStage(slots: Slot[], challenge: boolean): Convoy[] {
  if (challenge) return [];
  const bees = slots.filter((s) => s.kind === "bee").map((s) => s.id);
  const moths = slots.filter((s) => s.kind === "moth").map((s) => s.id);
  const bosses = slots.filter((s) => s.kind === "boss").map((s) => s.id);
  return [
    {
      delay: 0.2,
      slotIds: bees.slice(0, 8),
      pathFor: (slot, target) => (slot.col < 6 ? loopFromLeft(target) : mirrorX(loopFromLeft({ x: W - target.x, y: target.y }))),
    },
    {
      delay: 2.1,
      slotIds: bees.slice(8, 16),
      pathFor: (_slot, target) => mirrorX(loopFromLeft({ x: W - target.x, y: target.y })),
    },
    {
      delay: 4.0,
      slotIds: moths.slice(0, 8),
      pathFor: (slot, target) => diveFromTop(target, slot.col < 6),
    },
    {
      delay: 5.8,
      slotIds: moths.slice(8, 16),
      pathFor: (slot, target) => diveFromTop(target, slot.col >= 6),
    },
    {
      delay: 7.4,
      slotIds: [...bosses, ...bees.slice(16)],
      pathFor: (_slot, target) => [
        { x: W / 2, y: -40 },
        { x: 80, y: 80 },
        { x: 280, y: 140 },
        { x: 180, y: 80 },
        target,
      ],
    },
  ];
}

export function challengeWaves(): { delay: number; kind: EnemyKind; path: Pt[] }[] {
  const waves: { delay: number; kind: EnemyKind; path: Pt[] }[] = [];
  const kinds: EnemyKind[] = ["bee", "moth", "bee", "boss", "moth"];
  kinds.forEach((kind, wi) => {
    for (let i = 0; i < 8; i++) {
      const left = wi % 2 === 0;
      const x0 = left ? -20 - i * 18 : W + 20 + i * 18;
      const x1 = left ? W + 40 : -40;
      const yArc = 70 + wi * 70 + Math.sin(i * 0.7) * 18;
      waves.push({
        delay: wi * 2.2 + i * 0.12,
        kind,
        path: [
          { x: x0, y: yArc },
          { x: W * 0.35, y: yArc + 40 },
          { x: W * 0.65, y: yArc + 90 },
          { x: x1, y: yArc + 40 },
        ],
      });
    }
  });
  return waves;
}

export function attackPath(from: Pt, playerX: number, loop: boolean): Pt[] {
  const dir = from.x < W / 2 ? 1 : -1;
  const px = playerX + dir * 16;
  const path: Pt[] = [
    from,
    { x: from.x + dir * 36, y: from.y + 36 },
    { x: px + dir * 50, y: 250 },
    { x: px - dir * 20, y: 360 },
    { x: px + dir * 10, y: 470 },
  ];
  if (loop) {
    path.push({ x: px - dir * 80, y: H + 20 });
    path.push({ x: from.x, y: -30 });
    path.push(from);
  } else {
    path.push({ x: px, y: H + 30 });
  }
  return path;
}

export function beamPath(from: Pt, playerX: number): Pt[] {
  const holdX = playerX;
  return [
    from,
    { x: from.x, y: from.y + 40 },
    { x: holdX, y: 300 },
  ];
}

export function returnPath(from: Pt, slot: Pt): Pt[] {
  return [
    from,
    { x: from.x, y: -30 },
    { x: slot.x, y: -20 },
    slot,
  ];
}

export function pointsFor(kind: EnemyKind, diving: boolean): number {
  if (kind === "bee") return diving ? 100 : 50;
  if (kind === "moth") return diving ? 160 : 80;
  return diving ? 400 : 150;
}
